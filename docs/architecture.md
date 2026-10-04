# ResQChain architecture

## System shape

ResQChain is organized around a browser-first operations shell backed by a service-layer contract. The browser holds seeded incident state and a local event queue so the demo can remain useful without Postgres, Redis, or any external model provider. The FastAPI boundary exposes the same core actions for a production integration pass.

```text
Coordinator / Field Agent / Vendor / Donor / Auditor
                         |
                 React + TypeScript shell
        map · evidence · approvals · offline store
                         |
             Relief Operations Orchestrator
       auth → permissions → context → transparent rules
                         |
          FastAPI services · audit · sync · policies
           PostGIS · Redis · object storage · optional integrations
```

## Orchestrator contract

Every rule run carries a status, confidence, uncertainty, evidence references, structured output, fallback marker, and approval requirement. Rule modules calculate and explain, but mutations happen in service-layer functions after deterministic validation. Uploaded field reports are untrusted input and cannot override system instructions or access controls.

## Domain model

The requested schema is represented by the migration reference: users, roles, incidents, campaigns, relief camps, hospitals, vendors, roads, resources, beneficiaries, allocations, vouchers, synchronization events, conflicts, audit events, rule runs, rule evidence, rule approvals, notifications, route snapshots, documents, and field reports.

## Offline model

Each event includes an ID, type, campaign, device, actor, timestamp, payload, idempotency key, digital signature, and sync status. Reconnection sorts events chronologically, validates signatures and idempotency, compares local/server state, flags conflicts, queues audit analysis, and returns accepted/conflicted results. The browser service worker caches the shell; `frontend/src/offline/store.ts` is the local persistence boundary.

## Visual model

The left command rail is the stable identity surface. The top incident strip keeps the active context visible. The main canvas combines maps, evidence, activity, and approvals rather than presenting a generic grid of tiles. ResQ orange marks action; teal marks verified state; amber marks pending review; red marks risk and blocked routes.
