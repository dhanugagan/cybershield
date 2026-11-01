/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { ToolDefinition } from '../types/agentguard.ts';

export const TOOLS: Record<string, ToolDefinition> = {
  web_search: {
    base_risk: 10,
    description: 'Query public search engine for information retrieval',
    category: 'read',
  },
  read_file: {
    base_risk: 25,
    description: 'Read contents from local workspace or shared document',
    category: 'read',
  },
  read_url: {
    base_risk: 30,
    description: 'Fetch and parse content from external HTTP/HTTPS web resource',
    category: 'read',
  },
  send_email: {
    base_risk: 45,
    description: 'Transmit outbound email to external recipient',
    category: 'external',
    requiresHumanApprovalDefault: true,
  },
  upload_file: {
    base_risk: 65,
    description: 'Upload files or documents to external server or API',
    category: 'external',
  },
  delete_file: {
    base_risk: 85,
    description: 'Permanently remove files or database records',
    category: 'write',
  },
  make_payment: {
    base_risk: 95,
    description: 'Trigger financial transactions or payment gateway API',
    category: 'financial',
  },
  execute_terminal: {
    base_risk: 95,
    description: 'Execute arbitrary bash shell command on host machine',
    category: 'execute',
  },
  modify_security_rules: {
    base_risk: 100,
    description: 'Attempt to overwrite or loosen AgentGuard policy rules',
    category: 'execute',
  },
  modify_settings: {
    base_risk: 45,
    description: 'Update application or agent runtime configuration settings',
    category: 'write',
  },
};

export const AUTO_ALLOWED_TOOLS = ['web_search', 'read_file'];
export const APPROVAL_REQUIRED_TOOLS = ['send_email', 'modify_settings'];
export const BLOCKED_TOOLS = ['delete_file', 'make_payment', 'execute_terminal', 'modify_security_rules'];

export const SENSITIVE_PATTERNS: { name: string; pattern: RegExp; riskAdd: number }[] = [
  { name: 'Password / Secret', pattern: /password|passwd|api[-_]?key|secret[-_]?key|auth[-_]?token|bearer/i, riskAdd: 25 },
  { name: 'Payment / Card', pattern: /\b(?:\d[ -]*?){13,16}\b|cvv|credit[-_]?card|cvc|banking[-_]?pin/i, riskAdd: 30 },
  { name: 'National ID / SSN / Aadhaar', pattern: /\b\d{3}-\d{2}-\d{4}\b|\b\d{4}\s?\d{4}\s?\d{4}\b|aadhaar|ssn|social security/i, riskAdd: 25 },
  { name: 'Personal Resume / PII', pattern: /private[-_]?resume|confidential[-_]?doc|payroll|tax[-_]?return|medical[-_]?record/i, riskAdd: 20 },
];

export const TRUSTED_DOMAINS = [
  'google.com',
  'googleapis.com',
  'github.com',
  'microsoft.com',
  'openai.com',
  'developer.mozilla.org',
  'wikipedia.org',
];

export const PROMPT_INJECTION_TRIGGERS: { name: string; pattern: RegExp; riskAdd: number }[] = [
  { name: 'Ignore Instructions Directive', pattern: /ignore (all )?previous instructions|disregard (prior|all) rules/i, riskAdd: 35 },
  { name: 'System Roleplay / DAN', pattern: /jailbreak|DAN mode|you are now unfiltered|developer override/i, riskAdd: 40 },
  { name: 'Hidden Command Marker', pattern: /\[SYSTEM OVERRIDE\]|<!--\s*inject|BEGIN INJECTION/i, riskAdd: 35 },
];
