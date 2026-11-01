"""
AgentGuard — FastAPI Backend API
Production-ready REST API for Render deployment and Vercel frontend integration.
"""

import os
from typing import Dict, Any, List, Optional
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from agent import AIAgent
from agentguard import evaluate_action
from intent_checker import check_intent
from scenarios import SCENARIOS, get_scenario
from tool_gateway import default_gateway

app = FastAPI(
    title="AgentGuard API",
    description="Autonomous AI Agent Security Gateway & Trust Layer",
    version="2.0.0"
)

# CORS setup for deployed Vercel frontend and local development
allowed_origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://*.vercel.app"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows Vercel preview URLs and custom domains
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

agent = AIAgent()


# Pydantic Schemas
class UserRequest(BaseModel):
    request: str = Field(..., description="Natural language prompt or query")


class ProposedActionPayload(BaseModel):
    request: str = Field(..., description="Stated user request")
    action: Dict[str, Any] = Field(..., description="Proposed tool call and parameters")
    agent_name: Optional[str] = Field("AI Agent", description="Agent codename")


class ApprovalDecisionPayload(BaseModel):
    token: str = Field(..., description="Cryptographic approval token")
    approved: bool = Field(..., description="True to approve action, False to reject")


# Endpoints

@app.get("/", tags=["Status"])
def root():
    """Root metadata endpoint."""
    return {
        "project": "AgentGuard",
        "tagline": "Trust Every Action. Verify Every Agent.",
        "status": "active",
        "version": "2.0.0",
        "docs_url": "/docs"
    }


@app.get("/health", tags=["Status"])
def health():
    """Deployment health check endpoint."""
    return {
        "status": "healthy",
        "service": "AgentGuard Security Layer",
        "timestamp": os.environ.get("RENDER_DEPLOY_TIME", "live")
    }


@app.post("/agent", tags=["Security Evaluation"])
def run_agent(payload: UserRequest):
    """
    Step 1: AIAgent translates user request into proposed tool action.
    Step 2: AgentGuard intercepts and evaluates risk and permissions.
    """
    if not payload.request.strip():
        raise HTTPException(status_code=400, detail="Request prompt cannot be empty.")

    action = agent.decide_action(payload.request)
    intent_result = check_intent(payload.request, action)
    security_result = evaluate_action(action, intent_result)

    # Record in gateway audit
    default_gateway.intercept(payload.request, action, "STUDENT_ASSISTANT")

    return {
        "user_request": payload.request,
        "agent_action": action,
        "intent_check": intent_result,
        "security": security_result
    }


@app.get("/attack/{scenario_id}", tags=["Scenarios"])
def run_attack(scenario_id: str):
    """
    Evaluates one of the 5 predefined attack/defense scenarios:
    safe_search, prompt_injection, data_exfiltration, unauthorized_delete, approval_required.
    """
    scenario = get_scenario(scenario_id)
    if not scenario:
        raise HTTPException(
            status_code=404,
            detail=f"Scenario '{scenario_id}' not found. Valid IDs: {list(SCENARIOS.keys())}"
        )

    user_request = scenario["user_request"]
    action = scenario["action"]

    intent_result = check_intent(user_request, action)
    security_result = evaluate_action(action, intent_result)

    # Intercept in gateway audit
    default_gateway.intercept(user_request, action, scenario.get("codename", "AGENT"))

    return {
        "scenario": {
            "id": scenario["id"],
            "name": scenario["name"],
            "codename": scenario.get("codename"),
            "type": scenario["type"],
            "description": scenario["description"],
            "owasp_category": scenario.get("owasp_category")
        },
        "user_request": user_request,
        "agent_action": action,
        "intent_check": intent_result,
        "security": security_result
    }


@app.post("/gateway", tags=["Gateway"])
def intercept_tool(payload: ProposedActionPayload):
    """
    Live tool call interceptor. Evaluates arbitrary proposed actions against AgentGuard policies.
    """
    result = default_gateway.intercept(payload.request, payload.action, payload.agent_name)
    return {
        "user_request": payload.request,
        "proposed_action": payload.action,
        "gateway_result": result
    }


@app.get("/sweep", tags=["Scenarios"])
def run_security_sweep():
    """
    Executes all 5 security scenarios in a single batch sweep and aggregates statistics.
    """
    results = []
    for s_id, s_data in SCENARIOS.items():
        intent_res = check_intent(s_data["user_request"], s_data["action"])
        sec_res = evaluate_action(s_data["action"], intent_res)
        results.append({
            "scenario": s_data,
            "user_request": s_data["user_request"],
            "agent_action": s_data["action"],
            "intent_check": intent_res,
            "security": sec_res
        })

    blocked = sum(1 for r in results if r["security"]["decision"] == "BLOCK")
    approvals = sum(1 for r in results if r["security"]["decision"] == "REQUIRE_APPROVAL")
    allowed = sum(1 for r in results if r["security"]["decision"] == "ALLOW")

    return {
        "sweep": True,
        "total_scenarios": len(results),
        "summary": {
            "blocked": blocked,
            "approvals": approvals,
            "allowed": allowed
        },
        "results": results
    }


@app.get("/approvals/pending", tags=["Human Approval"])
def get_pending_approvals():
    """Lists all actions paused for human-in-the-loop authorization."""
    return {"pending_approvals": default_gateway.get_pending_queue()}


@app.post("/approval/decide", tags=["Human Approval"])
def decide_approval(payload: ApprovalDecisionPayload):
    """
    Approves or rejects a paused action using its cryptographic token.
    """
    res = default_gateway.process_approval(payload.token, payload.approved)
    if not res.get("success"):
        raise HTTPException(status_code=400, detail=res.get("error"))
    return res


@app.get("/audit-log", tags=["Auditing"])
def get_audit_log():
    """Returns the immutable redacted security audit trail."""
    return {"events": default_gateway.get_audit_trail()}


if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
