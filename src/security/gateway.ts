/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { AgentAction, GatewayEvent, SecurityResult } from '../types/agentguard.ts';
import { evaluateAction } from './evaluator.ts';
import { checkIntent } from './intentChecker.ts';

export interface InterceptResult {
  executed: boolean;
  decision: 'ALLOW' | 'REQUIRE_APPROVAL' | 'BLOCK';
  message: string;
  security: SecurityResult;
  intent: ReturnType<typeof checkIntent>;
}

export class AgentGuardGateway {
  private executionLog: GatewayEvent[] = [];

  public intercept(userRequest: string, proposedAction: AgentAction, agentName = 'AI Agent'): InterceptResult {
    const intentResult = checkIntent(userRequest, proposedAction);
    const securityResult = evaluateAction(proposedAction, intentResult);

    const isExecuted = securityResult.decision === 'ALLOW';
    let message = '';

    if (securityResult.decision === 'ALLOW') {
      message = 'AgentGuard authorized the tool call for immediate execution.';
    } else if (securityResult.decision === 'REQUIRE_APPROVAL') {
      message = 'AgentGuard paused execution: Human-in-the-Loop authorization required.';
    } else {
      message = 'AgentGuard blocked the unsafe tool call to protect user assets.';
    }

    const event: GatewayEvent = {
      id: Date.now() + Math.floor(Math.random() * 1000),
      agent: agentName,
      name: proposedAction.action,
      decision: securityResult.decision,
      risk: securityResult.risk_score,
      level: securityResult.risk_level,
      time: new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }),
      user_request: userRequest,
      action_name: proposedAction.action,
      reason: securityResult.reason,
    };

    this.executionLog.unshift(event);
    if (this.executionLog.length > 50) {
      this.executionLog.pop();
    }

    return {
      executed: isExecuted,
      decision: securityResult.decision,
      message,
      security: securityResult,
      intent: intentResult,
    };
  }

  public async executeAction(action: AgentAction, intent?: any, agentName = 'AI Agent') {
    const userRequest = intent?.reason || action.parameters?.request || 'Agent requested execution';
    const res = this.intercept(userRequest, action, agentName);
    return {
      executed: res.executed,
      status: res.decision === 'BLOCK' ? 'BLOCKED' : res.decision === 'ALLOW' ? 'EXECUTED' : 'PENDING_APPROVAL',
      decision: res.decision,
      approval_token: res.security.approval_token,
      message: res.message,
      security: res.security,
      intent: res.intent,
    };
  }

  public getHistory(): GatewayEvent[] {
    return [...this.executionLog];
  }

  public clearHistory(): void {
    this.executionLog = [];
  }
}

export const defaultGateway = new AgentGuardGateway();
