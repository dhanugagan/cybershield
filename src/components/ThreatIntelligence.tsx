/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ShieldCheck, ShieldAlert, UserCheck, Flame, Cpu, Volume2 } from 'lucide-react';
import { soundEngine } from '../audio/soundEffects';
import { TranslationDictionary } from '../i18n/translations';

interface ThreatIntelligenceProps {
  protectionRate: number;
  blockedCount: number;
  approvalCount: number;
  highRiskCount: number;
  agentTrust: number;
  t?: TranslationDictionary;
}

export const ThreatIntelligence: React.FC<ThreatIntelligenceProps> = ({
  protectionRate,
  blockedCount,
  approvalCount,
  highRiskCount,
  agentTrust,
  t,
}) => {
  const getTrustBadge = () => {
    if (agentTrust >= 80) return { label: 'TRUSTED', color: 'text-emerald-400 bg-emerald-950/60 border-emerald-500/30' };
    if (agentTrust >= 50) return { label: 'CAUTION', color: 'text-amber-400 bg-amber-950/60 border-amber-500/30' };
    if (agentTrust >= 25) return { label: 'LOW TRUST', color: 'text-orange-400 bg-orange-950/60 border-orange-500/30' };
    return { label: 'UNTRUSTED', color: 'text-rose-400 bg-rose-950/60 border-rose-500/30' };
  };

  const trustBadge = getTrustBadge();

  const handleCardClick = (title: string, value: string | number) => {
    soundEngine.playClick(850);
    soundEngine.speak(`${title}: ${value}`);
  };

  return (
    <section className="intelligence-section my-8" aria-labelledby="threat-intel-heading">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <div className="text-[11px] font-mono tracking-widest text-cyan-400 uppercase font-semibold">
            TELEMETRY & RISK POSTURE
          </div>
          <h2 id="threat-intel-heading" className="text-2xl font-bold text-white tracking-tight">
            Threat Intelligence & SOC Metrics
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Real-time overview of AgentGuard's autonomous defense metrics.
          </p>
        </div>
        <div
          className="px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/30 text-emerald-400 text-xs font-bold tracking-wider flex items-center gap-2 cursor-pointer"
          role="status"
          onClick={() => {
            soundEngine.playRadarPing();
            soundEngine.speak(`Telemetry active. Protection rate: ${protectionRate}%. Threats blocked: ${blockedCount}.`);
          }}
          title="Click to vocalize telemetry"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" aria-hidden="true" />
          <Volume2 className="w-3.5 h-3.5" />
          <span>REAL-TIME TELEMETRY</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Card 1: Protection Rate */}
        <div
          onClick={() => handleCardClick('Protection Rate', `${protectionRate}%`)}
          className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-cyan-500/40 transition shadow-lg shadow-black/20 cursor-pointer"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">PROTECTION RATE</span>
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="text-3xl font-extrabold text-emerald-400">{protectionRate}%</div>
          <div className="w-full h-1.5 rounded-full bg-slate-800 mt-3 overflow-hidden">
            <div
              className="h-full bg-emerald-400 transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(0, protectionRate))}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-400 mt-2">Threats intercepted before execution</p>
        </div>

        {/* Card 2: Threats Blocked */}
        <div
          onClick={() => handleCardClick(t?.threatsNeutralized || 'Threats Blocked', blockedCount)}
          className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-rose-500/40 transition shadow-lg shadow-black/20 cursor-pointer"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
              {t?.threatsNeutralized || 'THREATS BLOCKED'}
            </span>
            <ShieldAlert className="w-5 h-5 text-rose-400" />
          </div>
          <div className="text-3xl font-extrabold text-rose-400">{blockedCount}</div>
          <p className="text-[11px] text-slate-400 mt-4">Autonomous dangerous actions stopped</p>
        </div>

        {/* Card 3: Human Approvals */}
        <div
          onClick={() => handleCardClick('Human Approvals Triggered', approvalCount)}
          className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-amber-500/40 transition shadow-lg shadow-black/20 cursor-pointer"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">HUMAN GATES</span>
            <UserCheck className="w-5 h-5 text-amber-400" />
          </div>
          <div className="text-3xl font-extrabold text-amber-400">{approvalCount}</div>
          <p className="text-[11px] text-slate-400 mt-4">High-impact actions awaiting human sign-off</p>
        </div>

        {/* Card 4: High Risk Detected */}
        <div
          onClick={() => handleCardClick('High Risk Incidents', highRiskCount)}
          className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-orange-500/40 transition shadow-lg shadow-black/20 cursor-pointer"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">HIGH RISK</span>
            <Flame className="w-5 h-5 text-orange-400" />
          </div>
          <div className="text-3xl font-extrabold text-orange-400">{highRiskCount}</div>
          <p className="text-[11px] text-slate-400 mt-4">Severe risk payload evaluations</p>
        </div>

        {/* Card 5: Agent Trust Score */}
        <div
          onClick={() => handleCardClick(t?.trustScore || 'Agent Trust Score', `${agentTrust}/100 (${trustBadge.label})`)}
          className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-indigo-500/40 transition shadow-lg shadow-black/20 cursor-pointer"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
              {t?.trustScore || 'AGENT TRUST'}
            </span>
            <Cpu className="w-5 h-5 text-cyan-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <div className="text-3xl font-extrabold text-white">{agentTrust}</div>
            <span className="text-xs font-mono text-slate-500">/ 100</span>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded border ${trustBadge.color}`}>
              {trustBadge.label}
            </span>
            <span className="text-[10px] font-mono text-cyan-400">&lt;1ms Gate</span>
          </div>
        </div>
      </div>
    </section>
  );
};
