# ResQChain backend

FastAPI service boundary for authentication, agent orchestration, policy checks, synchronization, audit verification, and donor-safe aggregate summaries.

Run from the repository root after installing dependencies:

```bash
pip install -r backend/requirements.txt
PYTHONPATH=backend uvicorn backend.app.main:app --reload --port 8000
```

The browser demo is intentionally functional without this process; the service is the portable API path for deployment and integration.
