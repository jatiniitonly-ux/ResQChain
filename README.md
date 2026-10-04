# ResQChain

## Incident intelligence workflow

The `/incidents` page is the primary evidence-backed workflow for **Cyclone Relief — District A**. It shows incident identity, severity, affected population, data freshness, unresolved reports, pending approvals, offline reports, coordinator ownership, and the governed status flow from Reported to Resolved. Resolution remains locked while unverified critical reports or pending approvals remain.

The page seeds three incoming reports and the **Run Incident Triage** action reads those records to produce severity, affected locations, population, required resources, immediate risks, missing information, a recommended next action, confidence, evidence references, and human-review status. **View Rule Trace** exposes the user request, authorized tools, records checked, evidence, output, uncertainty, approval requirement, timestamp, and final action status. Results are labeled **Deterministic rules** and are never presented as final decisions.
