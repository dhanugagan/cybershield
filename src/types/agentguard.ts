/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type DecisionType = 'ALLOW' | 'REQUIRE_APPROVAL' | 'BLOCK';
export type RiskLevelType = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type PermissionType = 'AUTHORIZED' | 'HUMAN_APPROVAL' | 'DENIED';
export type TrustLevelType = 'TRUSTED' | 'CAUTION' | 'LOW TRUST' | 'UNTRUSTED';

export interface ToolDefinition {
  base_risk: number;
  description: string;
  category: 'read' | 'write' | 'execute' | 'financial' | 'external';
  requiresHumanApprovalDefault?: boolean;
}

export interface AgentAction {
  action: string;
  parameters: Record<string, any>;
}

export interface IntentResult {
  intent_match: boolean;
  score: number;
  reason: string;
  divergence_type?: 'NONE' | 'PARAMETER_TAMPERING' | 'GOAL_HIJACK' | 'UNAUTHORIZED_SUBTASK';
}

export interface SecurityResult {
  decision: DecisionType;
  risk_score: number;
  risk_level: RiskLevelType;
  risk_category?: RiskLevelType;
  permission: PermissionType;
  security?: {
    permission: PermissionType;
    destination_allowed?: boolean;
  };
  agent_trust: number;
  trust_level: TrustLevelType;
  factors: string[];
  policy_rules?: string[];
  reason: string;
  explanation?: string;
  sensitive_data_detected?: string[];
  untrusted_destinations?: string[];
  destination_allowed?: boolean;
  prompt_injection_flags?: string[];
  approval_token?: string;
  evaluated_at?: string;
}

export interface SecurityScenario {
  id: string;
  name: string;
  type: 'NORMAL' | 'PROMPT_INJECTION' | 'DATA_EXFILTRATION' | 'UNAUTHORIZED_ACTION' | 'HUMAN_APPROVAL' | 'PRIVILEGE_ESCALATION';
  description: string;
  user_request: string;
  action: AgentAction;
  expected_decision: DecisionType;
  owasp_category?: string;
}

export interface GatewayEvent {
  id: number;
  agent: string;
  name: string;
  decision: DecisionType | 'APPROVED' | 'DENIED';
  risk: number;
  level: RiskLevelType;
  time: string;
  user_request?: string;
  action_name?: string;
  reason?: string;
}

export interface AgentInfo {
  id: string;
  codename: string;
  name: string;
  type: string;
  icon: string;
  description: string;
  riskValue: number;
  color: 'green' | 'orange' | 'red' | 'purple' | 'cyan';
}

export interface TestResultItem {
  id: string;
  title: string;
  category: 'UNIT' | 'INTEGRATION' | 'RED_TEAM';
  description: string;
  status: 'PENDING' | 'RUNNING' | 'PASSED' | 'FAILED';
  durationMs: number;
  error?: string;
  details?: string;
}

export interface GeminiAuditResult {
  vulnerabilityAnalysis: string;
  owaspMapping: string;
  attackVectorExplanation: string;
  recommendation: string;
  mitigationRules: string[];
  safetyScore: number;
}

export interface GeminiPolicyResult {
  agentName: string;
  purpose: string;
  allowedTools: string[];
  approvalRequiredTools: string[];
  blockedTools: string[];
  restrictedPatterns: string[];
  maxDailyRiskBudget: number;
  policyNotes: string;
}
