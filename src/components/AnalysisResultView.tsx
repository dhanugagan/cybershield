/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Lock,
  Cpu,
  Layers,
  Check,
  X,
  RefreshCw,
  FileText,
  Volume2,
} from 'lucide-react';
import { AttackResponse, auditWithGemini } from '../services/api';
import { GeminiAuditResult } from '../types/agentguard';
import { soundEngine } from '../audio/soundEffects';
import { TranslationDictionary } from '../i18n/translations';

interface AnalysisResultViewProps {
  result: AttackResponse & {
    sweep?: boolean;
    results?: AttackResponse[];
    summary?: { total: number; blocked: number; approvals: number; allowed: number };
  };
  t?: TranslationDictionary;
}

export const AnalysisResultView: React.FC<AnalysisResultViewProps> = ({ result, t }) => {
  const [geminiAudit, setGeminiAudit] = useState<GeminiAuditResult | null>(null);
  const [loadingAudit, setLoadingAudit] = useState(false);

  // If this was a Full Sweep
  if (result.sweep && result.results && result.summary) {
    const handleReadSweep = () => {
      soundEngine.playScanSweep();
      soundEngine.speak(
        `Security sweep completed. Total scenarios: ${result.summary?.total}. Threats blocked: ${result.summary?.blocked}. Approvals required: ${result.summary?.approvals}. Allowed: ${result.summary?.allowed}.`
      );
    };

    return (
      <section className="sweep-result-card my-8 p-6 rounded-2xl bg-slate-900/80 border border-cyan-500/30 backdrop-blur-md shadow-2xl">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="text-[11px] font-mono tracking-widest text-cyan-400 uppercase font-bold">
              SECURITY SWEEP COMPLETE
            </div>
            <h2 className="text-2xl font-bold text-white m-0">AgentGuard Defense Scan</h2>
            <p className="text-xs text-slate-400 mt-1">
              All configured scenarios were analyzed against the multi-layer security firewall.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleReadSweep}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 text-xs font-semibold cursor-pointer"
              title="Read Sweep Summary"
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>{t?.readVerdictAloud || 'Read Verdict'}</span>
            </button>
            <div className="px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 text-xs font-bold">
              ✓ SCAN COMPLETE
            </div>
          </div>
        </div>

        {/* Summary grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-6">
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
              TOTAL SCENARIOS
            </span>
            <strong className="text-2xl font-black text-cyan-400 mt-1 block">
              {result.summary.total}
            </strong>
          </div>
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
              THREATS BLOCKED
            </span>
            <strong className="text-2xl font-black text-rose-400 mt-1 block">
              {result.summary.blocked}
            </strong>
          </div>
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
              APPROVAL REQUIRED
            </span>
            <strong className="text-2xl font-black text-amber-400 mt-1 block">
              {result.summary.approvals}
            </strong>
          </div>
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
              AUTONOMOUS ALLOWED
            </span>
            <strong className="text-2xl font-black text-emerald-400 mt-1 block">
              {result.summary.allowed}
            </strong>
          </div>
        </div>

        {/* Sweep Rows list */}
        <div className="space-y-2 mt-4">
          {result.results.map((item, idx) => {
            const isBlock = item.security.decision === 'BLOCK';
            const isApproval = item.security.decision === 'REQUIRE_APPROVAL';
            return (
              <div
                key={idx}
                className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-950/50 border border-slate-800/80 hover:border-slate-700 transition"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-2.5 h-2.5 rounded-full ${
                      isBlock ? 'bg-rose-400' : isApproval ? 'bg-amber-400' : 'bg-emerald-400'
                    }`}
                  />
                  <div>
                    <h4 className="text-xs font-bold text-white m-0">
                      {item.scenario?.name || 'Agent Scenario'}
                    </h4>
                    <span className="text-[11px] font-mono text-cyan-400">
                      {item.agent_action.action}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono text-slate-400">
                    Risk: <strong className="text-white">{item.security.risk_score}</strong>/100
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                      isBlock
                        ? 'bg-rose-950 text-rose-300 border-rose-500/40'
                        : isApproval
                        ? 'bg-amber-950 text-amber-300 border-amber-500/40'
                        : 'bg-emerald-950 text-emerald-300 border-emerald-500/40'
                    }`}
                  >
                    {item.security.decision}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    );
  }

  // Single scenario analysis
  const { scenario, user_request, agent_action, intent_check, security } = result;
  const isBlock = security.decision === 'BLOCK';
  const isApproval = security.decision === 'REQUIRE_APPROVAL';
  const isAllow = security.decision === 'ALLOW';

  const handleReadVerdict = () => {
    if (isBlock) {
      soundEngine.playThreatAlert();
      soundEngine.speak(
        `${t?.voiceAnnounceThreatBlocked || 'Warning! Malicious action blocked.'} Scenario: ${scenario?.name || 'Agent'}. Reason: ${security.reason}.`
      );
    } else if (isApproval) {
      soundEngine.playRequireApprovalTone();
      soundEngine.speak(
        `${t?.voiceAnnounceApprovalNeeded || 'Attention: Human approval required.'} Agent proposing: ${agent_action.action}.`
      );
    } else {
      soundEngine.playSuccessChime();
      soundEngine.speak(
        `${t?.voiceAnnounceActionAllowed || 'Action verified safe.'} Intent verified. Execution permitted.`
      );
    }
  };

  const handleRunGeminiAudit = async () => {
    soundEngine.playScanSweep();
    setLoadingAudit(true);
    try {
      const data = await auditWithGemini(user_request, agent_action, security);
      setGeminiAudit(data);
      soundEngine.playSuccessChime();
    } catch {
      // handled
    } finally {
      setLoadingAudit(false);
    }
  };

  return (
    <section className="result-card my-8 p-6 rounded-2xl bg-slate-900/80 border border-cyan-500/30 backdrop-blur-md shadow-2xl" aria-labelledby="analysis-heading">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="text-[11px] font-mono tracking-widest text-cyan-400 uppercase font-bold">
            SECURITY ANALYSIS COMPLETE
          </div>
          <h2 id="analysis-heading" className="text-2xl font-bold text-white m-0">
            {scenario?.name || 'Agent Security Evaluation'}
          </h2>
          {scenario?.owasp_category && (
            <span className="inline-block mt-1 text-[11px] font-mono text-indigo-400 bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-500/30">
              {scenario.owasp_category}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Read Aloud Button */}
          <button
            onClick={handleReadVerdict}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 text-xs font-semibold cursor-pointer shadow"
            title="Read Verdict Aloud"
          >
            <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
            <span>{t?.readVerdictAloud || 'Read Verdict Aloud'}</span>
          </button>

          <div
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold tracking-wider border ${
              isBlock
                ? 'bg-rose-950/80 text-rose-300 border-rose-500/50'
                : isApproval
                ? 'bg-amber-950/80 text-amber-300 border-amber-500/50'
                : 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50'
            }`}
          >
            {isBlock ? (
              <>
                <ShieldAlert className="w-4 h-4 text-rose-400" />
                <span>🚫 {t?.decisionBlock || 'BLOCKED'}</span>
              </>
            ) : isApproval ? (
              <>
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span>⚠️ {t?.decisionApproval || 'REQUIRE APPROVAL'}</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>🟢 {t?.decisionAllow || 'ALLOWED'}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Threat Index & Risk Level */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-6">
        <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-cyan-950/80 border border-cyan-500/40 flex flex-col items-center justify-center">
            <span className="text-xl font-black text-cyan-300 leading-none">{security.risk_score}</span>
            <small className="text-[10px] text-slate-400">/ 100</small>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
              {t?.riskScore || 'THREAT INDEX'}
            </span>
            <h3 className="text-base font-bold text-white mt-0.5">{security.risk_level} RISK</h3>
            <span className="text-[11px] text-slate-400">Agent Trust: {security.agent_trust}%</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 col-span-2">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
            VERDICT REASONING
          </span>
          <p className="text-xs sm:text-sm text-slate-200 mt-1 leading-relaxed">
            {security.reason}
          </p>
        </div>
      </div>

      {/* Permission Firewall 3-Step Verification */}
      <div className="my-6 p-5 rounded-xl bg-slate-950/60 border border-slate-800">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <div className="text-[10px] font-mono tracking-widest text-cyan-400 uppercase font-bold">
              PERMISSION FIREWALL
            </div>
            <h3 className="text-sm font-bold text-white m-0">Can this agent execute this tool?</h3>
          </div>
          <span
            className={`px-2.5 py-1 rounded text-xs font-bold border ${
              security.permission === 'AUTHORIZED'
                ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40'
                : security.permission === 'HUMAN_APPROVAL'
                ? 'bg-amber-950/80 text-amber-300 border-amber-500/40'
                : 'bg-rose-950/80 text-rose-300 border-rose-500/40'
            }`}
          >
            {security.permission === 'AUTHORIZED'
              ? '✓ AUTHORIZED'
              : security.permission === 'HUMAN_APPROVAL'
              ? '⚠ HUMAN APPROVAL'
              : '✕ DENIED'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-7 items-center gap-3">
          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
            <span className="text-[10px] text-cyan-400 font-mono font-bold">01 USER INTENT</span>
            <p className="text-xs text-slate-300 mt-1 line-clamp-2">"{user_request}"</p>
          </div>
          <div className="hidden md:flex justify-center text-cyan-400 font-bold">→</div>
          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
            <span className="text-[10px] text-indigo-400 font-mono font-bold">02 AI TOOL CALL</span>
            <p className="text-xs font-mono text-slate-300 mt-1 truncate">{agent_action.action}</p>
          </div>
          <div className="hidden md:flex justify-center text-cyan-400 font-bold">→</div>
          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
            <span className="text-[10px] text-amber-400 font-mono font-bold">03 PERMISSION</span>
            <p className="text-xs font-bold text-slate-200 mt-1">{security.permission}</p>
          </div>
          <div className="hidden md:flex justify-center text-cyan-400 font-bold">→</div>
          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-center">
            <span className="text-[10px] text-slate-400 font-mono font-bold block">FINAL VERDICT</span>
            <strong
              className={`text-xs font-black block mt-1 ${
                isBlock ? 'text-rose-400' : isApproval ? 'text-amber-400' : 'text-emerald-400'
              }`}
            >
              {security.decision}
            </strong>
          </div>
        </div>
      </div>

      {/* Intent Drift Detector Panel */}
      <div className="my-6 p-5 rounded-xl bg-slate-950/60 border border-slate-800">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div>
            <div className="text-[10px] font-mono tracking-widest text-cyan-400 uppercase font-bold">
              {t?.intentAlignment || 'INTENT DRIFT DETECTOR'}
            </div>
            <h3 className="text-sm font-bold text-white m-0">Did the agent do what the user asked?</h3>
          </div>
          <span
            className={`px-2.5 py-1 rounded text-xs font-bold border ${
              intent_check.intent_match
                ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40'
                : 'bg-rose-950/80 text-rose-300 border-rose-500/40'
            }`}
          >
            {intent_check.intent_match ? '✓ INTENT MATCHED' : '⚠ INTENT DRIFT DETECTED'}
          </span>
        </div>
        <p className="text-xs text-slate-300">{intent_check.reason}</p>
      </div>

      {/* Detection Signals & Factors */}
      <div className="my-6">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
          DETECTION SIGNALS & RISK FACTORS ({security.factors.length})
        </span>
        <div className="space-y-1.5">
          {security.factors.map((factor, index) => (
            <div
              key={index}
              className="flex items-start gap-2.5 p-2.5 rounded-lg bg-slate-950/40 border border-slate-800 text-xs text-slate-300"
            >
              <span className="text-cyan-400 font-mono font-bold">◆</span>
              <span>{factor}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Google Gemini Neural Threat Auditor Panel */}
      <div className="mt-8 pt-6 border-t border-slate-800">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-white">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white m-0">
                Google Gemini Deep Threat Auditor
              </h3>
              <p className="text-[11px] text-slate-400 m-0">
                Neural root-cause analysis, OWASP LLM taxonomy, and automated mitigation rules.
              </p>
            </div>
          </div>

          <button
            onClick={handleRunGeminiAudit}
            disabled={loadingAudit}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 text-xs font-semibold transition cursor-pointer disabled:opacity-50"
          >
            {loadingAudit ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5" />
            )}
            <span>{geminiAudit ? 'Re-Audit with Gemini' : 'Audit with Google Gemini'}</span>
          </button>
        </div>

        {geminiAudit && (
          <div className="p-4 rounded-xl bg-gradient-to-b from-indigo-950/40 to-slate-950 border border-indigo-500/30 text-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-indigo-500/20">
              <span className="font-mono text-cyan-300 font-bold">{geminiAudit.owaspMapping}</span>
              <span className="px-2 py-0.5 rounded bg-indigo-950 border border-indigo-500/40 text-indigo-300 text-[10px] font-bold">
                Safety Score: {geminiAudit.safetyScore}/100
              </span>
            </div>

            <div>
              <strong className="text-slate-200 block mb-0.5">Vulnerability Breakdown:</strong>
              <p className="text-slate-300 leading-relaxed">{geminiAudit.vulnerabilityAnalysis}</p>
            </div>

            <div>
              <strong className="text-slate-200 block mb-0.5">Adversarial Exploitation Vector:</strong>
              <p className="text-slate-300 leading-relaxed">{geminiAudit.attackVectorExplanation}</p>
            </div>

            <div>
              <strong className="text-slate-200 block mb-0.5">Recommended Mitigation:</strong>
              <p className="text-slate-300 leading-relaxed">{geminiAudit.recommendation}</p>
            </div>

            {geminiAudit.mitigationRules && geminiAudit.mitigationRules.length > 0 && (
              <div>
                <strong className="text-slate-200 block mb-1">Synthesized Firewall Rules:</strong>
                <ul className="list-disc list-inside space-y-1 text-slate-400 font-mono text-[11px]">
                  {geminiAudit.mitigationRules.map((rule, idx) => (
                    <li key={idx}>{rule}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
};
