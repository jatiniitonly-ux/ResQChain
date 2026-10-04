ResQChain

Relief That Works When Networks Don’t

ResQChain is an offline-first disaster-relief coordination platform for coordinators, NGOs, field agents, hospitals, vendors, donors, and auditors. It coordinates scarce food, medicine, transport, hospital capacity, beneficiaries, vouchers, field reports, conflicts, synchronization, and audit records when connectivity and roads are unreliable.


The system recommends. Authorized personnel approve. Every action remains traceable.


Structured operational orchestration with deterministic, auditable tools. Critical decisions always require human approval.

The product uses transparent deterministic rules and demonstration data. It does not claim autonomous AI, machine learning, LLM reasoning, predictive analytics, or autonomous approval.

Golden demonstration scenario

The application is centered on Cyclone Relief — District A and uses one shared operational state across the dashboard, incidents, resources, allocations, approvals, synchronization, conflicts, vouchers, simulation, donor transparency, and audit views.

Field
Demonstration value
Incident
Cyclone Relief — District A
Disaster type
Flooding/cyclone
Affected population
612
Camps
Camp Alpha, Camp Beta, Camp Gamma
Hospitals
2
Blocked route
Coastal Link
Alternate route
Ring Road
Camp Beta overall priority
92/100
Camp Alpha food priority
83/100
Gross food inventory
500 food kits
Approved Camp Beta commitment
120 food kits
Operationally available inventory
380 food kits
Pending allocation
90 food kits
Projected inventory after approval
290 food kits
Recommendation
90 food kits → Camp Alpha
Recommendation confidence
91%
Offline field agent
FLD-03
Initial queued event
1
Duplicate claim
BEN-BETA-022
Duplicate claim status
Held for human review
App version
v1.4.2




Scores are bounded to a maximum of 100 and are calculated once through the shared policy logic before being reused by downstream views.

Core workflows

Incident triage

The /incidents workflow reads the seeded incident reports and produces severity, affected locations, population, required resources, immediate risks, missing information, a recommended next action, confidence, evidence references, and human-review status.

Resource allocation

The deterministic allocation rules inspect incident reports, camp needs, inventory, approved commitments, route constraints, and priority scores. The current recommendation is:

Plain Text


90 food kits → Camp Alpha



The recommendation remains pending until an authorized coordinator approves or rejects it.

Human approval state machine

Before approval, the shared inventory state is:

Plain Text


Gross inventory: 500 food kits
Approved commitments: 120 food kits
Operationally available: 380 food kits
Pending allocation: 90 food kits
Projected balance after approval: 290 food kits
Approval status: Pending coordinator approval



Approval creates a real audit event and updates the inventory. Rejection preserves available stock and records the rejection reason and destination in the audit trail. Reset Demo restores the original pending state.

Route assessment

Coastal Link is treated as blocked. Ring Road is the validated alternate route. Route status, selected route, alternate route, risk, and explanation are shared across incidents, allocations, approvals, simulation, and audit views.

Offline field operations

Field actions remain available when offline. Events are signed locally, assigned idempotency keys, and shown as queued until synchronization. The initial demonstration queue contains one field event from FLD-03.

Voucher workflow

Vouchers support issue, signed local creation, redemption, expiration, invalid-state handling, and duplicate-use checks without exposing private beneficiary data in public views.

Conflict workflow

Duplicate claims such as BEN-BETA-022 are held for human review rather than silently denied. A coordinator resolves the conflict and the resolution is linked to the audit chain.

Audit and donor transparency

The audit view displays tamper-evident records, evidence references, chain verification, approval outcomes, synchronization warnings, and compliance checks. The donor view is privacy-safe and intentionally excludes names, phone numbers, exact addresses, medical details, identity documents, and private field reports.

Decision Trace

The Decision Trace is shown in the operational views and explains:

•
Deterministic mode and human-approval requirements

•
Incident, field-report, camp-need, inventory, commitment, route, and duplicate inputs inspected

•
Priority and unmet-need calculations

•
Allocation constraints and route checks

•
Evidence supporting the recommendation

•
Alternatives considered

•
The difference between a recommendation and an approved action


Recommendations support coordinators; they do not replace accountable human decisions.

Application routes

Route
Purpose
/
Operations overview and decision consistency
/simulation
Guided end-to-end disaster-resilience demonstration
/incidents
Incident reports, triage, evidence, and rule trace
/resources
Inventory and allocation constraints
/locations
Operational locations and route context
/beneficiaries
Beneficiary records and needs
/allocations
Allocation recommendations and shared decision details
/agents
Deterministic rule-run history and structured outputs
/approvals
Coordinator approval, rejection, and review actions
/field
Offline field workflow
/vouchers, /vouchers/issue, /vouchers/redeem
Voucher lifecycle
/sync
Offline queue, synchronization, idempotency, and reconciliation
/conflicts
Duplicate-claim review and resolution
/audit
Tamper-evident audit chain and verification
/research
Interview/prototype evidence and design rationale
/donor
Privacy-safe public transparency view
/reports, /history, /settings
Supporting operational workspaces




State and persistence

The frontend uses a centralized DemoStateProvider and shared policy functions for the active operational decision. State is persisted through a small localStorage repository abstraction using the resqchain-demo-cache key. Persisted state includes allocations, approvals, vouchers, conflicts, audit events, offline events, beneficiaries, connectivity, role, and synchronization metadata.

Use Reset Demo Scenario to remove the local cache and restore the golden demonstration state.

Project structure

Plain Text


backend/       FastAPI policy, audit, sync, security, and test modules
frontend/      React + TypeScript application and browser tests
docs/          API, architecture, demo, and security documentation
migrations/    Database schema baseline
scripts/       Seed and demo reset helpers
.github/       Continuous integration workflow



Local development

Requirements: Node.js 22+, npm, and Python 3.11+ for backend tests.

Bash


npm ci
npm run dev



The Vite development server runs on port 5173 by default. For a production-style local preview:

Bash


npm run build
npm run start



The preview server runs on port 3000 and listens on 0.0.0.0 for deployment environments.

Validation commands

Bash


npm run typecheck       # TypeScript validation
npm test -- --run       # Frontend unit tests
npm run build           # Production bundle
npm run test:e2e        # Playwright browser acceptance tests
npm run backend:test    # Backend policy tests



The project includes regression coverage for bounded priority scoring, alternate-route selection, shared allocation consistency, operational-state consistency, reserve-safe allocation, approval/rejection inventory behavior, vouchers, and duplicate review.

Deployment

Published project repository:

•


https://github.com/jatiniitonly-ux/resqchain

Live demonstration:

•


https://3000-igqb6q6qt9qvk92bfh81s-1c21d611.sg2.manus.computer/

Primary evidence workflow:

•


https://3000-igqb6q6qt9qvk92bfh81s-1c21d611.sg2.manus.computer/incidents

The deployment is a demonstration environment using seeded operational data. It must not be described as live field data unless a real provider is connected and verified.

Trust and privacy principles

•
Recommendations never bypass authorized human approval.

•
Pending, approved, rejected, queued, synced, conflict, and warning states are explicit.

•
Duplicate claims are held for review, not silently denied.

•
Offline actions remain traceable through signatures and idempotency keys.

•
Audit records are created from actual application actions.

•
Public donor views exclude sensitive personal and medical information.

•
Demonstration data is labeled and is not presented as live operational data.

