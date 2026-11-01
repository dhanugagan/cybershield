/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SecurityResult } from '../types/agentguard';

export interface CacheTelemetry {
  hits: number;
  misses: number;
  total: number;
  hitRatio: number;
  avgLatencyMs: number;
  throughputOpsSec: number;
}

/**
 * High-performance in-memory LRU evaluation cache.
 * Provides sub-millisecond evaluation for repeated or parameterized agent actions.
 */
export class EvaluationCache {
  private cache = new Map<string, { result: SecurityResult; timestamp: number }>();
  private readonly maxSize: number;
  private hits = 0;
  private misses = 0;
  private latencySamples: number[] = [];

  constructor(maxSize = 250) {
    this.maxSize = maxSize;
  }

  private generateKey(userRequest: string, action: { action: string; parameters: Record<string, unknown> }): string {
    const serialized = `${(userRequest || '').trim().toLowerCase()}|${action.action}|${JSON.stringify(action.parameters || {})}`;
    // Fast djb2-like 32-bit hash for speed
    let hash = 5381;
    for (let i = 0; i < serialized.length; i++) {
      hash = ((hash << 5) + hash) + serialized.charCodeAt(i);
      hash |= 0;
    }
    return `ag_eval_${hash}`;
  }

  public get(userRequest: string, action: { action: string; parameters: Record<string, unknown> }): SecurityResult | null {
    const key = this.generateKey(userRequest, action);
    const entry = this.cache.get(key);
    if (!entry) {
      this.misses++;
      return null;
    }

    // Refresh LRU order
    this.cache.delete(key);
    this.cache.set(key, entry);
    this.hits++;
    return entry.result;
  }

  public set(userRequest: string, action: { action: string; parameters: Record<string, unknown> }, result: SecurityResult): void {
    const key = this.generateKey(userRequest, action);
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) this.cache.delete(oldestKey);
    }
    this.cache.set(key, { result, timestamp: Date.now() });
  }

  public recordLatency(ms: number): void {
    this.latencySamples.push(ms);
    if (this.latencySamples.length > 1000) {
      this.latencySamples.shift();
    }
  }

  public getTelemetry(): CacheTelemetry {
    const total = this.hits + this.misses;
    const hitRatio = total === 0 ? 0 : Math.round((this.hits / total) * 100);
    const sum = this.latencySamples.reduce((a, b) => a + b, 0);
    const avgLatencyMs = this.latencySamples.length === 0 ? 0.25 : Math.round((sum / this.latencySamples.length) * 100) / 100;
    const throughputOpsSec = avgLatencyMs > 0 ? Math.round(1000 / avgLatencyMs) : 4000;

    return {
      hits: this.hits,
      misses: this.misses,
      total,
      hitRatio,
      avgLatencyMs,
      throughputOpsSec,
    };
  }

  public clear(): void {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
    this.latencySamples = [];
  }
}

export const evaluationCache = new EvaluationCache();
