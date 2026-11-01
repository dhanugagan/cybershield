/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Shield, ChevronDown, ChevronUp, Volume2 } from 'lucide-react';
import { soundEngine } from '../audio/soundEffects';
import { TranslationDictionary } from '../i18n/translations';

interface ProblemStatementBannerProps {
  t?: TranslationDictionary;
}

export const ProblemStatementBanner: React.FC<ProblemStatementBannerProps> = ({ t }) => {
  const [expanded, setExpanded] = useState(false);

  const toggleExpand = () => {
    soundEngine.playClick(800);
    setExpanded(!expanded);
  };

  const handleReadMission = () => {
    soundEngine.playScanSweep();
    soundEngine.speak(
      'Problem Statement: Autonomous AI agents can execute destructive actions or leak data when hijacked. AgentGuard intercepts tool calls before execution, scores threats from 0 to 100, and enforces cryptographic human authorization.'
    );
  };

  return (
    <section
      className="problem-alignment my-6 p-5 rounded-2xl bg-gradient-to-r from-slate-900/90 via-slate-900/80 to-indigo-950/40 border border-cyan-500/30 backdrop-blur-md shadow-xl"
      aria-labelledby="problem-heading"
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shrink-0">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono tracking-widest text-cyan-400 uppercase font-bold px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/30">
                PROBLEM STATEMENT & MISSION ALIGNMENT
              </span>
              <span className="text-[10px] font-mono text-emerald-400 font-bold">100% ALIGNED</span>
            </div>
            <h2 id="problem-heading" className="text-base sm:text-lg font-bold text-white mt-1 m-0">
              Autonomous AI Agent Governance & Decision Firewall
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleReadMission}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-slate-700 cursor-pointer"
            title="Read Mission Briefing"
            aria-label="Read Mission Aloud"
          >
            <Volume2 className="w-4 h-4" />
          </button>
          <button
            onClick={toggleExpand}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold tracking-wider transition cursor-pointer border border-slate-700"
            aria-expanded={expanded}
            aria-controls="problem-details-panel"
          >
            <span>{expanded ? 'HIDE SPECIFICATION' : 'VIEW PROBLEM & THREAT MODEL'}</span>
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      <p className="text-xs sm:text-sm text-slate-300 mt-3 leading-relaxed">
        <strong className="text-cyan-300">The Problem:</strong> Autonomous AI agents can execute destructive actions, charge financial credentials, or leak sensitive PII when hijacked by indirect prompt injection or goal drift.
        <strong className="text-emerald-300 ml-1">The Solution:</strong> AgentGuard intercepts tool calls before execution, scores threat levels (0–100), enforces strict permission firewalls, and requires cryptographic human-in-the-loop approvals.
      </p>

      {expanded && (
        <div id="problem-details-panel" className="mt-5 pt-5 border-t border-slate-800/80 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800">
              <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider block mb-1">
                01 • THREAT: EXCESSIVE AGENCY
              </span>
              <p className="text-xs text-slate-300 m-0">
                Compromised or malfunctioning agents attempting file wipes, database drops, or unauthorized terminal calls.
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800">
              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block mb-1">
                02 • THREAT: INTENT DRIFT
              </span>
              <p className="text-xs text-slate-300 m-0">
                Adversarial jailbreaks subtly redirecting the agent from its stated user goal toward unauthorized operations.
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800">
              <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider block mb-1">
                03 • THREAT: PRIVILEGED EXFILTRATION
              </span>
              <p className="text-xs text-slate-300 m-0">
                AI sending internal company data, API keys, or database rows to untrusted webhooks or external email recipients.
              </p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
