from dataclasses import dataclass
from typing import Any

@dataclass
class SyncResult:
    accepted: list[str]
    conflicts: list[dict[str, str]]


def reconcile(events: list[dict[str, Any]]) -> SyncResult:
    accepted: list[str] = []
    conflicts: list[dict[str, str]] = []
    seen: set[str] = set()
    for event in sorted(events, key=lambda item: item.get('createdat', '')):
        key = event.get('idempotencykey')
        if not key or key in seen:
            conflicts.append({'eventid': event.get('eventid', 'unknown'), 'reason': 'invalid or duplicate idempotency key'})
            continue
        seen.add(key)
        accepted.append(event.get('eventid', 'unknown'))
    return SyncResult(accepted=accepted, conflicts=conflicts)
