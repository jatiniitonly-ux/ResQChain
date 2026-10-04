# ResQChain upgrade plan

## Audit findings

- Existing shell, navigation, seeded Cyclone Relief scenario, policy logic, approval flow, vouchers, duplicate conflicts, synchronization, audit timeline, donor view, Mumbai location view, and guided simulation are implemented.
- Existing agent runs expose status, confidence, evidence, uncertainty, and approval state, but there is no inspectable agent-trace panel with request, tools, input records, warnings, and final action status.
- The dashboard has KPIs, map, copilot, activity, and alerts but does not prominently surface a Recommended Next Action.
- `/resources`, `/beneficiaries`, `/reports`, `/history`, and `/settings` still use the generic SimplePage placeholder instead of functional workflows.
- Offline events are represented in React state; the offline store contract exists but is not wired to IndexedDB persistence.
- The backend already exposes a provider abstraction and deterministic fallback endpoints, but the browser demo intentionally uses local deterministic logic and labels offline requests clearly.

## Implementation approach

1. Preserve the current command-rail layout, navy/warm-neutral/orange/teal visual system, seeded scenario, and existing end-to-end simulation.
2. Add a reusable Agent Trace inspector and expose it from agent cards and recent run records. Trace data will show the user request, agent, authorized tool sequence, input evidence, output, confidence, missing data, warnings, approval requirement, timestamp, and final status. No secrets or prompts are exposed.
3. Add a dashboard Recommended Next Action panel tied to the current open approval/conflict/route state.
4. Replace the most important placeholder routes with functional, state-connected workspaces: field reports with triage submission, agent history with trace inspection, settings with visible responsible-AI controls, and resource/beneficiary views connected to the seeded state.
5. Add explicit Demo reasoning labels whenever local deterministic fallback is used; never imply a live model response when offline or unconfigured.
6. Preserve the backend provider abstraction as the optional live-provider boundary and keep all sensitive actions behind human approval.

## Design

- **Movement:** emergency operations command center with editorial information density.
- **Principles:** accountable by default, evidence before action, resilient under poor connectivity, calm under pressure.
- **Color philosophy:** deep navy anchors trust; warm paper surfaces reduce fatigue; orange marks action; teal marks verified/synchronized state; amber signals review; red is reserved for critical risk.
- **Layout paradigm:** persistent left command rail plus focused operational panels; important actions appear in context rather than decorative dashboards.
- **Signature elements:** beacon mark, evidence chips, and status pills with clear operational language.
- **Interaction:** every recommendation exposes evidence and a human decision path; queued/offline states are explicit.
- **Animation:** restrained hover/press transitions only; no distracting motion during critical workflows.
- **Typography:** IBM Plex Sans for interface hierarchy and IBM Plex Mono for IDs, timestamps, hashes, and device state.
- **Brand essence:** accountable relief coordination for teams operating when connectivity is unreliable; resilient, precise, humane.
- **Brand voice:** direct, calm, operational. Example: “The system recommends. An authorized coordinator decides.” and “Queued locally — no live AI result was generated.”
- **Wordmark/mark:** a concentric beacon with an orange diamond core, representing a signal that remains visible through network failure.
- **Signature color:** ResQ orange `#F16D3B`.

## Project structure

- `frontend/src/app/App.tsx`: routes, shell, page workflows, trace inspector.
- `frontend/src/app/DemoState.tsx`: seeded state, policy actions, approval, offline and audit transitions.
- `frontend/src/lib/logic.ts`: deterministic policy, routing, voucher signing, and audit helpers.
- `frontend/src/offline/store.ts`: browser-local event contract and future IndexedDB adapter boundary.
- `backend/app/`: optional FastAPI provider, policy, sync, security, and audit boundaries.
- `frontend/e2e/`: browser acceptance flows for the full demo story.
