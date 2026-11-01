"""
AgentGuard — Multi-Layer Security Policy & Risk Evaluation Engine
Enforces Permission Firewalls, Detects Sensitive Data, Scores Risk, Redacts PII, and Manages Adaptive Trust.
"""

import re
import uuid
from typing import Dict, Any, List, Tuple

# Central tool definition registry
TOOLS = {
    "web_search": {
        "base_risk": 10,
        "category": "READ",
        "description": "Public search engine query"
    },
    "read_file": {
        "base_risk": 25,
        "category": "READ",
        "description": "Read local workspace file"
    },
    "send_email": {
        "base_risk": 45,
        "category": "EXTERNAL",
        "description": "Outbound email correspondence",
        "approval_required": True
    },
    "upload_file": {
        "base_risk": 65,
        "category": "EXTERNAL",
        "description": "Transmit data to external host"
    },
    "delete_file": {
        "base_risk": 85,
        "category": "WRITE",
        "description": "Destructive deletion of files or data"
    },
    "make_payment": {
        "base_risk": 95,
        "category": "FINANCIAL",
        "description": "Financial transaction gateway call"
    },
    "execute_terminal": {
        "base_risk": 95,
        "category": "EXECUTE",
        "description": "Command line shell execution"
    }
}

AUTO_ALLOWED = ["web_search", "read_file"]
APPROVAL_REQUIRED = ["send_email"]
BLOCKED_TOOLS = ["delete_file", "make_payment", "execute_terminal"]

TRUSTED_DOMAINS = [
    "google.com",
    "googleapis.com",
    "github.com",
    "microsoft.com",
    "openai.com",
    "wikipedia.org"
]

# Regex patterns for synthetic PII and secrets
SENSITIVE_PATTERNS = [
    ("Password / Secret", re.compile(r"password|passwd|api[-_]?key|secret[-_]?key|bearer|auth[-_]?token", re.IGNORECASE), 25),
    ("Credit Card / PIN", re.compile(r"\b(?:\d[ -]*?){13,16}\b|cvv|cvc|banking[-_]?pin", re.IGNORECASE), 30),
    ("National ID / SSN / Aadhaar", re.compile(r"\b\d{3}-\d{2}-\d{4}\b|\b\d{4}\s?\d{4}\s?\d{4}\b|aadhaar|ssn", re.IGNORECASE), 25),
    ("Confidential Record / PII", re.compile(r"private[-_]?resume|tax[-_]?return|payroll|confidential[-_]?doc", re.IGNORECASE), 20),
]

PROMPT_INJECTION_PATTERNS = [
    ("Instruction Override", re.compile(r"ignore (all )?previous instructions|disregard (prior|all) rules", re.IGNORECASE), 35),
    ("Roleplay Jailbreak", re.compile(r"jailbreak|DAN mode|developer override|you are now unfiltered", re.IGNORECASE), 40),
]


def redact_sensitive_text(text: str) -> str:
    """
    Redacts sensitive credentials, tokens, and PII from strings for audit trail hygiene.
    """
    redacted = text
    redacted = re.sub(r'(api[-_]?key\s*[:=]\s*)[\w\-]{8,}', r'\1[REDACTED_API_KEY]', redacted, flags=re.IGNORECASE)
    redacted = re.sub(r'(password\s*[:=]\s*)[\w\-!@#$%^&*]{4,}', r'\1[REDACTED_PASSWORD]', redacted, flags=re.IGNORECASE)
    redacted = re.sub(r'\b\d{3}-\d{2}-\d{4}\b', '[REDACTED_SSN]', redacted)
    redacted = re.sub(r'\b\d{4}\s?\d{4}\s?\d{4}\b', '[REDACTED_AADHAAR]', redacted)
    redacted = re.sub(r'\b(?:\d[ -]*?){13,16}\b', '[REDACTED_PAYMENT_CARD]', redacted)
    return redacted


def evaluate_action(action: Dict[str, Any], intent_result: Dict[str, Any]) -> Dict[str, Any]:
    """
    Performs full multi-layered security evaluation and risk scoring.
    """
    action_name = (action.get("action") or "unknown").lower().strip()
    parameters = action.get("parameters") or {}
    params_str = str(parameters).lower()

    factors: List[str] = []
    sensitive_detected: List[str] = []
    injection_flags: List[str] = []

    # 1. TOOL AUTHORIZATION CHECK
    if action_name not in TOOLS:
        return {
            "decision": "BLOCK",
            "risk_score": 100,
            "risk_level": "CRITICAL",
            "permission": "DENIED",
            "agent_trust": 0,
            "trust_level": "UNTRUSTED",
            "factors": [f"Unauthorized or unregistered tool: {action_name}"],
            "reason": f"Tool '{action_name}' is not authorized in AgentGuard registry.",
            "approval_required": False
        }

    tool_def = TOOLS[action_name]
    risk = tool_def["base_risk"]
    factors.append(f"Tool Base Risk: {risk} ({tool_def['category']})")

    # 2. PERMISSION FIREWALL
    if action_name in AUTO_ALLOWED:
        permission = "AUTHORIZED"
        factors.append("Permission Firewall: Tool is authorized for autonomous execution.")
    elif action_name in APPROVAL_REQUIRED:
        permission = "HUMAN_APPROVAL"
        factors.append("Permission Firewall: Outbound action requires human authorization gate.")
    elif action_name in BLOCKED_TOOLS:
        permission = "DENIED"
        risk += 15
        factors.append("Permission Firewall: Destructive/high-impact action denied for autonomous run.")
    else:
        permission = "DENIED"
        risk += 20
        factors.append("Permission Firewall: No approved execution policy defined.")

    # 3. INTENT DRIFT CHECK
    if not intent_result.get("intent_match", False):
        risk += 25
        factors.append(f"Intent Drift: Action diverges from user request (+25 risk) [{intent_result.get('divergence_type', 'DRIFT')}]")

    # 4. SENSITIVE DATA SCAN
    for name, pattern, add in SENSITIVE_PATTERNS:
        if pattern.search(params_str):
            risk += add
            sensitive_detected.append(name)
            factors.append(f"Sensitive Data Warning: Detected {name} in parameters (+{add} risk).")

    # 5. DESTINATION & SSRF CHECK
    destination = str(parameters.get("destination") or parameters.get("url") or parameters.get("recipient") or "").lower()
    if destination:
        if "@" in destination:
            if any(s in destination for s in ["malicious", "unknown", "temp-mail", "drop"]):
                risk += 25
                factors.append(f"Suspicious Recipient: Target email '{destination}' flagged as unverified.")
        else:
            is_trusted = any(td in destination for td in TRUSTED_DOMAINS)
            if not is_trusted:
                risk += 20
                factors.append(f"Untrusted Destination: Target '{destination}' is outside verified domain registry (+20 risk).")
            else:
                factors.append(f"Verified Destination: Target '{destination}' is within trusted domain whitelist.")

    # 6. PROMPT INJECTION / JAILBREAK MARKERS
    for name, pattern, add in PROMPT_INJECTION_PATTERNS:
        if pattern.search(params_str):
            risk += add
            injection_flags.append(name)
            factors.append(f"Prompt Injection Indicator: {name} detected (+{add} risk).")

    # Normalize risk to 0..100
    risk = max(0, min(100, risk))

    # 7. FINAL SECURITY DECISION
    if permission == "DENIED":
        decision = "BLOCK"
        level = "CRITICAL"
        reason = "Action blocked by AgentGuard Permission Firewall: Autonomous execution prohibited."
        approval_req = False
    elif permission == "HUMAN_APPROVAL":
        decision = "REQUIRE_APPROVAL"
        level = "CRITICAL" if risk >= 80 else "HIGH" if risk >= 50 else "MEDIUM"
        reason = "Action paused: Explicit human authorization required before executing external operation."
        approval_req = True
    elif risk < 30:
        decision = "ALLOW"
        level = "LOW"
        reason = "Action verified safe: Low risk, verified intent, and approved permissions."
        approval_req = False
    elif risk < 60:
        decision = "REQUIRE_APPROVAL"
        level = "MEDIUM"
        reason = "Moderate risk detected: User approval required before execution."
        approval_req = True
    elif risk < 80:
        decision = "REQUIRE_APPROVAL"
        level = "HIGH"
        reason = "Elevated threat index: High-risk operation paused for administrative consent."
        approval_req = True
    else:
        decision = "BLOCK"
        level = "CRITICAL"
        reason = "Action blocked: Severe risk index exceeds autonomous execution safety threshold."
        approval_req = False

    # 8. ADAPTIVE AGENT TRUST
    agent_trust = max(0, 100 - risk)
    if agent_trust >= 80:
        trust_level = "TRUSTED"
    elif agent_trust >= 50:
        trust_level = "CAUTION"
    elif agent_trust >= 25:
        trust_level = "LOW TRUST"
    else:
        trust_level = "UNTRUSTED"

    # 9. Signed approval token for approval gate
    approval_token = f"AG-AUTH-{uuid.uuid4().hex[:8].upper()}" if approval_req else None

    return {
        "decision": decision,
        "risk_score": risk,
        "risk_level": level,
        "permission": permission,
        "agent_trust": agent_trust,
        "trust_level": trust_level,
        "factors": factors,
        "reason": reason,
        "approval_required": approval_req,
        "approval_token": approval_token,
        "sensitive_detected": sensitive_detected if sensitive_detected else None,
        "redacted_parameters": redact_sensitive_text(params_str)
    }
