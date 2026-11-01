/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AgentInfo } from '../types/agentguard';
import { Zap, ArrowUpRight, Sparkles, AlertOctagon, Volume2 } from 'lucide-react';
import { soundEngine } from '../audio/soundEffects';
import { TranslationDictionary } from '../i18n/translations';

interface AgentDefenseLabProps {
  agents: AgentInfo[];
  activeAgent: string | null;
  loading: boolean;
  onRunAgent: (agent: AgentInfo) => void;
  onRunFullSweep: () => void;
  onSynthesizeAttack: () => void;
  onTestHumanApproval: () => void;
  t?: TranslationDictionary;
}

export const AgentDefenseLab: React.FC<AgentDefenseLabProps> = ({
  agents,
  activeAgent,
  loading,
  onRunAgent,
  onRunFullSweep,
  onSynthesizeAttack,
  onTestHumanApproval,
  t,
}) => {
  const handleAgentClick = (agent: AgentInfo) => {
    soundEngine.playScanSweep();
    soundEngine.speak(`Evaluating agent ${agent.codename}. Threat vector: ${agent.type}.`);
    onRunAgent(agent);
  };

  const handleFullSweep = () => {
    soundEngine.playScanSweep();
    soundEngine.speak(t?.voiceAnnounceSweepStarted || 'Initiating full neural security sweep across all agent nodes.');
    onRunFullSweep();
  };

  const handleRedTeam = () => {
    soundEngine.playRadarPing();
    soundEngine.speak('Synthesizing adversarial red-team payload with Google Gemini AI.');
    onSynthesizeAttack();
  };

  const handleApprovalTest = () => {
    soundEngine.playRequireApprovalTone();
    soundEngine.speak(t?.voiceAnnounceApprovalNeeded || 'Attention: High privilege action detected. Pausing for human authorization token.');
    onTestHumanApproval();
  };

  return (
    <section className="attack-section my-8" aria-labelledby="lab-heading">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <div className="text-[11px] font-mono tracking-widest text-cyan-400 uppercase font-semibold">
            {t?.labBadge || 'SECURITY SIMULATION LAB'}
          </div>
          <h2 id="lab-heading" className="text-2xl font-bold text-white tracking-tight">
            {t?.labHeading || 'Agent Defense Lab'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            {t?.labSubtitle || 'Evaluate how AgentGuard responds when autonomous agents encounter dangerous tool payloads.'}
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center flex-wrap gap-2">
          {/* Synthesize with Gemini */}
          <button
            onClick={handleRedTeam}
            disabled={loading}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-purple-950/80 to-indigo-950/80 hover:from-purple-900 hover:to-indigo-900 border border-purple-500/40 text-purple-200 text-xs font-semibold tracking-wide transition cursor-pointer disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-purple-400 shadow-md"
            title="Generate novel adversarial test payload with Google Gemini"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-300" />
            <span>{t?.btnRedTeam || 'Gemini Red-Team Gen'}</span>
          </button>

          {/* Full Security Sweep Button */}
          <button
            onClick={handleFullSweep}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white text-xs font-bold tracking-wider transition cursor-pointer disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-cyan-300 shadow-lg shadow-cyan-500/20"
            aria-label="Run Full Security Sweep (Hotkey S)"
          >
            <Zap className="w-4 h-4 text-cyan-200" />
            <span>{loading ? (t?.btnSweeping || 'SWEEPING SCENARIOS...') : (t?.btnFullSweep || 'RUN FULL SECURITY SWEEP (S)')}</span>
          </button>
        </div>
      </div>

      {/* Agents Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {agents.map((agent, index) => {
          const isActive = activeAgent === agent.id;
          const colorStyles = {
            green: {
              border: 'hover:border-emerald-500/50',
              activeBorder: 'border-emerald-400 ring-2 ring-emerald-500/30',
              badge: 'bg-emerald-950/60 text-emerald-400 border-emerald-500/30',
              fill: 'bg-emerald-400',
            },
            orange: {
              border: 'hover:border-amber-500/50',
              activeBorder: 'border-amber-400 ring-2 ring-amber-500/30',
              badge: 'bg-amber-950/60 text-amber-400 border-amber-500/30',
              fill: 'bg-amber-400',
            },
            red: {
              border: 'hover:border-rose-500/50',
              activeBorder: 'border-rose-400 ring-2 ring-rose-500/30',
              badge: 'bg-rose-950/60 text-rose-400 border-rose-500/30',
              fill: 'bg-rose-400',
            },
            purple: {
              border: 'hover:border-purple-500/50',
              activeBorder: 'border-purple-400 ring-2 ring-purple-500/30',
              badge: 'bg-purple-950/60 text-purple-400 border-purple-500/30',
              fill: 'bg-purple-400',
            },
            cyan: {
              border: 'hover:border-cyan-500/50',
              activeBorder: 'border-cyan-400 ring-2 ring-cyan-500/30',
              badge: 'bg-cyan-950/60 text-cyan-400 border-cyan-500/30',
              fill: 'bg-cyan-400',
            },
          }[agent.color];

          return (
            <button
              key={agent.id}
              onClick={() => handleAgentClick(agent)}
              disabled={loading}
              className={`p-5 rounded-2xl bg-slate-900/70 border text-left transition duration-200 cursor-pointer flex flex-col justify-between group disabled:opacity-60 focus-visible:ring-2 focus-visible:ring-cyan-400 ${
                isActive ? colorStyles.activeBorder : `border-slate-800 ${colorStyles.border}`
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="w-8 h-8 rounded-lg bg-slate-800/80 flex items-center justify-center text-sm font-bold text-white">
                    {agent.icon}
                  </div>
                  <span className="text-xs font-mono text-slate-500 font-bold">0{index + 1}</span>
                </div>

                <div className="flex items-center gap-2 mt-2">
                  <span className="text-[10px] font-mono font-bold tracking-widest text-slate-400">
                    {agent.codename}
                  </span>
                  <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${colorStyles.badge}`}>
                    {agent.type}
                  </span>
                </div>

                <h3 className="text-base font-bold text-white mt-1 group-hover:text-cyan-300 transition-colors">
                  {agent.name}
                </h3>

                <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                  {agent.description}
                </p>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-800/80">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">THREAT INDEX</span>
                  <strong className="text-white font-mono">{agent.riskValue} / 100</strong>
                </div>
                <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className={`h-full ${colorStyles.fill}`}
                    style={{ width: `${agent.riskValue}%` }}
                  />
                </div>

                <div className="flex items-center justify-between mt-3 text-[11px] text-cyan-400 font-medium">
                  <span>{loading && isActive ? (t?.evaluating || 'Analyzing...') : (t?.evaluateAgent || 'Evaluate Agent')}</span>
                  <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Human Approval Gate Test Banner */}
      <div className="mt-5 p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-cyan-950/80 border border-cyan-500/30 flex items-center justify-center text-cyan-300">
            <AlertOctagon className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white m-0">
              {t?.humanGateTitle || 'Human-in-the-Loop Gateway Testing'}
            </h4>
            <p className="text-[11px] text-slate-400 m-0">
              Trigger a live pause on external communication requiring cryptographic human consent token.
            </p>
          </div>
        </div>
        <button
          onClick={handleApprovalTest}
          disabled={loading}
          className="px-3 py-1.5 rounded-lg bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/30 text-cyan-300 text-xs font-bold tracking-wider transition cursor-pointer"
        >
          TEST HUMAN APPROVAL GATE
        </button>
      </div>
    </section>
  );
};
