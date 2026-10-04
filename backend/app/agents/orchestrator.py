from typing import Any
from pydantic import BaseModel, Field
from ..rules.policy import duplicate_status, priority_score, route_recommendation

FALLBACK_MESSAGE = 'Agent unavailable. The system is using deterministic fallback rules. Human review is required.'

class AgentResult(BaseModel):
    agent: str
    status: str
    summary: str
    confidence: float = Field(ge=0, le=1)
    uncertainty: str
    evidence: list[dict[str, str]]
    requireshumanreview: bool = False
    fallback: bool = True
    output: dict[str, Any] = {}

def run_agent(agent_name: str, request: dict[str, Any]) -> dict[str, Any]:
    name = agent_name.lower()
    if 'triage' in name:
        return AgentResult(agent='Incident Triage Agent', status='completed', summary='Critical access disruption at Camp Beta; medicine and clean water are the immediate operational priorities.', confidence=.94, uncertainty='Road status is based on one unverified field report.', evidence=[{'id': 'REPORT-104', 'detail': 'Flooding reported near Coastal Link'}, {'id': 'HOSP-02', 'detail': 'Community Care at 82% capacity'}], output={'urgency': 'critical', 'reportedneeds': ['medicine', 'water'], 'blockedroutes': ['Coastal Link']}).model_dump()
    if 'allocation' in name:
        urgency = request.get('context', {}).get('urgency', 'High')
        vulnerability = request.get('context', {}).get('vulnerability', 'High')
        return AgentResult(agent='Resource Allocation Agent', status='waiting_for_approval', summary='Recommend a constrained food-kit allocation after inventory, budget, and route checks.', confidence=.91, uncertainty='Household count has not been verified in the last two hours.', evidence=[{'id': 'INV-FOOD', 'detail': '380 kits remain after approved commitment'}, {'id': 'CAMP-BETA', 'detail': f'Priority score {priority_score(urgency, vulnerability)}'}], requireshumanreview=True, output={'recommendedallocations': [{'destinationid': 'CAMP-ALPHA', 'resourcetype': 'food kits', 'quantity': 90}]}).model_dump()
    if 'route' in name:
        return AgentResult(agent='Route and Logistics Agent', status='completed', summary='Constrained shortest-path recommendation returned.', confidence=.88 if request.get('context', {}).get('route_blocked') else .96, uncertainty='Bridge checkpoint requires field verification.' if request.get('context', {}).get('route_blocked') else 'No active route uncertainty.', evidence=[{'id': 'ROAD-07', 'detail': 'Road graph constraint loaded'}], output=route_recommendation(bool(request.get('context', {}).get('route_blocked')))).model_dump()
    if 'duplicate' in name:
        result = duplicate_status(same_beneficiary=True, same_campaign=True, same_resource=True, redeemed=True)
        return AgentResult(agent='Duplicate Claim Detection Agent', status='requires_review', summary='Possible duplicate claim detected; aid is held for coordinator review rather than denied.', confidence=result['confidence'], uncertainty='A match is a risk signal, not a denial decision.', evidence=[{'id': 'VCH-382014', 'detail': 'Existing redeemed voucher'}, {'id': 'BEN-BETA-022', 'detail': 'Same beneficiary reference'}], requireshumanreview=True, output=result).model_dump()
    return AgentResult(agent=agent_name, status='fallback', summary=FALLBACK_MESSAGE, confidence=.55, uncertainty='No configured AI provider; deterministic service path used.', evidence=[{'id': 'SYSTEM', 'detail': 'Provider configuration unavailable'}]).model_dump()
