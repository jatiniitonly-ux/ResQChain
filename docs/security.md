# ResQChain security and privacy

## Identity and access

The backend exposes a JWT-shaped auth contract with role claims and a role-aware frontend shell. Production deployments should use a managed identity provider or signed JWTs with rotated secrets, secure cookies where cookie sessions are used, rate limiting, and strict CORS origins.

## Responsible automation

The product uses transparent rules rather than claiming AI, machine learning, LLMs, or predictive analytics. Rule results use structured validation and carry confidence, uncertainty, evidence, status, and approval requirements. Rule modules cannot directly write to the database, independently approve high-value allocations, diagnose injuries, deny emergency aid, or execute dangerous actions. Uploaded documents and reports are treated as untrusted content.

## Offline integrity

Events use device IDs, timestamps, idempotency keys, digital signatures, and conflict states. Reconciliation is chronological and duplicate idempotency keys are rejected. Offline operational requests remain explicitly queued until synchronization completes.

## Privacy

QR payloads and public donor APIs use references and aggregates only. Donor views exclude names, phones, exact addresses, medical details, identity documents, and private field reports. Sensitive data should be encrypted at rest in production and never placed in logs or evidence strings unnecessarily.

## Approval and audit

Sensitive actions pause for coordinator approval. Audit records link the action, actor, evidence, decision, and hash chain. Public-safe milestones are derived from verified events only; unsynchronized items remain visibly unverified.
