"""
AgentGuard — Intent Verification Engine
Compares user intent against proposed tool invocation to detect goal divergence and prompt injection hijacking.
"""

from typing import Dict, Any


def check_intent(user_request: str, action: Dict[str, Any]) -> Dict[str, Any]:
    """
    Evaluates whether the proposed agent action corresponds to the stated user request.
    """
    request = (user_request or "").lower().strip()
    action_name = (action.get("action") or "").lower().strip()
    parameters = action.get("parameters") or {}
    params_str = str(parameters).lower()

    # 1. Benign Search match
    if any(k in request for k in ["search", "find", "lookup", "query"]) and action_name == "web_search":
        return {
            "intent_match": True,
            "score": 100,
            "reason": "The proposed action 'web_search' directly fulfills the user's research request.",
            "divergence_type": "NONE"
        }

    # 2. Email correspondence match
    if any(k in request for k in ["email", "message", "contact", "application", "send"]) and action_name == "send_email":
        return {
            "intent_match": True,
            "score": 95,
            "reason": "The proposed action 'send_email' corresponds with the user's communication intent.",
            "divergence_type": "NONE"
        }

    # 3. Destructive Deletion: unauthorized goal drift
    if action_name == "delete_file":
        if any(k in request for k in ["delete", "remove", "erase", "wipe"]):
            return {
                "intent_match": True,
                "score": 60,
                "reason": "User requested file deletion, but destructive operations carry high baseline risk.",
                "divergence_type": "NONE"
            }
        return {
            "intent_match": False,
            "score": 10,
            "reason": "CRITICAL INTENT DRIFT: The agent proposed permanent file deletion, but the user requested information search.",
            "divergence_type": "GOAL_HIJACK"
        }

    # 4. Exfiltration / Upload drift: user asked for summary, agent uploads to external destination
    if action_name == "upload_file":
        if any(k in request for k in ["summarize", "read", "check", "review", "find"]):
            return {
                "intent_match": False,
                "score": 15,
                "reason": "DATA EXFILTRATION DRIFT: User requested local summary, but agent diverted to external file upload.",
                "divergence_type": "GOAL_HIJACK"
            }

    # 5. Financial payment drift
    if action_name == "make_payment":
        if not any(k in request for k in ["pay", "buy", "purchase", "checkout"]):
            return {
                "intent_match": False,
                "score": 5,
                "reason": "PRIVILEGE ESCALATION: Agent attempted financial transfer without explicit user purchase authorization.",
                "divergence_type": "UNAUTHORIZED_SUBTASK"
            }

    # 6. General semantic correlation fallback
    tokens = [t for t in request.split() if len(t) > 3]
    if any(t in action_name or t in params_str for t in tokens):
        return {
            "intent_match": True,
            "score": 75,
            "reason": "The action correlates with keywords found in the user prompt.",
            "divergence_type": "NONE"
        }

    return {
        "intent_match": False,
        "score": 25,
        "reason": "The requested action does not clearly correlate with the declared user intention.",
        "divergence_type": "UNAUTHORIZED_SUBTASK"
    }
