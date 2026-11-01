/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { UserCheck, Bot, Shield, CheckCircle, ArrowRight, Volume2 } from 'lucide-react';
import { soundEngine } from '../audio/soundEffects';

export const SecurityCoreFlow: React.FC = () => {
  const handleStepClick = (stepName: string, desc: string) => {
    soundEngine.playClick(800);
    soundEngine.speak(`${stepName}: ${desc}`);
  };

  return (
    <section className="security-core my-8 p-6 rounded-2xl bg-slate-900/60 border border-cyan-500/20 backdrop-blur-md" aria-labelledby="core-heading">
      <div className="text-center max-w-xl mx-auto mb-8">
        <div className="text-[11px] font-mono tracking-widest text-cyan-400 uppercase font-semibold mb-1">
          AUTONOMOUS DECISION FIREWALL PIPELINE
        </div>
        <h2 id="core-heading" className="text-2xl font-bold text-white">
          AgentGuard <span className="text-cyan-400">Security Core</span>
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Every autonomous tool invocation is inspected before it can manipulate user systems or external APIs.
        </p>
      </div>

      {/* Reactor Architecture Pipeline */}
      <div className="grid grid-cols-1 md:grid-cols-7 items-center gap-4 py-4 max-w-4xl mx-auto">
        {/* Step 1: User Intent */}
        <div
          onClick={() => handleStepClick('Step 1: User Intent', 'Captures verified human instructions and scopes permissible parameter boundaries.')}
          className="flex flex-col items-center text-center p-4 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-cyan-500/40 cursor-pointer transition"
        >
          <div className="w-10 h-10 rounded-lg bg-cyan-950/80 border border-cyan-500/30 flex items-center justify-center text-cyan-300 mb-2">
            <UserCheck className="w-5 h-5" />
          </div>
          <span className="text-xs font-bold text-white tracking-wider">01 INTENT</span>
          <small className="text-[11px] text-slate-400 mt-1">Stated user objective</small>
        </div>

        {/* Arrow */}
        <div className="hidden md:flex justify-center text-cyan-400/60 font-bold" aria-hidden="true">
          <ArrowRight className="w-5 h-5" />
        </div>

        {/* Step 2: AI Agent */}
        <div
          onClick={() => handleStepClick('Step 2: AI Agent Proposed Action', 'The autonomous agent attempts an API call, bash execution, or database access.')}
          className="flex flex-col items-center text-center p-4 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-indigo-500/40 cursor-pointer transition"
        >
          <div className="w-10 h-10 rounded-lg bg-indigo-950/80 border border-indigo-500/30 flex items-center justify-center text-indigo-300 mb-2">
            <Bot className="w-5 h-5" />
          </div>
          <span className="text-xs font-bold text-white tracking-wider">02 AGENT</span>
          <small className="text-[11px] text-slate-400 mt-1">Proposed tool call</small>
        </div>

        {/* Arrow */}
        <div className="hidden md:flex justify-center text-cyan-400/60 font-bold" aria-hidden="true">
          <ArrowRight className="w-5 h-5" />
        </div>

        {/* Step 3: Security Core Reactor */}
        <div
          onClick={() => {
            soundEngine.playRadarPing();
            soundEngine.speak('Step 3: Security Core Reactor. Real-time sub-millisecond intent drift evaluation and tool permission sandboxing.');
          }}
          className="relative flex flex-col items-center text-center p-5 rounded-2xl bg-gradient-to-b from-cyan-950/80 to-slate-950 border-2 border-cyan-400/40 shadow-lg shadow-cyan-500/10 hover:border-cyan-300 cursor-pointer transition"
        >
          <div className="w-14 h-14 rounded-full bg-cyan-500/10 border border-cyan-400/50 flex items-center justify-center text-cyan-300 mb-2 animate-pulse">
            <Shield className="w-7 h-7 text-cyan-400" />
          </div>
          <span className="text-xs font-black text-cyan-300 tracking-wider">SECURITY CORE</span>
          <small className="text-[10px] text-cyan-400/80 mt-1 font-mono">FIREWALL ENGINE</small>
        </div>

        {/* Arrow */}
        <div className="hidden md:flex justify-center text-cyan-400/60 font-bold" aria-hidden="true">
          <ArrowRight className="w-5 h-5" />
        </div>

        {/* Step 4: Decision Output */}
        <div
          onClick={() => handleStepClick('Step 4: Gateway Decision', 'Outputs either Allow, Block, or pauses for human cryptographic approval.')}
          className="flex flex-col items-center text-center p-4 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-emerald-500/40 cursor-pointer transition"
        >
          <div className="w-10 h-10 rounded-lg bg-emerald-950/80 border border-emerald-500/30 flex items-center justify-center text-emerald-300 mb-2">
            <CheckCircle className="w-5 h-5" />
          </div>
          <span className="text-xs font-bold text-white tracking-wider">04 DECISION</span>
          <small className="text-[11px] text-slate-400 mt-1">Allow · Approve · Block</small>
        </div>
      </div>
    </section>
  );
};
