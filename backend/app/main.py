from datetime import datetime, timezone
from hashlib import sha256
from typing import Any
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from .agents.orchestrator import run_agent
from .rules.policy import allocation_allowed, priority_score, route_recommendation

app = FastAPI(title='ResQChain API', version='0.1.0', description='Offline-first disaster relief coordination API')
app.add_middleware(CORSMiddleware, allow_origins=['*'], allow_credentials=False, allow_methods=['GET', 'POST', 'PATCH'], allow_headers=['*'])

class AgentRequest(BaseModel):
    description: str = Field(min_length=1, max_length=8000)
    location: str = 'District A'
    context: dict[str, Any] = {}

class AllocationRequest(BaseModel):
    urgency: str = 'High'
    vulnerability: str = 'High'
    inventory_available: int = Field(ge=0)
    requested_quantity: int = Field(gt=0)
    route_blocked: bool = False
    budget_available: float = Field(ge=0)
    estimated_cost: float = Field(ge=0)

class SyncEvent(BaseModel):
    eventid: str
    eventtype: str
    campaignid: str
    deviceid: str
    userid: str
    createdat: str
    payload: dict[str, Any] = {}
    idempotencykey: str
    digitalsignature: str
    syncstatus: str = 'pending'

@app.get('/health')
def health():
    return {'status': 'ok', 'service': 'resqchain-api', 'timestamp': datetime.now(timezone.utc).isoformat()}

@app.post('/auth/login')
def login():
    return {'access_token': 'demo-jwt-token', 'token_type': 'bearer', 'user': {'id': 'usr-coord-01', 'name': 'Amina Mensah', 'role': 'Coordinator'}}

@app.get('/auth/me')
def me():
    return {'id': 'usr-coord-01', 'name': 'Amina Mensah', 'role': 'Coordinator'}

@app.post('/agents/{agent_name}')
def agent(agent_name: str, request: AgentRequest):
    return run_agent(agent_name, request.model_dump())

@app.post('/allocations/calculate')
def calculate_allocation(request: AllocationRequest):
    score = priority_score(request.urgency, request.vulnerability)
    allowed, constraints = allocation_allowed(request.model_dump())
    return {'priorityscore': score, 'allowed': allowed, 'constraintschecked': constraints, 'requireshumanapproval': True, 'confidence': 0.91, 'fallback': True}

@app.post('/agents/route')
def route(request: AgentRequest):
    blocked = bool(request.context.get('route_blocked', False))
    return route_recommendation(blocked)

@app.post('/sync/events')
def sync_events(events: list[SyncEvent]):
    accepted, conflicts = [], []
    seen: set[str] = set()
    for event in sorted(events, key=lambda item: item.createdat):
        if event.idempotencykey in seen:
            conflicts.append({'eventid': event.eventid, 'reason': 'duplicate idempotency key'})
        else:
            seen.add(event.idempotencykey)
            accepted.append(event.eventid)
    return {'accepted': accepted, 'conflicts': conflicts, 'audit_run': 'queued', 'message': 'Chronological reconciliation complete.'}

@app.get('/audit/verify/{campaignid}')
def verify_audit(campaignid: str):
    return {'campaignid': campaignid, 'auditstatus': 'verified', 'verifiedevents': 18, 'issues': ['1 unsynchronized event remains marked warning'], 'hash': sha256(campaignid.encode()).hexdigest()[:24]}

@app.get('/public/campaigns/{campaignid}/summary')
def donor_summary(campaignid: str):
    return {'campaignid': campaignid, 'name': 'Cyclone Relief — District A', 'resourcecategoriestracked': 4, 'inventory': {'foodkits': 500, 'medicineunits': 200, 'ambulances': 5, 'hospitalbeds': 18}, 'resourcesallocated': 501, 'resourcesdelivered': 281, 'deliverypercentage': 38, 'verifiedevents': 18, 'unverifiedevents': 1}

@app.exception_handler(Exception)
async def safe_error(_, exc: Exception):
    if isinstance(exc, HTTPException):
        return exc
    raise HTTPException(status_code=500, detail='Safe service error. The operation was not executed.') from exc
