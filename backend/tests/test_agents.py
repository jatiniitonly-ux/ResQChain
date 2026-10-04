from app.agents.orchestrator import FALLBACK_MESSAGE, run_agent

def test_triage_returns_structured_evidence():
    result = run_agent('triage', {'description': 'Flooding at Camp Beta'})
    assert result['agent'] == 'Incident Triage Agent'
    assert 0 <= result['confidence'] <= 1
    assert result['evidence']
    assert 'urgency' in result['output']

def test_unknown_agent_uses_visible_fallback():
    result = run_agent('communication', {'description': 'Notify vendor'})
    assert result['fallback'] is True
    assert FALLBACK_MESSAGE in result['summary']
