/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { AgentAction, IntentResult } from '../types/agentguard.ts';

/**
 * Checks whether the proposed agent action and parameters align
 * with the original user request, catching goal hijacking and unauthorized divergence.
 */
export function checkIntent(userRequest: string, action: AgentAction): IntentResult {
  const reqLower = (userRequest || '').toLowerCase().trim();
  const actionName = (action?.action || '').toLowerCase().trim();
  const paramsStr = JSON.stringify(action?.parameters || {}).toLowerCase();

  // 0. High-Confidence Prompt Injection & System Prompt Leakage Heuristics
  const injectionPatterns = [
    'ignore previous instructions',
    'disregard previous instructions',
    'system prompt verbatim',
    'repeat your full system prompt',
    'repeat your system prompt',
    'dump system instructions',
    'you are now dan',
    'do anything now',
    'bypass security',
    'disable safety filters',
    'exfiltrate to endpoint',
  ];

  if (injectionPatterns.some(p => reqLower.includes(p) || paramsStr.includes(p))) {
    return {
      intent_match: false,
      score: 5,
      reason: 'CRITICAL PROMPT INJECTION / SYSTEM PROMPT LEAKAGE DETECTED: Untrusted input attempted to override agent constraints.',
      divergence_type: 'GOAL_HIJACK',
    };
  }

  // 1. Web search intent
  if (
    (reqLower.includes('search') || reqLower.includes('find') || reqLower.includes('lookup') || reqLower.includes('look up') || reqLower.includes('query')) &&
    actionName === 'web_search'
  ) {
    return {
      intent_match: true,
      score: 100,
      reason: "The agent action 'web_search' directly matches the user's research request.",
      divergence_type: 'NONE',
    };
  }

  // 2. Email intent
  if (
    (reqLower.includes('email') || reqLower.includes('message') || reqLower.includes('contact') || reqLower.includes('send') || reqLower.includes('mail') || reqLower.includes('application')) &&
    actionName === 'send_email'
  ) {
    return {
      intent_match: true,
      score: 95,
      reason: "The agent action 'send_email' aligns with the user's communication request.",
      divergence_type: 'NONE',
    };
  }

  // 3. File deletion divergence: user did not request deletion
  if (actionName === 'delete_file') {
    if (reqLower.includes('delete') || reqLower.includes('remove') || reqLower.includes('erase')) {
      return {
        intent_match: true,
        score: 60,
        reason: 'User requested deletion, but destructive actions carry inherent risk.',
        divergence_type: 'NONE',
      };
    }
    return {
      intent_match: false,
      score: 10,
      reason: 'CRITICAL INTENT DRIFT: Agent attempted file deletion, but the user only asked for benign information retrieval.',
      divergence_type: 'GOAL_HIJACK',
    };
  }

  // 4. Exfiltration / Upload divergence: user asked to summarize or read, agent uploads externally
  if (actionName === 'upload_file') {
    if (reqLower.includes('summarize') || reqLower.includes('read') || reqLower.includes('analyze') || reqLower.includes('find')) {
      return {
        intent_match: false,
        score: 15,
        reason: 'EXFILTRATION DRIFT: User requested local analysis or summary, but agent diverted to external file upload.',
        divergence_type: 'GOAL_HIJACK',
      };
    }
  }

  // 5. Payment divergence
  if (actionName === 'make_payment') {
    if (!reqLower.includes('pay') && !reqLower.includes('buy') && !reqLower.includes('purchase')) {
      return {
        intent_match: false,
        score: 5,
        reason: 'FINANCIAL DIVERGENCE: Agent initiated financial transfer with zero explicit user purchase authorization.',
        divergence_type: 'UNAUTHORIZED_SUBTASK',
      };
    }
  }

  // 6. Generic match check
  const tokens = reqLower.split(/\s+/).filter(t => t.length > 3);
  const matchesToken = tokens.some(token => actionName.includes(token) || paramsStr.includes(token));

  if (matchesToken) {
    return {
      intent_match: true,
      score: 75,
      reason: "Agent action matches semantic context from the user's prompt.",
      divergence_type: 'NONE',
    };
  }

  return {
    intent_match: false,
    score: 25,
    reason: 'The proposed tool action has no identifiable correlation with the stated user goal.',
    divergence_type: 'UNAUTHORIZED_SUBTASK',
  };
}
