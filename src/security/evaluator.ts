/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { AgentAction, DecisionType, IntentResult, PermissionType, RiskLevelType, SecurityResult, TrustLevelType } from '../types/agentguard.ts';
import { APPROVAL_REQUIRED_TOOLS, AUTO_ALLOWED_TOOLS, BLOCKED_TOOLS, PROMPT_INJECTION_TRIGGERS, SENSITIVE_PATTERNS, TOOLS, TRUSTED_DOMAINS } from './rules.ts';
import { generateSignedApprovalToken } from './cryptoAudit.ts';

/**
 * Evaluates an agent's proposed action against AgentGuard's multi-layered defense policies.
 */
export function evaluateAction(action: AgentAction, intentResult: IntentResult): SecurityResult {
  const actionName = (action?.action || 'unknown').toLowerCase().trim();
  const parameters = action?.parameters || {};
  const paramsStr = JSON.stringify(parameters).toLowerCase();
  const factors: string[] = [];
  const sensitiveDetected: string[] = [];
  const untrustedDestinations: string[] = [];
  const injectionFlags: string[] = [];

  // 1. Tool authorization check
  if (!TOOLS[actionName]) {
    const reasonText = `Tool '${actionName}' is not authorized in AgentGuard registry.`;
    return {
      decision: 'BLOCK',
      risk_score: 100,
      risk_level: 'CRITICAL',
      risk_category: 'CRITICAL',
      permission: 'DENIED',
      security: {
        permission: 'DENIED',
        destination_allowed: false,
      },
      agent_trust: 0,
      trust_level: 'UNTRUSTED',
      factors: ['Unauthorized or unregistered tool call: ' + actionName],
      policy_rules: ['Unauthorized or unregistered tool call: ' + actionName],
      reason: reasonText,
      explanation: reasonText,
      destination_allowed: false,
      evaluated_at: new Date().toISOString(),
    };
  }

  const toolMeta = TOOLS[actionName];
  let risk = toolMeta.base_risk;
  factors.push(`Base tool risk: ${toolMeta.base_risk} (${toolMeta.category.toUpperCase()})`);

  // 2. Permission Firewall
  let permission: PermissionType;
  if (AUTO_ALLOWED_TOOLS.includes(actionName)) {
    permission = 'AUTHORIZED';
    factors.push('Permission Firewall: Action is whitelisted for autonomous execution');
  } else if (APPROVAL_REQUIRED_TOOLS.includes(actionName)) {
    permission = 'HUMAN_APPROVAL';
    factors.push('Permission Firewall: Action requires explicit human verification gate');
  } else if (BLOCKED_TOOLS.includes(actionName)) {
    permission = 'DENIED';
    risk += 15;
    factors.push('Permission Firewall: Destructive or high-impact action denied for autonomous run');
  } else {
    permission = 'DENIED';
    risk += 20;
    factors.push('Permission Firewall: No approved execution policy defined');
  }

  // 3. Intent Drift Penalty
  if (!intentResult.intent_match) {
    const penalty = (intentResult.divergence_type === 'GOAL_HIJACK' || intentResult.score <= 10) ? 40 : 25;
    risk += penalty;
    factors.push(`Intent Drift: ${intentResult.divergence_type === 'GOAL_HIJACK' ? 'Goal Hijack / Injection Attempt' : 'Action diverges from user request'} (+${penalty} risk)`);
  }

  // 4. Sensitive Data Scan (PII, Passwords, Banking, Aadhaar/SSN)
  for (const item of SENSITIVE_PATTERNS) {
    if (item.pattern.test(paramsStr)) {
      risk += item.riskAdd;
      sensitiveDetected.push(item.name);
      factors.push(`Sensitive Data Warning: Detected ${item.name} in parameters (+${item.riskAdd} risk)`);
    }
  }

  // 5. Destination & SSRF / Exfiltration Check
  const destination = String(parameters.destination || parameters.url || parameters.recipient || '').toLowerCase();
  let destinationAllowed = true;

  if (destination) {
    const isSsrfTarget =
      destination.includes('169.254.169.254') ||
      destination.includes('metadata.google.internal') ||
      destination.includes('localhost') ||
      destination.includes('127.0.0.1') ||
      destination.includes('0.0.0.0') ||
      destination.includes('10.') ||
      destination.includes('192.168.');

    if (isSsrfTarget) {
      risk += 45;
      destinationAllowed = false;
      untrustedDestinations.push(destination);
      factors.push(`SSRF & Cloud Metadata Defense: Disallowed egress to private/cloud infrastructure target: ${destination}`);
    } else if (destination.includes('@')) {
      // Email recipient
      if (destination.includes('malicious') || destination.includes('unknown') || destination.includes('temp-mail')) {
        risk += 25;
        destinationAllowed = false;
        untrustedDestinations.push(destination);
        factors.push(`Suspicious Recipient: Outbound message to untrusted address: ${destination}`);
      }
    } else {
      // Domain or URL
      const isTrusted = TRUSTED_DOMAINS.some(domain => destination.includes(domain));
      if (!isTrusted) {
        risk += 20;
        destinationAllowed = false;
        untrustedDestinations.push(destination);
        factors.push(`Untrusted External Destination: Target '${destination}' is outside verified registry`);
      } else {
        factors.push(`Verified Destination: Target '${destination}' is within trusted domain registry`);
      }
    }
  }

  // 6. Prompt Injection / Jailbreak Triggers in parameters
  for (const trig of PROMPT_INJECTION_TRIGGERS) {
    if (trig.pattern.test(paramsStr)) {
      risk += trig.riskAdd;
      injectionFlags.push(trig.name);
      factors.push(`Indirect Prompt Injection Flag: ${trig.name} detected (+${trig.riskAdd} risk)`);
    }
  }

  // Bound risk to [0, 100]
  risk = Math.max(0, Math.min(100, Math.round(risk)));

  // 7. Final Security Decision
  let decision: DecisionType;
  let level: RiskLevelType;
  let reason: string;

  if (permission === 'DENIED' || risk >= 80) {
    decision = 'BLOCK';
    level = 'CRITICAL';
    reason = 'Action blocked by AgentGuard Security Gateway: Severe threat index violates security policy.';
  } else if (permission === 'HUMAN_APPROVAL') {
    decision = 'REQUIRE_APPROVAL';
    level = risk >= 50 ? 'HIGH' : 'MEDIUM';
    reason = 'Action requires human approval before dispatching external interaction.';
  } else if (risk < 30) {
    decision = 'ALLOW';
    level = 'LOW';
    reason = 'Action verified safe: Low risk, verified intent, and approved permissions.';
  } else if (risk < 60) {
    decision = 'REQUIRE_APPROVAL';
    level = 'MEDIUM';
    reason = 'Moderate risk detected: Human verification required before execution.';
  } else if (risk < 80) {
    decision = 'REQUIRE_APPROVAL';
    level = 'HIGH';
    reason = 'Elevated threat index: High-risk operation halted for administrative consent.';
  } else {
    decision = 'BLOCK';
    level = 'CRITICAL';
    reason = 'Action blocked: Severe risk index exceeds autonomous execution safety threshold.';
  }

  // 8. Adaptive Agent Trust calculation
  const agent_trust = Math.max(0, 100 - risk);
  let trust_level: TrustLevelType;
  if (agent_trust >= 80) trust_level = 'TRUSTED';
  else if (agent_trust >= 50) trust_level = 'CAUTION';
  else if (agent_trust >= 25) trust_level = 'LOW TRUST';
  else trust_level = 'UNTRUSTED';

  // 9. Generate cryptographic approval token for human approval gate
  const approval_token = decision === 'REQUIRE_APPROVAL'
    ? generateSignedApprovalToken(actionName, risk)
    : undefined;

  return {
    decision,
    risk_score: risk,
    risk_level: level,
    risk_category: level,
    permission,
    security: {
      permission,
      destination_allowed: destinationAllowed,
    },
    agent_trust,
    trust_level,
    factors,
    policy_rules: factors,
    reason,
    explanation: reason,
    sensitive_data_detected: sensitiveDetected.length > 0 ? sensitiveDetected : undefined,
    untrusted_destinations: untrustedDestinations.length > 0 ? untrustedDestinations : undefined,
    destination_allowed: destinationAllowed,
    prompt_injection_flags: injectionFlags.length > 0 ? injectionFlags : undefined,
    approval_token,
    evaluated_at: new Date().toISOString(),
  };
}
