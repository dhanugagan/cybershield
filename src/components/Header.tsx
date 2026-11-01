/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Shield,
  ShieldCheck,
  Sparkles,
  TestTube,
  Keyboard,
  Eye,
  Zap,
  X,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  Globe,
  Check,
} from 'lucide-react';
import { checkBackendHealth } from '../services/api';
import { soundEngine } from '../audio/soundEffects';
import {
  SupportedLanguage,
  SUPPORTED_LANGUAGES,
  TranslationDictionary,
} from '../i18n/translations';

interface HeaderProps {
  onOpenTestSuite: () => void;
  onOpenPolicyModal: () => void;
  onOpenSecurityAudit: () => void;
  highContrast: boolean;
  setHighContrast: (v: boolean) => void;
  reducedMotion: boolean;
  setReducedMotion: (v: boolean) => void;
  currentLanguage: SupportedLanguage;
  onLanguageChange: (lang: SupportedLanguage) => void;
  t: TranslationDictionary;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenTestSuite,
  onOpenPolicyModal,
  onOpenSecurityAudit,
  highContrast,
  setHighContrast,
  reducedMotion,
  setReducedMotion,
  currentLanguage,
  onLanguageChange,
  t,
}) => {
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(soundEngine.isSoundEnabled());
  const [voiceEnabled, setVoiceEnabled] = useState(soundEngine.isVoiceEnabled());
  const [healthStatus, setHealthStatus] = useState<{ healthy: boolean; statusText: string }>({
    healthy: true,
    statusText: 'Connected • 1ms',
  });

  useEffect(() => {
    checkBackendHealth().then((res) => setHealthStatus(res));
    const interval = setInterval(() => {
      checkBackendHealth().then((res) => setHealthStatus(res));
    }, 12000);
    return () => clearInterval(interval);
  }, []);

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    soundEngine.setSoundEnabled(next);
    if (next) {
      soundEngine.playClick(900);
    }
  };

  const toggleVoice = () => {
    const next = !voiceEnabled;
    setVoiceEnabled(next);
    soundEngine.setVoiceEnabled(next);
    if (next) {
      soundEngine.speak('Voice operator system activated.');
    } else {
      soundEngine.stopSpeaking();
    }
  };

  const handleLangSelect = (code: SupportedLanguage) => {
    onLanguageChange(code);
    setShowLangMenu(false);
    soundEngine.playClick(850);
  };

  const currentLangObj =
    SUPPORTED_LANGUAGES.find((l) => l.code === currentLanguage) || SUPPORTED_LANGUAGES[0];

  return (
    <>
      <header className="header flex flex-wrap items-center justify-between gap-4 p-4 border-b border-cyan-500/20 bg-slate-950/85 backdrop-blur-md sticky top-0 z-40">
        <div className="brand flex items-center gap-3">
          <div
            className="logo w-11 h-11 rounded-xl bg-gradient-to-tr from-cyan-500 via-indigo-600 to-emerald-500 flex items-center justify-center text-white shadow-lg shadow-cyan-500/25 shrink-0"
            aria-hidden="true"
          >
            <Shield className="w-6 h-6 text-cyan-100" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black tracking-tight text-white m-0">
                {t.brandName}
              </h1>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-500/40">
                {t.version}
              </span>
            </div>
            <p className="text-xs text-slate-400 m-0">
              {t.tagline}
            </p>
          </div>
        </div>

        {/* Toolbar & Controls */}
        <div className="flex items-center flex-wrap gap-2">
          {/* Multi-language Selector (Indian Languages + English) */}
          <div className="relative">
            <button
              onClick={() => {
                soundEngine.playClick(700);
                setShowLangMenu(!showLangMenu);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900/90 hover:bg-slate-800 border border-cyan-500/30 text-cyan-300 text-xs font-semibold transition cursor-pointer"
              aria-label="Change Language"
              aria-expanded={showLangMenu}
            >
              <Globe className="w-3.5 h-3.5 text-cyan-400" />
              <span className="font-sans">{currentLangObj.flag} {currentLangObj.nativeName}</span>
            </button>

            {showLangMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowLangMenu(false)}
                />
                <div className="absolute right-0 mt-2 w-56 rounded-xl bg-slate-900 border border-cyan-500/40 shadow-2xl z-50 py-1.5 max-h-80 overflow-y-auto">
                  <div className="px-3 py-1 text-[10px] font-mono text-cyan-400 uppercase tracking-wider border-b border-slate-800">
                    Select Language / भाषा चुनें
                  </div>
                  {SUPPORTED_LANGUAGES.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => handleLangSelect(lang.code)}
                      className={`w-full flex items-center justify-between px-3 py-2 text-xs text-left transition cursor-pointer hover:bg-slate-800 ${
                        currentLanguage === lang.code
                          ? 'text-cyan-300 bg-cyan-950/60 font-bold'
                          : 'text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span>{lang.flag}</span>
                        <span>{lang.nativeName}</span>
                        <span className="text-[10px] text-slate-500 font-mono">({lang.name})</span>
                      </div>
                      {currentLanguage === lang.code && (
                        <Check className="w-3.5 h-3.5 text-cyan-400" />
                      )}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Tactical Sound Effects Toggle */}
          <button
            onClick={toggleSound}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition cursor-pointer ${
              soundEnabled
                ? 'bg-cyan-950/80 border-cyan-500/40 text-cyan-300 hover:bg-cyan-900'
                : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-400'
            }`}
            title={soundEnabled ? 'Disable Cyber Sound Effects' : 'Enable Cyber Sound Effects'}
            aria-label="Toggle Sound Effects"
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-cyan-400" /> : <VolumeX className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{soundEnabled ? t.soundOn : t.soundOff}</span>
          </button>

          {/* Tactical Voice Announcer Toggle (TTS) */}
          <button
            onClick={toggleVoice}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition cursor-pointer ${
              voiceEnabled
                ? 'bg-indigo-950/80 border-indigo-500/40 text-indigo-300 hover:bg-indigo-900'
                : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-400'
            }`}
            title={voiceEnabled ? 'Mute AI Voice Operator' : 'Enable AI Voice Operator (TTS)'}
            aria-label="Toggle Voice Announcer"
          >
            {voiceEnabled ? <Mic className="w-3.5 h-3.5 text-indigo-400" /> : <MicOff className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{voiceEnabled ? t.voiceOn : t.voiceOff}</span>
          </button>

          {/* Real-time Backend Connectivity Status */}
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 text-xs font-semibold tracking-wider"
            role="status"
            aria-label={`Backend Status: ${healthStatus.statusText}`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" aria-hidden="true" />
            <span>{t.connected}</span>
          </div>

          {/* Test Suite Button */}
          <button
            onClick={() => {
              soundEngine.playClick(800);
              onOpenTestSuite();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-950/70 hover:bg-indigo-900 border border-indigo-500/30 text-indigo-300 text-xs font-medium transition cursor-pointer focus-visible:ring-2 focus-visible:ring-indigo-400"
            aria-label="Open Automated Security Test Suite (Hotkey T)"
            title="Automated Test Suite (T)"
          >
            <TestTube className="w-3.5 h-3.5 text-indigo-400" />
            <span>{t.testSuite}</span>
            <kbd className="hidden sm:inline-block px-1 rounded bg-black/40 text-[10px] text-indigo-300/80 border border-indigo-500/30 font-mono">
              T
            </kbd>
          </button>

          {/* Google Gemini AI Policy Generator */}
          <button
            onClick={() => {
              soundEngine.playClick(850);
              onOpenPolicyModal();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-950/70 hover:bg-cyan-900 border border-cyan-500/30 text-cyan-300 text-xs font-medium transition cursor-pointer focus-visible:ring-2 focus-visible:ring-cyan-400"
            aria-label="Generate Adaptive Security Policy with Google Gemini"
            title="Google Gemini AI Policy Synthesizer"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>{t.geminiPolicy}</span>
          </button>

          {/* Full Security Audit & RBAC Hardening */}
          <button
            onClick={() => {
              soundEngine.playClick(900);
              onOpenSecurityAudit();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-300 text-xs font-medium transition cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-400"
            aria-label="Open Security Posture Audit"
            title="Security Audit & RBAC"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>{t.securityAudit}</span>
            <span className="text-[10px] font-mono px-1 rounded bg-black/40 text-emerald-300 border border-emerald-500/30">
              {t.gradeA}
            </span>
          </button>

          {/* Accessibility Settings */}
          <div className="flex items-center gap-1 border-l border-slate-800 pl-2 ml-1">
            <button
              onClick={() => {
                soundEngine.playClick(750);
                setHighContrast(!highContrast);
              }}
              className={`p-1.5 rounded-md border text-xs transition cursor-pointer focus-visible:ring-2 focus-visible:ring-cyan-400 ${
                highContrast
                  ? 'bg-amber-400 text-slate-950 border-amber-300 font-bold'
                  : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
              }`}
              title="Toggle High Contrast Mode (WCAG)"
              aria-label="Toggle High Contrast Mode"
              aria-pressed={highContrast}
            >
              <Eye className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => {
                soundEngine.playClick(750);
                setReducedMotion(!reducedMotion);
              }}
              className={`p-1.5 rounded-md border text-xs transition cursor-pointer focus-visible:ring-2 focus-visible:ring-cyan-400 ${
                reducedMotion
                  ? 'bg-purple-500 text-white border-purple-400 font-bold'
                  : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
              }`}
              title="Toggle Reduced Motion"
              aria-label="Toggle Reduced Motion"
              aria-pressed={reducedMotion}
            >
              <Zap className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => {
                soundEngine.playClick(750);
                setShowShortcuts(true);
              }}
              className="p-1.5 rounded-md bg-slate-900 border border-slate-700 text-slate-400 hover:text-white text-xs transition cursor-pointer focus-visible:ring-2 focus-visible:ring-cyan-400"
              title="Keyboard Shortcuts Guide (?)"
              aria-label="View Keyboard Shortcuts"
            >
              <Keyboard className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Keyboard Shortcuts Dialog */}
      {showShortcuts && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="shortcuts-title"
        >
          <div className="bg-slate-900 border border-cyan-500/30 rounded-2xl max-w-md w-full p-6 shadow-2xl text-slate-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Keyboard className="w-5 h-5 text-cyan-400" />
                <h2 id="shortcuts-title" className="text-lg font-bold text-white m-0">
                  Keyboard Shortcuts
                </h2>
              </div>
              <button
                onClick={() => {
                  soundEngine.playClick(600);
                  setShowShortcuts(false);
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                aria-label="Close keyboard shortcuts dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between py-1.5 border-b border-slate-800">
                <span className="text-slate-300">Run Full Security Sweep</span>
                <kbd className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-cyan-300 text-xs">
                  S
                </kbd>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-slate-800">
                <span className="text-slate-300">Open Automated Test Suite</span>
                <kbd className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-cyan-300 text-xs">
                  T
                </kbd>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-slate-800">
                <span className="text-slate-300">Approve Pending Action Gate</span>
                <kbd className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-emerald-400 text-xs">
                  A
                </kbd>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-slate-800">
                <span className="text-slate-300">Deny Pending Action Gate</span>
                <kbd className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-rose-400 text-xs">
                  D
                </kbd>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-slate-800">
                <span className="text-slate-300">Dismiss Modal / Close Dialog</span>
                <kbd className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-slate-400 text-xs">
                  Esc
                </kbd>
              </div>
            </div>
            <div className="mt-6 text-right">
              <button
                onClick={() => {
                  soundEngine.playClick(600);
                  setShowShortcuts(false);
                }}
                className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs transition cursor-pointer"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
