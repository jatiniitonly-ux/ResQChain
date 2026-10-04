from app.rules.policy import allocation_allowed, duplicate_status, priority_score, route_recommendation

def test_priority_score_is_explainable_and_weighted():
    assert priority_score('Critical', 'Severe') == 95
    assert priority_score('Low', 'Low') == 40

def test_allocation_constraints_block_inventory_and_route():
    allowed, checks = allocation_allowed({'requested_quantity': 10, 'inventory_available': 5, 'route_blocked': True, 'budget_available': 100, 'estimated_cost': 20})
    assert not allowed
    assert 'inventory:blocked' in checks
    assert 'route_access:blocked' in checks

def test_route_changes_when_road_is_blocked():
    assert route_recommendation(False)['recommendedroute'][1] == 'Coastal Link'
    assert route_recommendation(True)['recommendedroute'][1] == 'Ring Road'
    assert 'Coastal Link' in route_recommendation(True)['avoidedsegments']

def test_duplicate_is_review_not_denial():
    result = duplicate_status(same_beneficiary=True, same_campaign=True, same_resource=True, redeemed=True)
    assert result['status'] == 'highriskduplicate'
    assert result['recommendedaction'] == 'holdforreview'
    assert result['requireshumanreview'] is True
