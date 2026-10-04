URGENCY = {'Critical': 40, 'High': 30, 'Medium': 20, 'Low': 10}
VULNERABILITY = {'Severe': 30, 'High': 20, 'Medium': 10, 'Low': 5}

def priority_score(urgency: str, vulnerability: str, accessibility: int = 8, distance: int = 7, availability: int = 10) -> int:
    return URGENCY.get(urgency, 10) + VULNERABILITY.get(vulnerability, 5) + accessibility + distance + availability

def allocation_allowed(request: dict) -> tuple[bool, list[str]]:
    checks = [
        ('inventory', request['requested_quantity'] <= request['inventory_available']),
        ('budget', request['estimated_cost'] <= request['budget_available']),
        ('route_access', not request['route_blocked']),
        ('positive_quantity', request['requested_quantity'] > 0),
    ]
    return all(ok for _, ok in checks), [f'{name}:{"passed" if ok else "blocked"}' for name, ok in checks]

def route_recommendation(blocked: bool) -> dict:
    if blocked:
        return {'recommendedroute': ['Warehouse North', 'Ring Road', 'Camp Beta'], 'distancekm': 18.4, 'estimatedtimeminutes': 42, 'avoidedsegments': ['Coastal Link'], 'alternativeroutes': ['River Road', 'North Bypass'], 'risknotes': ['Bridge checkpoint requires field verification.'], 'confidence': 0.88, 'requireshumanreview': False}
    return {'recommendedroute': ['Warehouse North', 'Coastal Link', 'Camp Beta'], 'distancekm': 12.8, 'estimatedtimeminutes': 27, 'avoidedsegments': [], 'alternativeroutes': ['Ring Road'], 'risknotes': [], 'confidence': 0.96, 'requireshumanreview': False}

def duplicate_status(*, same_beneficiary: bool, same_campaign: bool, same_resource: bool, redeemed: bool) -> dict:
    matches = sum([same_beneficiary, same_campaign, same_resource, redeemed])
    if redeemed or matches >= 3:
        return {'status': 'highriskduplicate', 'recommendedaction': 'holdforreview', 'requireshumanreview': True, 'confidence': 0.97}
    if matches >= 2:
        return {'status': 'possibleduplicate', 'recommendedaction': 'holdforreview', 'requireshumanreview': True, 'confidence': 0.82}
    return {'status': 'clear', 'recommendedaction': 'allow', 'requireshumanreview': False, 'confidence': 0.94}
