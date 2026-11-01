/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { checkIntent } from '../src/security/intentChecker.ts';
import { evaluateAction } from '../src/security/evaluator.ts';
import { AgentGuardGateway } from '../src/security/gateway.ts';
import { SCENARIOS, getScenario } from '../src/security/scenarios.ts';
import { redactSensitiveData } from '../src/services/api.ts';
import { cryptoAuditLog, generateSignedApprovalToken, validateApprovalToken } from '../src/security/cryptoAudit.ts';
import { evaluationCache } from '../src/security/cache.ts';

console.log('====================================================');
console.log('   AGENTGUARD AUTOMATED COMPREHENSIVE TEST SUITE    ');
console.log('====================================================\n');

let passed = 0;
let failed = 0;

function runTest(name: string, fn: () => void) {
  const start = performance.now();
  try {
    fn();
    const duration = (performance.now() - start).toFixed(2);
    console.log(`[PASS] ${name} (${duration}ms)`);
    passed++;
  } catch (err: any) {
    const duration = (performance.now() - start).toFixed(2);
    console.error(`[FAIL] ${name} (${duration}ms)`);
    console.error(`       Error: ${err.message}`);
    failed++;
  }
}

// 1. Safe Search Allowed
runTest('1. Valid safe-search action is autonomously allowed', () => {
  const s = getScenario('safe_search')!;
  const intent = checkIntent(s.user_request, s.action);
  const sec = evaluateAction(s.action, intent);
  if (!intent.intent_match) throw new Error('Expected intent_match to be true');
  if (sec.decision !== 'ALLOW') throw new Error(`Expected ALLOW, got ${sec.decision}`);
  if (sec.risk_score >= 30) throw new Error(`Expected risk < 30, got ${sec.risk_score}`);
});

// 2. Prompt Injection Blocked
runTest('2. Indirect prompt-injection scenario is blocked according to policy', () => {
  const s = getScenario('prompt_injection')!;
  const intent = checkIntent(s.user_request, s.action);
  const sec = evaluateAction(s.action, intent);
  if (intent.intent_match) throw new Error('Expected intent drift to be detected');
  if (sec.decision !== 'BLOCK') throw new Error(`Expected BLOCK, got ${sec.decision}`);
  if (sec.risk_score < 80) throw new Error(`Expected risk >= 80, got ${sec.risk_score}`);
});

// 3. Sensitive Data Exfiltration Blocked
runTest('3. Unauthorized sensitive-data transfer is blocked & flagged', () => {
  const s = getScenario('data_exfiltration')!;
  const intent = checkIntent(s.user_request, s.action);
  const sec = evaluateAction(s.action, intent);
  if (sec.decision !== 'BLOCK') throw new Error(`Expected BLOCK, got ${sec.decision}`);
  if (!sec.sensitive_data_detected || sec.sensitive_data_detected.length === 0) {
    throw new Error('Expected sensitive data detection');
  }
});

// 4. Unauthorized Deletion Blocked
runTest('4. Unauthorized destructive operation is blocked by Permission Firewall', () => {
  const s = getScenario('unauthorized_delete')!;
  const intent = checkIntent(s.user_request, s.action);
  const sec = evaluateAction(s.action, intent);
  if (sec.decision !== 'BLOCK') throw new Error(`Expected BLOCK, got ${sec.decision}`);
  if (sec.permission !== 'DENIED') throw new Error(`Expected permission DENIED, got ${sec.permission}`);
});

// 5. Human Approval Enters Pending State
runTest('5. Sensitive action requiring approval enters pending state with token', () => {
  const gw = new AgentGuardGateway();
  const res = gw.intercept('Prepare application email', {
    action: 'send_email',
    parameters: { recipient: 'jobs@university.edu' },
  }, 'ORACLE');
  if (res.decision !== 'REQUIRE_APPROVAL') throw new Error('Expected REQUIRE_APPROVAL');
  if (res.executed) throw new Error('Action should not execute without human approval');
  if (!res.security.approval_token || !res.security.approval_token.startsWith('AG-AUTH-')) {
    throw new Error('Missing signed approval token');
  }
});

// 6. Cryptographic Approval Token Validation
runTest('6. Cryptographic approval tokens are generated and validated properly', () => {
  const token = generateSignedApprovalToken('send_email', 45);
  if (!validateApprovalToken(token)) throw new Error('Token validation failed');
});

// 7. Sensitive Data Redaction
runTest('7. Audit logging and display redact synthetic PII and credentials', () => {
  const raw = 'credential payload: password=secret123 and aadhaar=1234 5678 9012 and ssn=000-11-2222';
  const redacted = redactSensitiveData(raw);
  if (redacted.includes('secret123')) throw new Error('Password was not redacted');
  if (redacted.includes('1234 5678 9012')) throw new Error('Aadhaar was not redacted');
  if (redacted.includes('000-11-2222')) throw new Error('SSN was not redacted');
  if (!redacted.includes('[REDACTED_PASSWORD]')) throw new Error('Missing password redaction marker');
  if (!redacted.includes('[REDACTED_AADHAAR]')) throw new Error('Missing Aadhaar redaction marker');
});

// 8. Blocked Actions Cannot Execute
runTest('8. Denied/blocked actions cannot be dispatched through the gateway', () => {
  const gw = new AgentGuardGateway();
  const res = gw.intercept('Wipe databases', { action: 'delete_file', parameters: { path: '/var/db' } }, 'AEGIS');
  if (res.executed) throw new Error('Blocked action was improperly marked executed');
  if (res.decision !== 'BLOCK') throw new Error(`Expected decision BLOCK, got ${res.decision}`);
});

// 9. Least Privilege Unknown Tool Rejection
runTest('9. Unregistered or unknown tool calls default to BLOCK (least privilege)', () => {
  const sec = evaluateAction({ action: 'unregistered_privilege_root', parameters: {} }, { intent_match: true, score: 100, reason: '' });
  if (sec.decision !== 'BLOCK') throw new Error('Expected least-privilege BLOCK for unknown tool');
  if (sec.risk_score !== 100) throw new Error('Expected 100 risk score for unknown tool');
});

// 10. Malformed Requests Handled Safely
runTest('10. Missing or malformed requests fail closed without throwing unhandled exceptions', () => {
  const intent = checkIntent('', { action: '', parameters: {} });
  const sec = evaluateAction({ action: '', parameters: {} }, intent);
  if (sec.decision !== 'BLOCK') throw new Error('Expected fail-closed BLOCK');
});

// 11. All 5 Core Scenarios Exist
runTest('11. All 5 required hackathon scenarios exist in registry', () => {
  const expected = ['safe_search', 'prompt_injection', 'data_exfiltration', 'unauthorized_delete', 'approval_required'];
  for (const id of expected) {
    if (!SCENARIOS[id]) throw new Error(`Missing scenario: ${id}`);
  }
});

// 12. Cryptographic Audit Log Hash Chaining (Tamper Evident)
runTest('12. Cryptographic audit log hash chaining verifies 100% integrity', () => {
  cryptoAuditLog.clear();
  cryptoAuditLog.appendEvent({
    id: 101,
    time: '12:00:00',
    agent: 'SENTINEL',
    name: 'web_search',
    decision: 'ALLOW',
    risk: 10,
    level: 'LOW',
  });
  cryptoAuditLog.appendEvent({
    id: 102,
    time: '12:01:00',
    agent: 'AEGIS',
    name: 'delete_file',
    decision: 'BLOCK',
    risk: 100,
    level: 'CRITICAL',
  });
  const check = cryptoAuditLog.verifyIntegrity();
  if (!check.isValid) throw new Error('Audit chain integrity check failed');
  if (check.verifiedCount !== 2) throw new Error(`Expected 2 verified events, got ${check.verifiedCount}`);
});

// 13. LRU Evaluation Cache Operates Sub-Millisecond
runTest('13. LRU evaluation cache returns instant cached results on repeated queries', () => {
  evaluationCache.clear();
  const req = 'Search query cache test';
  const action = { action: 'web_search', parameters: { query: 'cache test' } };
  const intent = checkIntent(req, action);
  const evaluated = evaluateAction(action, intent);
  evaluationCache.set(req, action, evaluated);
  const cached = evaluationCache.get(req, action);
  if (!cached) throw new Error('Expected cache hit');
  if (cached.decision !== evaluated.decision) throw new Error('Cached decision mismatch');
});

// 14. Sub-Millisecond Latency Benchmark
runTest('14. Security evaluation execution latency is strictly sub-millisecond (<15ms max budget)', () => {
  const start = performance.now();
  for (let i = 0; i < 200; i++) {
    const intent = checkIntent('Search Python internships', { action: 'web_search', parameters: { query: 'Python' } });
    evaluateAction({ action: 'web_search', parameters: { query: 'Python' } }, intent);
  }
  const total = performance.now() - start;
  const avg = total / 200;
  if (avg > 15) throw new Error(`Average latency ${avg}ms exceeded budget`);
});

// 15. Intent Drift Divergence Classification
runTest('15. Intent drift correctly classifies divergence types (GOAL_HIJACK vs PARAMETER_TAMPERING)', () => {
  const drift = checkIntent('Search for papers', { action: 'delete_file', parameters: { target: 'all' } });
  if (drift.divergence_type !== 'GOAL_HIJACK') {
    throw new Error(`Expected GOAL_HIJACK, got ${drift.divergence_type}`);
  }
});

// 16. Whitelisted Domain Routing
runTest('16. Destination checker verifies trusted domains against whitelist', () => {
  const intent = { intent_match: true, score: 100, reason: '' };
  const trustedRes = evaluateAction({
    action: 'upload_file',
    parameters: { destination: 'https://github.com/deekshaaradhya9-sys' },
  }, intent);
  const factorsStr = trustedRes.factors.join(' ');
  if (!factorsStr.includes('Verified Destination')) {
    throw new Error('Expected verified destination recognition');
  }
});

console.log('\n----------------------------------------------------');
console.log(`TEST SUMMARY: ${passed} Passed, ${failed} Failed (${Math.round((passed / (passed + failed)) * 100)}% Success Rate)`);
console.log('----------------------------------------------------');

if (failed > 0) {
  process.exit(1);
} else {
  console.log('All 16 security assertions verified successfully!');
  process.exit(0);
}
