from hashlib import sha256
import json
from typing import Any

def canonical_event(event: dict[str, Any]) -> str:
    return json.dumps(event, sort_keys=True, separators=(',', ':'))

def event_hash(previous_hash: str, event: dict[str, Any]) -> str:
    return 'sha256:' + sha256((previous_hash + canonical_event(event)).encode()).hexdigest()

def verify_chain(events: list[dict[str, Any]]) -> dict[str, Any]:
    previous = 'GENESIS'
    issues: list[str] = []
    for event in events:
        expected = event_hash(previous, {key: value for key, value in event.items() if key != 'hash'})
        if event.get('hash') != expected:
            issues.append(event.get('id', 'unknown'))
        previous = event.get('hash', previous)
    return {'auditstatus': 'verified' if not issues else 'warning', 'issues': issues, 'verifiedevents': len(events) - len(issues)}
