/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ShieldCheck, Lock, Activity, Sparkles, TestTube, CheckCircle2, Volume2 } from 'lucide-react';
import { soundEngine } from '../audio/soundEffects';
import { TranslationDictionary } from '../i18n/translations';

interface HeroSectionProps {
  onOpenSecurityAudit?: () => void;
  onOpenTestSuite?: () => void;
  t: TranslationDictionary;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onOpenSecurityAudit,
  onOpenTestSuite,
  t,
}) => {
  const handleVocalBriefing = () => {
    soundEngine.playRadarPing();
    soundEngine.speak(
      `${t.heroTitle1} ${t.heroTitleHighlight}. ${t.heroSubtitle}`
    );
  };

  return (
    <section className="hero relative overflow-hidden py-8 px-4 text-center" aria-labelledby="hero-title">
      <div className="max-w-3xl mx-auto relative z-10">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-cyan-950/70 border border-cyan-400/40 text-cyan-300 text-xs font-semibold tracking-wider mb-4 shadow-sm shadow-cyan-500/20">
          <Activity className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
          <span>{t.heroBadge}</span>
        </div>

        <h2 id="hero-title" className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight mb-4">
          {t.heroTitle1}{' '}
          <span className="bg-gradient-to-r from-cyan-400 via-indigo-300 to-emerald-400 bg-clip-text text-transparent">
            {t.heroTitleHighlight}
          </span>
        </h2>

        <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
          {t.heroSubtitle}
        </p>

        {/* Quick Action Badges & Vocal Briefing Button */}
        <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
          <button
            onClick={handleVocalBriefing}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 text-xs font-bold transition cursor-pointer shadow-lg shadow-cyan-950/40"
            title="Listen to Tactical Audio Briefing"
          >
            <Volume2 className="w-4 h-4 text-cyan-400 animate-bounce" />
            <span>Voice Briefing</span>
          </button>

          {onOpenSecurityAudit && (
            <button
              onClick={() => {
                soundEngine.playClick(900);
                onOpenSecurityAudit();
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-950/80 hover:bg-emerald-900/90 border border-emerald-500/40 text-emerald-300 text-xs font-bold transition cursor-pointer shadow-lg shadow-emerald-950/40"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>{t.heroAuditBtn}</span>
              <span className="px-1.5 py-0.5 rounded bg-emerald-900 text-emerald-200 text-[10px] font-mono">
                {t.gradeA}
              </span>
            </button>
          )}

          {onOpenTestSuite && (
            <button
              onClick={() => {
                soundEngine.playClick(850);
                onOpenTestSuite();
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-950/80 hover:bg-indigo-900/90 border border-indigo-500/40 text-indigo-300 text-xs font-bold transition cursor-pointer shadow-lg shadow-indigo-950/40"
            >
              <TestTube className="w-4 h-4 text-indigo-400" />
              <span>{t.heroTestBtn}</span>
              <span className="px-1.5 py-0.5 rounded bg-indigo-900 text-indigo-200 text-[10px] font-mono">
                {t.testsPassed}
              </span>
            </button>
          )}
        </div>

        {/* Feature Badges */}
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 mt-6 text-xs text-slate-400">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-900/60 border border-slate-800">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>PBKDF2 Salted Hashing</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-900/60 border border-slate-800">
            <Lock className="w-3.5 h-3.5 text-indigo-400" />
            <span>Admin RBAC (3 Roles)</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-900/60 border border-slate-800">
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
            <span>XSS & Rate Limit Shield</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-900/60 border border-slate-800">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Google Gemini Neural Audit</span>
          </div>
        </div>
      </div>
    </section>
  );
};
