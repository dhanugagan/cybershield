"""
AgentGuard — Tool Interception Gateway & Approval Queue
Intercepts tool calls, queues human approvals, validates approval tokens, and maintains structured audit logs.
"""

import time
import uuid
from typing import Dict, Any, List, Optional
from intent_checker import check_intent
from agentguard import evaluate_action, redact_sensitive_text


class AgentGuardGateway:
    def __init__(self):
        self.execution_log: List[Dict[str, Any]] = []
        self.pending_approvals: Dict[str, Dict[str, Any]] = {}

    def intercept(self, user_request: str, proposed_action: Dict[str, Any], agent_name: str = "AI Agent") -> Dict[str, Any]:
        """
        Intercepts an agent tool call, evaluates security, and queues for approval if necessary.
        """
        intent_res = check_intent(user_request, proposed_action)
        sec_res = evaluate_action(proposed_action, intent_res)

        decision = sec_res["decision"]
        event_id = str(uuid.uuid4())[:8]
        timestamp = time.strftime("%Y-%m-%d %H:%M:%S")

        # Create structured audit entry with redacted parameters
        audit_entry = {
            "event_id": event_id,
            "timestamp": timestamp,
            "agent": agent_name,
            "user_request": user_request,
            "action": proposed_action.get("action", "unknown"),
            "parameters": redact_sensitive_text(str(proposed_action.get("parameters", {}))),
            "decision": decision,
            "risk_score": sec_res["risk_score"],
            "risk_level": sec_res["risk_level"],
            "triggered_rules": sec_res.get("factors", []),
            "reason": sec_res["reason"],
            "approval_token": sec_res.get("approval_token"),
            "status": "PENDING_APPROVAL" if decision == "REQUIRE_APPROVAL" else "EXECUTED" if decision == "ALLOW" else "BLOCKED"
        }

        self.execution_log.insert(0, audit_entry)
        if len(self.execution_log) > 100:
            self.execution_log.pop()

        # If requires human approval, store in pending queue
        if decision == "REQUIRE_APPROVAL" and sec_res.get("approval_token"):
            token = sec_res["approval_token"]
            self.pending_approvals[token] = {
                "token": token,
                "event_id": event_id,
                "created_at": timestamp,
                "user_request": user_request,
                "action": proposed_action,
                "security": sec_res,
                "agent": agent_name
            }

        return {
            "event_id": event_id,
            "decision": decision,
            "risk_score": sec_res["risk_score"],
            "risk_level": sec_res["risk_level"],
            "executed": decision == "ALLOW",
            "approval_required": decision == "REQUIRE_APPROVAL",
            "approval_token": sec_res.get("approval_token"),
            "message": (
                "AgentGuard authorized the tool call for autonomous execution." if decision == "ALLOW"
                else "AgentGuard paused execution: Human authorization gate active." if decision == "REQUIRE_APPROVAL"
                else "AgentGuard blocked the unsafe tool call to protect user assets."
            ),
            "security": sec_res,
            "intent": intent_res
        }

    def process_approval(self, token: str, approved: bool) -> Dict[str, Any]:
        """
        Validates an approval token and either releases the action or keeps it blocked.
        """
        if token not in self.pending_approvals:
            return {
                "success": False,
                "error": f"Invalid or expired approval token '{token}'."
            }

        pending = self.pending_approvals.pop(token)
        new_status = "APPROVED" if approved else "DENIED"

        # Update audit entry
        for entry in self.execution_log:
            if entry.get("approval_token") == token:
                entry["status"] = new_status
                entry["decision"] = new_status
                entry["reason"] += f" [Human decision: {new_status} at {time.strftime('%H:%M:%S')}]"
                break

        return {
            "success": True,
            "status": new_status,
            "token": token,
            "action": pending["action"],
            "message": f"Action was successfully {new_status.lower()} by authorized human operator."
        }

    def get_pending_queue(self) -> List[Dict[str, Any]]:
        """Returns all actions awaiting human review."""
        return list(self.pending_approvals.values())

    def get_audit_trail(self) -> List[Dict[str, Any]]:
        """Returns structured audit log."""
        return list(self.execution_log)


default_gateway = AgentGuardGateway()
