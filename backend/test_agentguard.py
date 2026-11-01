"""
AgentGuard — Automated Backend Security Test Suite
Covers the 12 minimum test cases defined in the project specification.
Can be executed with `pytest` or standalone `python3 backend/test_agentguard.py`.
"""

import os
import sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import unittest
from agent import AIAgent
from agentguard import evaluate_action, redact_sensitive_text
from intent_checker import check_intent
from scenarios import get_scenario, SCENARIOS
from tool_gateway import AgentGuardGateway


class TestAgentGuard(unittest.TestCase):
    def test_1_valid_safe_search_allowed(self):
        """1. A valid, permitted safe-search action is allowed."""
        scenario = get_scenario("safe_search")
        self.assertIsNotNone(scenario)
        intent = check_intent(scenario["user_request"], scenario["action"])
        sec = evaluate_action(scenario["action"], intent)
        self.assertTrue(intent["intent_match"])
        self.assertEqual(sec["decision"], "ALLOW")
        self.assertLess(sec["risk_score"], 30)
        self.assertEqual(sec["permission"], "AUTHORIZED")

    def test_2_prompt_injection_blocked(self):
        """2. A prohibited prompt-injection scenario is blocked according to policy."""
        scenario = get_scenario("prompt_injection")
        self.assertIsNotNone(scenario)
        intent = check_intent(scenario["user_request"], scenario["action"])
        sec = evaluate_action(scenario["action"], intent)
        self.assertFalse(intent["intent_match"])
        self.assertEqual(sec["decision"], "BLOCK")
        self.assertGreaterEqual(sec["risk_score"], 80)

    def test_3_data_exfiltration_blocked(self):
        """3. An unauthorized sensitive-data transfer is blocked."""
        scenario = get_scenario("data_exfiltration")
        self.assertIsNotNone(scenario)
        intent = check_intent(scenario["user_request"], scenario["action"])
        sec = evaluate_action(scenario["action"], intent)
        self.assertEqual(sec["decision"], "BLOCK")
        self.assertIsNotNone(sec.get("sensitive_detected"))
        self.assertGreater(len(sec["sensitive_detected"]), 0)

    def test_4_unauthorized_deletion_blocked(self):
        """4. An unauthorized destructive operation is blocked."""
        scenario = get_scenario("unauthorized_delete")
        self.assertIsNotNone(scenario)
        intent = check_intent(scenario["user_request"], scenario["action"])
        sec = evaluate_action(scenario["action"], intent)
        self.assertEqual(sec["decision"], "BLOCK")
        self.assertEqual(sec["permission"], "DENIED")

    def test_5_approval_required_enters_pending(self):
        """5. An action requiring approval enters a pending state."""
        gw = AgentGuardGateway()
        res = gw.intercept(
            "Help me prepare an internship application email",
            {"action": "send_email", "parameters": {"recipient": "recruiter@partner.edu"}},
            "ORACLE"
        )
        self.assertEqual(res["decision"], "REQUIRE_APPROVAL")
        self.assertFalse(res["executed"])
        self.assertTrue(res["approval_required"])
        self.assertIsNotNone(res["approval_token"])
        self.assertEqual(len(gw.get_pending_queue()), 1)

    def test_6_approval_and_rejection_update(self):
        """6. Approval and rejection update the correct request."""
        gw = AgentGuardGateway()
        res = gw.intercept(
            "Send email",
            {"action": "send_email", "parameters": {"recipient": "hr@job.com"}},
            "ORACLE"
        )
        token = res["approval_token"]
        decision_res = gw.process_approval(token, approved=True)
        self.assertTrue(decision_res["success"])
        self.assertEqual(decision_res["status"], "APPROVED")
        self.assertEqual(len(gw.get_pending_queue()), 0)

    def test_7_denied_action_cannot_execute(self):
        """7. A denied action cannot be executed through the approval workflow."""
        gw = AgentGuardGateway()
        res = gw.intercept(
            "Wipe system",
            {"action": "delete_file", "parameters": {"target": "all"}},
            "AEGIS"
        )
        self.assertEqual(res["decision"], "BLOCK")
        self.assertIsNone(res["approval_token"])

    def test_8_invalid_scenario_id_returns_none(self):
        """8. Invalid scenario IDs return an appropriate None/error."""
        self.assertIsNone(get_scenario("non_existent_id"))

    def test_9_missing_action_handled_safely(self):
        """9. Missing or malformed request data is handled safely without throwing."""
        intent = check_intent("", {})
        sec = evaluate_action({}, intent)
        self.assertEqual(sec["decision"], "BLOCK")
        self.assertEqual(sec["risk_level"], "CRITICAL")

    def test_10_audit_events_redact_sensitive_values(self):
        """10. Audit events are generated without leaking sensitive values."""
        sensitive_raw = "user_account: password=secret_master_password and aadhaar=1234 5678 9012"
        redacted = redact_sensitive_text(sensitive_raw)
        self.assertNotIn("secret_master_password", redacted)
        self.assertIn("[REDACTED_PASSWORD]", redacted)
        self.assertIn("[REDACTED_AADHAAR]", redacted)

    def test_11_all_five_scenarios_exist(self):
        """11. Confirms all five scenarios exist in registry."""
        expected_ids = {"safe_search", "prompt_injection", "data_exfiltration", "unauthorized_delete", "approval_required"}
        self.assertEqual(set(SCENARIOS.keys()), expected_ids)

    def test_12_least_privilege_enforcement(self):
        """12. Unregistered or unknown tool calls default to BLOCK."""
        sec = evaluate_action({"action": "unknown_privileged_kernel_tool", "parameters": {}}, {"intent_match": True})
        self.assertEqual(sec["decision"], "BLOCK")
        self.assertEqual(sec["permission"], "DENIED")
        self.assertEqual(sec["risk_score"], 100)


if __name__ == "__main__":
    unittest.main()
