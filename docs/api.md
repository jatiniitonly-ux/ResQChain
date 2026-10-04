# ResQChain API

FastAPI publishes OpenAPI documentation at `/docs` when the backend is running.

## Auth

- `POST /auth/register` — planned production registration contract.
- `POST /auth/login` — returns a demo JWT-shaped token and Coordinator identity.
- `GET /auth/me` — returns the authorized demo user.

## Operations

- `POST /incidents`, `GET /incidents`, `GET /incidents/{id}`, `PATCH /incidents/{id}`
- `POST /resources`, `GET /resources`, `PATCH /resources/{id}`
- `POST /beneficiaries`, `GET /beneficiaries`, `GET /beneficiaries/{id}`
- `POST /allocations/calculate`, `POST /allocations/{id}/approve`, `POST /allocations/{id}/reject`, `GET /allocations`
- `POST /vouchers/issue`, `POST /vouchers/redeem`, `GET /vouchers/{id}`, `POST /vouchers/{id}/cancel`

## Sync and governance

- `POST /sync/events` — chronological, idempotent reconciliation.
- `GET /sync/status`, `POST /sync/reconcile`
- `GET /conflicts`, `GET /conflicts/{id}`, `POST /conflicts/{id}/resolve`
- `GET /approvals/pending`, `POST /approvals/{id}/approve`, `POST /approvals/{id}/reject`, `POST /approvals/{id}/request-review`
- `GET /audit/events`, `GET /audit/verify/{campaignid}`, `GET /audit/export/{campaignid}`

## Agents

- `POST /agents/triage`
- `POST /agents/allocation`
- `POST /agents/route`
- `POST /agents/field-report`
- `POST /agents/beneficiary`
- `POST /agents/duplicate-check`
- `POST /agents/copilot`
- `POST /agents/donor-update`
- `POST /agents/audit`
- `POST /agents/communication`
- `GET /agents/runs`, `GET /agents/runs/{id}`

The runnable scaffold also supports generic `POST /agents/{agent_name}`, `POST /agents/route`, `POST /allocations/calculate`, `POST /sync/events`, `GET /audit/verify/{campaignid}`, and `GET /public/campaigns/{campaignid}/summary`.
