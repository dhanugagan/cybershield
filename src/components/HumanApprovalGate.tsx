/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AlertTriangle, CheckCircle, XCircle, Key, Volume2 } from 'lucide-react';
import { AttackResponse } from '../services/api';
import { soundEngine } from '../audio/soundEffects';
import { TranslationDictionary } from '../i18n/translations';

interface HumanApprovalGateProps {
  request: AttackResponse;
  onApprove: () => void;
  onDeny: () => void;
  t?: TranslationDictionary;
}

export const HumanApprovalGate: React.FC<HumanApprovalGateProps> = ({
  request,
  onApprove,
  onDeny,
  t,
}) => {
  const { user_request, agent_action, security } = request;

  const handleApprove = () => {
    soundEngine.playSuccessChime();
    soundEngine.speak(t?.voiceAnnounceApproved || 'Human authorization confirmed. Execution token released.');
    onApprove();
  };

  const handleDeny = () => {
    soundEngine.playThreatAlert();
    soundEngine.speak(t?.voiceAnnounceDenied || 'Execution denied by human operator. Tool call terminated.');
    onDeny();
  };

  const handleVocalPrompt = () => {
    soundEngine.playRequireApprovalTone();
    soundEngine.speak(
      `Pending human approval. Agent proposing action: ${agent_action.action}. Risk score: ${security.risk_score} out of 100. Press A to authorize or D to deny.`
    );
  };

  return (
    <section
      className="approval-gate my-8 p-6 rounded-2xl bg-amber-950/20 border-2 border-amber-500/50 backdrop-blur-md shadow-2xl shadow-amber-950/30"
      role="alert"
      aria-live="assertive"
      aria-labelledby="approval-title"
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-amber-500/20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-mono tracking-widest text-amber-400 uppercase font-bold">
              {t?.humanGateTitle || 'HUMAN-IN-THE-LOOP AUTHORIZATION REQUIRED'}
            </div>
            <h2 id="approval-title" className="text-xl font-bold text-white m-0">
              Agent Paused: Awaiting Your Review
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleVocalPrompt}
            className="p-1.5 rounded-lg bg-amber-950/80 hover:bg-amber-900 border border-amber-500/40 text-amber-300 cursor-pointer"
            title="Read Gate Prompt"
          >
            <Volume2 className="w-4 h-4" />
          </button>
          {security.approval_token && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-900 border border-amber-500/30 text-[11px] font-mono text-amber-300">
              <Key className="w-3 h-3 text-amber-400" />
              <span>Token: {security.approval_token}</span>
            </div>
          )}
          <span className="px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold tracking-wider">
            PAUSED
          </span>
        </div>
      </div>

      {/* Body details */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-6">
        {/* Risk Score */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-amber-500/10 border border-amber-500/30 flex flex-col items-center justify-center">
            <span className="text-lg font-black text-amber-400 leading-none">{security.risk_score}</span>
            <small className="text-[9px] text-slate-400">/ 100</small>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
              {t?.riskScore || 'THREAT LEVEL'}
            </span>
            <strong className="text-sm font-bold text-amber-300">{security.risk_level}</strong>
            <p className="text-[11px] text-slate-400 mt-0.5">High external sensitivity</p>
          </div>
        </div>

        {/* Proposed Tool */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
            PROPOSED TOOL CALL
          </span>
          <strong className="text-sm font-mono font-bold text-cyan-300">{agent_action.action}</strong>
          <p className="text-[11px] text-slate-400 mt-0.5 truncate font-mono">
            {JSON.stringify(agent_action.parameters)}
          </p>
        </div>

        {/* User Request */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
            USER STATED INTENT
          </span>
          <p className="text-xs text-slate-300 mt-1 line-clamp-2 italic">
            "{user_request}"
          </p>
        </div>
      </div>

      {/* Explanation Banner */}
      <div className="p-3.5 rounded-xl bg-slate-900/60 border border-amber-500/20 text-xs text-amber-200/90 mb-6">
        <strong>Firewall Reason: </strong>
        {security.reason || 'Tool requires explicit human operator sign-off before network or disk dispatch.'}
      </div>

      {/* Decision Buttons */}
      <div className="flex flex-wrap items-center justify-end gap-3 pt-4 border-t border-amber-500/20">
        <button
          onClick={handleDeny}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-950/80 hover:bg-rose-900 border border-rose-500/40 text-rose-200 text-xs font-bold transition cursor-pointer"
        >
          <XCircle className="w-4 h-4 text-rose-400" />
          <span>{t?.denyExecution || 'Deny Execution (D)'}</span>
        </button>

        <button
          onClick={handleApprove}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition cursor-pointer shadow-lg shadow-emerald-600/20"
        >
          <CheckCircle className="w-4 h-4 text-emerald-200" />
          <span>{t?.authorizeToken || 'Authorize Release Token (A)'}</span>
        </button>
      </div>
    </section>
  );
};
