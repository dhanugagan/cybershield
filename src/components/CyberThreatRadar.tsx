/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Shield,
  Radio,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Cpu,
  Zap,
  Volume2,
} from 'lucide-react';
import { AgentInfo } from '../types/agentguard';
import { soundEngine } from '../audio/soundEffects';
import { TranslationDictionary } from '../i18n/translations';

interface CyberThreatRadarProps {
  agents: AgentInfo[];
  activeAgent: string | null;
  onSelectAgent: (agent: AgentInfo) => void;
  threatsBlocked: number;
  t: TranslationDictionary;
  defconLevel: number;
  setDefconLevel: (level: number) => void;
}

export const CyberThreatRadar: React.FC<CyberThreatRadarProps> = ({
  agents,
  activeAgent,
  onSelectAgent,
  threatsBlocked,
  t,
  defconLevel,
  setDefconLevel,
}) => {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  const handleDefconChange = (lvl: number) => {
    setDefconLevel(lvl);
    if (lvl === 1) {
      soundEngine.playEmergencySiren();
      soundEngine.speak('DEFCON 1. Emergency lockdown activated across all agent nodes.');
    } else if (lvl === 2) {
      soundEngine.playThreatAlert();
      soundEngine.speak('DEFCON 2. High threat perimeter armed.');
    } else {
      soundEngine.playClick(900 - lvl * 100);
      soundEngine.speak(`DEFCON ${lvl} status set.`);
    }
  };

  const defconColors = {
    5: 'border-emerald-500/40 text-emerald-400 bg-emerald-950/40',
    4: 'border-cyan-500/40 text-cyan-400 bg-cyan-950/40',
    3: 'border-amber-500/40 text-amber-400 bg-amber-950/40',
    2: 'border-orange-500/40 text-orange-400 bg-orange-950/40',
    1: 'border-rose-500/60 text-rose-300 bg-rose-950/60 animate-pulse',
  };

  return (
    <section
      className="cyber-radar-section my-8 p-6 rounded-2xl bg-slate-950/80 border border-cyan-500/30 backdrop-blur-xl relative overflow-hidden shadow-2xl shadow-cyan-950/40"
      aria-labelledby="radar-title"
    >
      {/* Decorative Cyber Corners */}
      <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-cyan-400 pointer-events-none" />
      <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-cyan-400 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-cyan-400 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-cyan-400 pointer-events-none" />

      {/* Top Header & DEFCON Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6 pb-4 border-b border-cyan-500/20">
        <div>
          <div className="inline-flex items-center gap-2 text-[10px] font-mono tracking-widest text-cyan-400 font-bold uppercase mb-1">
            <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span>{t.radarLiveScan}</span>
          </div>
          <h2 id="radar-title" className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <span>{t.radarHeading}</span>
          </h2>
          <p className="text-xs text-slate-400 max-w-2xl mt-0.5">
            {t.radarSub}
          </p>
        </div>

        {/* Tactical DEFCON Threat Level Selector */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 bg-slate-900/90 p-2 rounded-xl border border-slate-800">
          <span className="text-[11px] font-mono font-bold text-slate-400 px-2 tracking-wider">
            {t.defconLevel}:
          </span>
          <div className="flex items-center gap-1.5 flex-wrap">
            {[5, 4, 3, 2, 1].map((lvl) => {
              const isActive = defconLevel === lvl;
              return (
                <button
                  key={lvl}
                  onClick={() => handleDefconChange(lvl)}
                  className={`px-2.5 py-1 rounded text-[11px] font-mono font-bold transition cursor-pointer border ${
                    isActive
                      ? defconColors[lvl as keyof typeof defconColors] + ' ring-2 ring-cyan-400/30'
                      : 'border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 bg-slate-950/60'
                  }`}
                  title={`DEFCON ${lvl}`}
                >
                  D-{lvl}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Radar Map & Node Grid Interactive Display */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Visual Topological Radar Screen */}
        <div className="lg:col-span-7 relative h-72 sm:h-80 w-full rounded-xl bg-slate-950 border border-cyan-500/20 flex items-center justify-center overflow-hidden">
          {/* Circular Radar Grids */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-24 h-24 rounded-full border border-cyan-500/20" />
            <div className="w-44 h-44 rounded-full border border-cyan-500/15" />
            <div className="w-64 h-64 rounded-full border border-cyan-500/10" />
            {/* Crosshairs */}
            <div className="absolute w-full h-[1px] bg-cyan-500/15" />
            <div className="absolute h-full w-[1px] bg-cyan-500/15" />
          </div>

          {/* Sweeping Radar Scanner Line */}
          <div
            className="absolute inset-0 origin-center pointer-events-none"
            style={{
              background: 'conic-gradient(from 0deg, transparent 0deg, transparent 300deg, rgba(0, 240, 255, 0.15) 360deg)',
              animation: 'spin 4s linear infinite',
            }}
          />

          {/* Central Hub: AgentGuard Core Gateway */}
          <div className="relative z-10 flex flex-col items-center justify-center p-3 rounded-2xl bg-cyan-950/80 border-2 border-cyan-400 shadow-lg shadow-cyan-500/30 text-center">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-white mb-1 shadow-md animate-pulse">
              <Shield className="w-5 h-5 text-cyan-100" />
            </div>
            <span className="text-[11px] font-bold text-white font-mono tracking-wider">GATEWAY CORE</span>
            <span className="text-[9px] font-mono text-emerald-400">ACTIVE SHIELD</span>
          </div>

          {/* Orbiting Agent Nodes */}
          {agents.map((agent, index) => {
            const angle = (index / agents.length) * 2 * Math.PI - Math.PI / 2;
            const radius = 110;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            const isSelected = activeAgent === agent.id;
            const isHovered = hoveredNode === agent.id;

            return (
              <button
                key={agent.id}
                onClick={() => {
                  soundEngine.playRadarPing();
                  onSelectAgent(agent);
                }}
                onMouseEnter={() => {
                  setHoveredNode(agent.id);
                  soundEngine.playClick(900);
                }}
                onMouseLeave={() => setHoveredNode(null)}
                style={{
                  transform: `translate(${x}px, ${y}px)`,
                }}
                className={`absolute z-20 flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-300 cursor-pointer ${
                  isSelected
                    ? 'scale-110 bg-cyan-900/90 border-2 border-cyan-300 shadow-lg shadow-cyan-400/50'
                    : isHovered
                    ? 'scale-105 bg-slate-900 border border-cyan-400 text-white'
                    : 'bg-slate-900/90 border border-slate-700 text-slate-300 hover:border-cyan-500'
                }`}
                title={`Agent: ${agent.codename} - Click to test security`}
              >
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span className="text-[11px] font-mono font-bold tracking-tight text-white">
                    {agent.codename}
                  </span>
                </div>
                <span className="text-[8px] font-mono text-cyan-400">NODE 0{index + 1}</span>
              </button>
            );
          })}
        </div>

        {/* Live Telemetry Sidebar */}
        <div className="lg:col-span-5 flex flex-col gap-3">
          <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono text-slate-400">{t.radarTotalAgents}</span>
              <span className="text-base font-mono font-bold text-cyan-400">{agents.length} Nodes</span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div className="bg-gradient-to-r from-cyan-500 to-indigo-500 h-full w-full" />
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono text-slate-400">{t.radarThreatsIntercepted}</span>
              <span className="text-base font-mono font-bold text-rose-400">{threatsBlocked} Blocked</span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-rose-500 h-full transition-all duration-500"
                style={{ width: `${Math.min(100, threatsBlocked * 20 + 20)}%` }}
              />
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-gradient-to-br from-indigo-950/60 to-cyan-950/60 border border-indigo-500/30 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Activity className="w-4 h-4 text-cyan-400" />
              <div>
                <div className="text-xs font-bold text-white">Interactive Audio & TTS</div>
                <div className="text-[10px] text-cyan-300">Click any node or button to hear tactical SFX & vocal verdicts</div>
              </div>
            </div>
            <button
              onClick={() => {
                soundEngine.playSuccessChime();
                soundEngine.speak(t.voiceAnnounceActionAllowed);
              }}
              className="p-1.5 rounded-lg bg-cyan-900/60 hover:bg-cyan-800 border border-cyan-400/40 text-cyan-300 cursor-pointer"
              title="Test Tactical Audio"
            >
              <Volume2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
