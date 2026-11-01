/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Sparkles, X, Shield, RefreshCw, Check, ArrowRight } from 'lucide-react';
import { generateGeminiPolicy } from '../services/api';
import { GeminiPolicyResult } from '../types/agentguard';

interface GeminiPolicyGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyPolicy?: (policy: GeminiPolicyResult) => void;
}

export const GeminiPolicyGeneratorModal: React.FC<GeminiPolicyGeneratorModalProps> = ({
  isOpen,
  onClose,
  onApplyPolicy,
}) => {
  const [description, setDescription] = useState(
    'An automated customer support agent that answers student queries, reads campus FAQs, and prepares draft email tickets for humans to review.'
  );
  const [loading, setLoading] = useState(false);
  const [policy, setPolicy] = useState<GeminiPolicyResult | null>(null);

  if (!isOpen) return null;

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await generateGeminiPolicy(description);
      setPolicy(res);
    } catch {
      // handled
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-labelledby="policy-title"
    >
      <div className="bg-slate-900 border border-cyan-500/30 rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl text-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 id="policy-title" className="text-lg font-bold text-white m-0">
                Google Gemini AI Security Policy Synthesizer
              </h2>
              <p className="text-xs text-slate-400 m-0">
                Describe your autonomous agent's purpose to auto-generate least-privilege guardrails.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4">
          <form onSubmit={handleGenerate} className="space-y-3">
            <label className="block text-xs font-bold text-slate-300">
              Agent Purpose & Mission Description:
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-cyan-500 leading-relaxed"
              placeholder="e.g. DevOps assistant that queries server logs and alerts on-call engineers via Slack..."
              required
            />
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white text-xs font-bold transition cursor-pointer disabled:opacity-50"
              >
                {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                <span>{loading ? 'Synthesizing with Gemini...' : 'Generate Policy with Gemini'}</span>
              </button>
            </div>
          </form>

          {policy && (
            <div className="p-4 rounded-xl bg-slate-950/80 border border-cyan-500/30 space-y-3 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div>
                  <strong className="text-white text-sm block">{policy.agentName}</strong>
                  <span className="text-slate-400 text-[11px]">{policy.purpose}</span>
                </div>
                <span className="px-2 py-0.5 rounded bg-cyan-950 border border-cyan-500/30 text-cyan-300 text-[10px] font-mono">
                  Risk Budget: {policy.maxDailyRiskBudget}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-lg bg-emerald-950/30 border border-emerald-500/30">
                  <span className="text-[10px] font-bold text-emerald-400 uppercase block mb-1">
                    AUTONOMOUS ALLOWED
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {policy.allowedTools.map((t, idx) => (
                      <span key={idx} className="px-1.5 py-0.5 rounded bg-emerald-950/80 text-emerald-300 font-mono text-[10px]">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-amber-950/30 border border-amber-500/30">
                  <span className="text-[10px] font-bold text-amber-400 uppercase block mb-1">
                    APPROVAL REQUIRED
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {policy.approvalRequiredTools.map((t, idx) => (
                      <span key={idx} className="px-1.5 py-0.5 rounded bg-amber-950/80 text-amber-300 font-mono text-[10px]">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-rose-950/30 border border-rose-500/30">
                  <span className="text-[10px] font-bold text-rose-400 uppercase block mb-1">
                    STRICTLY BLOCKED
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {policy.blockedTools.map((t, idx) => (
                      <span key={idx} className="px-1.5 py-0.5 rounded bg-rose-950/80 text-rose-300 font-mono text-[10px]">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {policy.restrictedPatterns && (
                <div>
                  <strong className="text-slate-300 block mb-1">Restricted Sensitive PII Patterns:</strong>
                  <div className="flex flex-wrap gap-1">
                    {policy.restrictedPatterns.map((p, idx) => (
                      <span key={idx} className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400 font-mono text-[10px]">
                        {p}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {policy.policyNotes && (
                <div className="pt-2 border-t border-slate-800 text-slate-400 text-[11px] leading-relaxed">
                  <strong className="text-slate-300 block mb-0.5">Architectural Notes:</strong>
                  {policy.policyNotes}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 text-right">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
