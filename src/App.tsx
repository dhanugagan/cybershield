/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { HeroSection } from './components/HeroSection';
import { ProblemStatementBanner } from './components/ProblemStatementBanner';
import { SecurityCoreFlow } from './components/SecurityCoreFlow';
import { ThreatIntelligence } from './components/ThreatIntelligence';
import { EfficiencyBenchmarkPanel } from './components/EfficiencyBenchmarkPanel';
import { AgentDefenseLab } from './components/AgentDefenseLab';
import { CustomPayloadSandbox } from './components/CustomPayloadSandbox';
import { HumanApprovalGate } from './components/HumanApprovalGate';
import { ApprovalQueue } from './components/ApprovalQueue';
import { AnalysisResultView } from './components/AnalysisResultView';
import { LiveEventsMonitor } from './components/LiveEventsMonitor';
import { AccessibilityCompliancePanel } from './components/AccessibilityCompliancePanel';
import { AutomatedTestSuiteModal } from './components/AutomatedTestSuiteModal';
import { GeminiPolicyGeneratorModal } from './components/GeminiPolicyGeneratorModal';
import { SecurityAuditModal } from './components/SecurityAuditModal';
import { ErrorBoundary } from './components/ErrorBoundary';
import { CyberCanvasBackground } from './components/CyberCanvasBackground';
import { CyberThreatRadar } from './components/CyberThreatRadar';
import { CyberPacketInspector } from './components/CyberPacketInspector';
import { DEFAULT_AGENTS } from './security/scenarios';
import { AgentAction, AgentInfo, GatewayEvent } from './types/agentguard';
import {
  fetchAttackScenario,
  interceptGatewayAction,
  synthesizeRedTeamAttack,
  AttackResponse,
} from './services/api';
import { cryptoAuditLog } from './security/cryptoAudit';
import { soundEngine } from './audio/soundEffects';
import {
  SupportedLanguage,
  getTranslation,
  SUPPORTED_LANGUAGES,
} from './i18n/translations';
import { Shield, CheckCircle, RefreshCw } from 'lucide-react';

export default function App() {
  // Localization & Language State
  const [currentLanguage, setCurrentLanguage] = useState<SupportedLanguage>('en');
  const t = getTranslation(currentLanguage);

  // Tactical Threat Level (DEFCON 1 to 5)
  const [defconLevel, setDefconLevel] = useState<number>(5);

  // State
  const [result, setResult] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeAgent, setActiveAgent] = useState<string | null>(null);
  const [testsRun, setTestsRun] = useState(0);
  const [threatsBlocked, setThreatsBlocked] = useState(0);
  const [agentTrust, setAgentTrust] = useState(100);
  const [pendingQueue, setPendingQueue] = useState<AttackResponse[]>([]);
  const [events, setEvents] = useState<GatewayEvent[]>([
    {
      id: 1,
      agent: 'SENTINEL',
      name: 'web_search',
      decision: 'ALLOW',
      risk: 10,
      level: 'LOW',
      time: '12:00:15 PM',
      user_request: 'Search for Python machine learning internships in summer 2026',
      reason: 'Action verified safe: Low risk, verified intent, and approved permissions.',
    },
    {
      id: 2,
      agent: 'AEGIS',
      name: 'delete_file',
      decision: 'BLOCK',
      risk: 100,
      level: 'CRITICAL',
      time: '12:04:32 PM',
      user_request: 'Find Python internships for college credit',
      reason: 'Action blocked by AgentGuard Permission Firewall: Autonomous execution prohibited.',
    },
  ]);
  const [approvalRequest, setApprovalRequest] = useState<AttackResponse | null>(null);
  const [approvalDecision, setApprovalDecision] = useState<'APPROVED' | 'DENIED' | null>(null);

  // Accessibility & Modals
  const [highContrast, setHighContrast] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [testSuiteOpen, setTestSuiteOpen] = useState(false);
  const [policyModalOpen, setPolicyModalOpen] = useState(false);
  const [securityAuditOpen, setSecurityAuditOpen] = useState(false);

  // Handle Language Change with Speech Feedback
  const handleLanguageChange = (lang: SupportedLanguage) => {
    setCurrentLanguage(lang);
    const newTrans = getTranslation(lang);
    const langInfo = SUPPORTED_LANGUAGES.find((l) => l.code === lang);
    soundEngine.playClick(900);
    soundEngine.speak(newTrans.voiceAnnounceLangChanged, langInfo?.speechLocale || 'en-US');
  };

  // Single scenario runner
  const runAgent = useCallback(
    async (agent: AgentInfo | { id: string; codename: string; name: string }) => {
      setLoading(true);
      setResult(null);
      setActiveAgent(agent.id);
      setApprovalRequest(null);
      setApprovalDecision(null);

      try {
        const data = await fetchAttackScenario(agent.id);
        setResult(data);

        // Sound & Vocal reactions
        if (data.security.decision === 'BLOCK') {
          soundEngine.playThreatAlert();
          soundEngine.speak(
            `${t.voiceAnnounceThreatBlocked} Reason: ${data.security.reason}`
          );
        } else if (data.security.decision === 'REQUIRE_APPROVAL') {
          soundEngine.playRequireApprovalTone();
          soundEngine.speak(t.voiceAnnounceApprovalNeeded);
          setApprovalRequest(data);
          setPendingQueue((prev) => {
            if (!prev.some((p) => p.security.approval_token === data.security.approval_token)) {
              return [data, ...prev];
            }
            return prev;
          });
        } else {
          soundEngine.playSuccessChime();
        }

        const newEvent: GatewayEvent = {
          id: Date.now(),
          agent: agent.codename,
          name: agent.name,
          decision: data.security.decision,
          risk: data.security.risk_score,
          level: data.security.risk_level,
          time: new Date().toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          }),
          user_request: data.user_request,
          action_name: data.agent_action.action,
          reason: data.security.reason,
        };

        // Append to cryptographic audit chain
        cryptoAuditLog.appendEvent(newEvent);

        setEvents((prev) => [newEvent, ...prev].slice(0, 20));
        setTestsRun((prev) => prev + 1);

        if (data.security.decision === 'BLOCK') {
          setThreatsBlocked((prev) => prev + 1);
        }

        let trustPenalty = 0;
        if (data.security.risk_score >= 80) {
          trustPenalty = 15;
        } else if (data.security.risk_score >= 60) {
          trustPenalty = 10;
        } else if (data.security.risk_score >= 30) {
          trustPenalty = 5;
        }
        setAgentTrust((prev) => Math.max(0, prev - trustPenalty));
      } catch (err: any) {
        soundEngine.playThreatAlert();
        setResult({
          error: err.message || 'Security evaluation error.',
        });
      } finally {
        setLoading(false);
      }
    },
    [t]
  );

  // Approve action
  const approveAction = useCallback(
    (target?: AttackResponse) => {
      const item = target || approvalRequest;
      setApprovalDecision('APPROVED');
      setApprovalRequest(null);

      soundEngine.playSuccessChime();
      soundEngine.speak(t.voiceAnnounceApproved);

      if (item) {
        setPendingQueue((prev) =>
          prev.filter((p) => p.security.approval_token !== item.security.approval_token)
        );
      }

      const approvedEvent: GatewayEvent = {
        id: Date.now(),
        agent: 'ORACLE',
        name: item?.agent_action?.action || 'send_email',
        decision: 'APPROVED',
        risk: item?.security?.risk_score || 45,
        level: item?.security?.risk_level || 'HIGH',
        time: new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }),
        reason: 'Human authorized release token. Action permitted to proceed.',
      };

      cryptoAuditLog.appendEvent(approvedEvent);
      setEvents((prev) => [approvedEvent, ...prev].slice(0, 20));
    },
    [approvalRequest, t]
  );

  // Deny action
  const denyAction = useCallback(
    (target?: AttackResponse) => {
      const item = target || approvalRequest;
      setApprovalDecision('DENIED');
      setApprovalRequest(null);

      soundEngine.playThreatAlert();
      soundEngine.speak(t.voiceAnnounceDenied);

      if (item) {
        setPendingQueue((prev) =>
          prev.filter((p) => p.security.approval_token !== item.security.approval_token)
        );
      }

      const deniedEvent: GatewayEvent = {
        id: Date.now(),
        agent: 'ORACLE',
        name: item?.agent_action?.action || 'send_email',
        decision: 'DENIED',
        risk: item?.security?.risk_score || 45,
        level: item?.security?.risk_level || 'HIGH',
        time: new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }),
        reason: 'Human denied execution token. Tool call terminated.',
      };

      cryptoAuditLog.appendEvent(deniedEvent);
      setEvents((prev) => [deniedEvent, ...prev].slice(0, 20));
    },
    [approvalRequest, t]
  );

  // Full Security Sweep: runs all scenarios with progressive live updates
  const runFullSweep = useCallback(async () => {
    setLoading(true);
    setResult(null);
    setApprovalRequest(null);
    setApprovalDecision(null);
    setActiveAgent(null);

    soundEngine.playScanSweep();
    soundEngine.speak(t.voiceAnnounceSweepStarted);

    const scenarioIds = [
      'safe_search',
      'prompt_injection',
      'data_exfiltration',
      'unauthorized_delete',
      'approval_required',
    ];

    const sweepResults: AttackResponse[] = [];

    try {
      for (const id of scenarioIds) {
        const data = await fetchAttackScenario(id);
        sweepResults.push(data);
        if (data.security.decision === 'REQUIRE_APPROVAL') {
          setPendingQueue((prev) => {
            if (!prev.some((p) => p.security.approval_token === data.security.approval_token)) {
              return [data, ...prev];
            }
            return prev;
          });
        }
      }

      const blocked = sweepResults.filter((item) => item.security.decision === 'BLOCK').length;
      const approvals = sweepResults.filter(
        (item) => item.security.decision === 'REQUIRE_APPROVAL'
      ).length;
      const allowed = sweepResults.filter((item) => item.security.decision === 'ALLOW').length;

      setTestsRun((prev) => prev + sweepResults.length);
      setThreatsBlocked((prev) => prev + blocked);

      const newEvents: GatewayEvent[] = sweepResults.map((item, index) => ({
        id: Date.now() + index,
        agent:
          item.scenario.type === 'NORMAL'
            ? 'SENTINEL'
            : item.scenario.type === 'PROMPT_INJECTION'
            ? 'PHANTOM'
            : item.scenario.type === 'DATA_EXFILTRATION'
            ? 'EXFIL'
            : item.scenario.type === 'UNAUTHORIZED_ACTION'
            ? 'AEGIS'
            : 'ORACLE',
        name: item.scenario.name,
        decision: item.security.decision,
        risk: item.security.risk_score,
        level: item.security.risk_level,
        time: new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }),
        user_request: item.user_request,
        action_name: item.agent_action.action,
        reason: item.security.reason,
      }));

      newEvents.forEach((e) => cryptoAuditLog.appendEvent(e));
      setEvents((prev) => [...newEvents.reverse(), ...prev].slice(0, 20));

      setResult({
        sweep: true,
        results: sweepResults,
        summary: {
          total: sweepResults.length,
          blocked,
          approvals,
          allowed,
        },
      });

      setAgentTrust((prev) => Math.max(0, prev - blocked * 5));
      soundEngine.playSuccessChime();
    } catch (err: any) {
      soundEngine.playThreatAlert();
      setResult({
        error: 'Security sweep encountered an issue: ' + err.message,
      });
    } finally {
      setLoading(false);
    }
  }, [t]);

  // Synthesize Red-Team Attack with Gemini
  const synthesizeAttack = async () => {
    setLoading(true);
    setResult(null);
    setApprovalRequest(null);
    setApprovalDecision(null);

    soundEngine.playRadarPing();
    soundEngine.speak('Synthesizing adversarial red-team payload with Google Gemini AI.');

    try {
      const generated = await synthesizeRedTeamAttack('prompt_injection');
      const intercept = await interceptGatewayAction(
        generated.userRequest,
        generated.proposedAction,
        'GEMINI-REDTEAM'
      );

      const data: AttackResponse = {
        scenario: {
          name: generated.scenarioName,
          type: 'PROMPT_INJECTION',
          description: generated.payloadDescription,
          owasp_category: generated.adversaryTechnique,
        },
        user_request: generated.userRequest,
        agent_action: generated.proposedAction,
        intent_check: intercept.gateway_result.intent,
        security: intercept.gateway_result.security,
      };

      setResult(data);
      if (data.security.decision === 'REQUIRE_APPROVAL') {
        soundEngine.playRequireApprovalTone();
        setApprovalRequest(data);
      } else if (data.security.decision === 'BLOCK') {
        soundEngine.playThreatAlert();
      } else {
        soundEngine.playSuccessChime();
      }

      const newEvent: GatewayEvent = {
        id: Date.now(),
        agent: 'GEMINI-REDTEAM',
        name: generated.scenarioName,
        decision: data.security.decision,
        risk: data.security.risk_score,
        level: data.security.risk_level,
        time: new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }),
        user_request: data.user_request,
        action_name: data.agent_action.action,
        reason: data.security.reason,
      };

      cryptoAuditLog.appendEvent(newEvent);
      setEvents((prev) => [newEvent, ...prev].slice(0, 20));
      setTestsRun((prev) => prev + 1);
      if (data.security.decision === 'BLOCK') {
        setThreatsBlocked((prev) => prev + 1);
      }
    } catch (err: any) {
      soundEngine.playThreatAlert();
      setResult({ error: err.message });
    } finally {
      setLoading(false);
    }
  };

  // Execute custom payload from sandbox
  const executeCustomPayload = async (request: string, action: AgentAction) => {
    setLoading(true);
    setResult(null);
    setApprovalRequest(null);
    setApprovalDecision(null);

    try {
      const intercepted = await interceptGatewayAction(request, action, 'CUSTOM_AGENT');
      const data: AttackResponse = {
        scenario: {
          name: 'Custom Payload Test',
          type: 'UNAUTHORIZED_ACTION',
          description: 'User-specified payload evaluated against live AgentGuard policies.',
          owasp_category: 'Custom Sandbox Payload',
        },
        user_request: request,
        agent_action: action,
        intent_check: intercepted.gateway_result.intent,
        security: intercepted.gateway_result.security,
      };

      setResult(data);
      if (data.security.decision === 'REQUIRE_APPROVAL') {
        soundEngine.playRequireApprovalTone();
        setApprovalRequest(data);
      } else if (data.security.decision === 'BLOCK') {
        soundEngine.playThreatAlert();
        soundEngine.speak(t.voiceAnnounceThreatBlocked);
      } else {
        soundEngine.playSuccessChime();
        soundEngine.speak(t.voiceAnnounceActionAllowed);
      }

      const newEvent: GatewayEvent = {
        id: Date.now(),
        agent: 'CUSTOM',
        name: action.action,
        decision: data.security.decision,
        risk: data.security.risk_score,
        level: data.security.risk_level,
        time: new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }),
        user_request: request,
        action_name: action.action,
        reason: data.security.reason,
      };

      cryptoAuditLog.appendEvent(newEvent);
      setEvents((prev) => [newEvent, ...prev].slice(0, 20));
      setTestsRun((prev) => prev + 1);
      if (data.security.decision === 'BLOCK') {
        setThreatsBlocked((prev) => prev + 1);
      }
    } catch (err: any) {
      soundEngine.playThreatAlert();
      setResult({ error: err.message });
    } finally {
      setLoading(false);
    }
  };

  // Keyboard accessibility shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (e.key === 'a' || e.key === 'A') {
        if (approvalRequest || pendingQueue.length > 0) {
          e.preventDefault();
          approveAction(pendingQueue[0] || approvalRequest);
        }
      } else if (e.key === 'd' || e.key === 'D') {
        if (approvalRequest || pendingQueue.length > 0) {
          e.preventDefault();
          denyAction(pendingQueue[0] || approvalRequest);
        }
      } else if (e.key === 's' || e.key === 'S') {
        e.preventDefault();
        runFullSweep();
      } else if (e.key === 't' || e.key === 'T') {
        e.preventDefault();
        soundEngine.playClick(850);
        setTestSuiteOpen((prev) => !prev);
      } else if (e.key === 'u' || e.key === 'U') {
        e.preventDefault();
        soundEngine.playClick(900);
        setSecurityAuditOpen((prev) => !prev);
      } else if (e.key === 'Escape') {
        soundEngine.playClick(600);
        setTestSuiteOpen(false);
        setPolicyModalOpen(false);
        setSecurityAuditOpen(false);
        setApprovalRequest(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [approvalRequest, pendingQueue, approveAction, denyAction, runFullSweep]);

  // Derived metrics
  const blockedCount = events.filter((e) => e.decision === 'BLOCK' || e.decision === 'DENIED').length;
  const approvalCount = events.filter((e) => e.decision === 'REQUIRE_APPROVAL').length;
  const highRiskCount = events.filter((e) => e.risk >= 80).length;
  const totalEvents = events.length;
  const protectionRate =
    totalEvents === 0 ? 100 : Math.round(((blockedCount + approvalCount) / totalEvents) * 100);

  return (
    <ErrorBoundary>
      <div
        className={`app min-h-screen relative overflow-x-hidden ${highContrast ? 'high-contrast' : ''} ${
          reducedMotion ? 'reduced-motion' : ''
        }`}
      >
        {/* Interactive Cyber Canvas Animated Background */}
        <CyberCanvasBackground
          reducedMotion={reducedMotion}
          highContrast={highContrast}
          alertMode={defconLevel <= 2}
        />

        {/* Visual Ambiance Auroras & Digital Grid */}
        <div className="aurora aurora-one" aria-hidden="true" />
        <div className="aurora aurora-two" aria-hidden="true" />
        <div className="grid-overlay" aria-hidden="true" />

        {/* Skip to Content for Screen Readers */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-cyan-500 focus:text-slate-950 focus:font-bold focus:rounded-lg"
        >
          Skip to main content
        </a>

        {/* Header with Language Selector, Sound & Voice Toggles */}
        <Header
          onOpenTestSuite={() => setTestSuiteOpen(true)}
          onOpenPolicyModal={() => setPolicyModalOpen(true)}
          onOpenSecurityAudit={() => setSecurityAuditOpen(true)}
          highContrast={highContrast}
          setHighContrast={setHighContrast}
          reducedMotion={reducedMotion}
          setReducedMotion={setReducedMotion}
          currentLanguage={currentLanguage}
          onLanguageChange={handleLanguageChange}
          t={t}
        />

        {/* Main Content */}
        <main id="main-content" className="max-w-6xl mx-auto px-4 py-8 relative z-10">
          <HeroSection
            onOpenSecurityAudit={() => setSecurityAuditOpen(true)}
            onOpenTestSuite={() => setTestSuiteOpen(true)}
            t={t}
          />

          {/* Interactive Cyber Threat Radar & Node Map */}
          <CyberThreatRadar
            agents={DEFAULT_AGENTS}
            activeAgent={activeAgent}
            onSelectAgent={runAgent}
            threatsBlocked={threatsBlocked}
            t={t}
            defconLevel={defconLevel}
            setDefconLevel={setDefconLevel}
          />

          {/* Problem Statement & Mission Alignment */}
          <ProblemStatementBanner t={t} />

          <SecurityCoreFlow />

          <ThreatIntelligence
            protectionRate={protectionRate}
            blockedCount={blockedCount}
            approvalCount={approvalCount}
            highRiskCount={highRiskCount}
            agentTrust={agentTrust}
            t={t}
          />

          {/* High-Efficiency Benchmarks */}
          <EfficiencyBenchmarkPanel />

          <AgentDefenseLab
            agents={DEFAULT_AGENTS}
            activeAgent={activeAgent}
            loading={loading}
            onRunAgent={runAgent}
            onRunFullSweep={runFullSweep}
            onSynthesizeAttack={synthesizeAttack}
            onTestHumanApproval={() =>
              runAgent({
                id: 'approval_required',
                codename: 'ORACLE',
                name: 'ORACLE — Human Approval',
              })
            }
            t={t}
          />

          {/* Interactive Real-Time Cyber Packet & Hex Inspector */}
          <CyberPacketInspector t={t} />

          <CustomPayloadSandbox
            onExecuteCustom={executeCustomPayload}
            loading={loading}
            t={t}
          />

          {/* Loading / Scanning Banner */}
          {loading && (
            <section className="my-8 p-6 rounded-2xl bg-slate-900/80 border border-cyan-500/40 text-center animate-pulse">
              <RefreshCw className="w-8 h-8 mx-auto text-cyan-400 animate-spin mb-3" />
              <h3 className="text-lg font-bold text-white m-0">AgentGuard Evaluating Tool Call...</h3>
              <p className="text-xs text-slate-400 mt-1">
                Verifying intent drift · Tool permissions · Data sensitivity · Destination registry
              </p>
            </section>
          )}

          {/* Human Approval Gate (Single focused review) */}
          {approvalRequest && (
            <HumanApprovalGate
              request={approvalRequest}
              onApprove={() => approveAction()}
              onDeny={() => denyAction()}
              t={t}
            />
          )}

          {/* Human Approval Queue (Multiple queued pending actions) */}
          <ApprovalQueue
            pendingItems={pendingQueue}
            onApprove={(item) => approveAction(item)}
            onDeny={(item) => denyAction(item)}
          />

          {/* Human Decision Confirmation Banner */}
          {approvalDecision && (
            <section
              className={`my-6 p-4 rounded-xl border flex items-center gap-3 ${
                approvalDecision === 'APPROVED'
                  ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                  : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
              }`}
              role="status"
            >
              <CheckCircle className="w-5 h-5 shrink-0" />
              <div>
                <strong className="text-xs font-bold block">
                  {approvalDecision === 'APPROVED' ? 'ACTION APPROVED BY HUMAN' : 'ACTION DENIED BY HUMAN'}
                </strong>
                <span className="text-[11px] opacity-90">
                  {approvalDecision === 'APPROVED'
                    ? 'AgentGuard released execution authorization token after cryptographic human sign-off.'
                    : 'AgentGuard permanently terminated the proposed tool call. Agent cannot proceed.'}
                </span>
              </div>
            </section>
          )}

          {/* Detailed Analysis Result View */}
          {result && !loading && !result.error && (
            <AnalysisResultView result={result} t={t} />
          )}

          {/* Error Card */}
          {result?.error && (
            <section className="my-6 p-4 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs">
              <strong className="font-bold block mb-1">Analysis Warning:</strong>
              {result.error}
            </section>
          )}

          <LiveEventsMonitor events={events} onClear={() => setEvents([])} t={t} />

          {/* Accessibility Compliance Panel */}
          <AccessibilityCompliancePanel
            highContrast={highContrast}
            setHighContrast={setHighContrast}
            reducedMotion={reducedMotion}
            setReducedMotion={setReducedMotion}
          />
        </main>

        {/* Modals */}
        <AutomatedTestSuiteModal isOpen={testSuiteOpen} onClose={() => setTestSuiteOpen(false)} />

        <GeminiPolicyGeneratorModal isOpen={policyModalOpen} onClose={() => setPolicyModalOpen(false)} />

        <SecurityAuditModal isOpen={securityAuditOpen} onClose={() => setSecurityAuditOpen(false)} />

        {/* Footer */}
        <footer className="mt-16 border-t border-slate-900 py-8 text-center text-xs text-slate-500">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Shield className="w-4 h-4 text-cyan-500" />
            <strong className="text-slate-400">AgentGuard</strong>
            <span>•</span>
            <span>Trust Every Action. Verify Every Agent.</span>
          </div>
          <p className="m-0 text-[11px]">
            Hackathon Submission: AI Security, Responsible AI & Autonomous Agent Governance. Powered by Google AI Studio & Gemini.
          </p>
        </footer>
      </div>
    </ErrorBoundary>
  );
}
