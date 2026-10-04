-- ResQChain schema reference. Production deployment maps these entities to SQLAlchemy/Alembic models.
-- users, roles, incidents, campaigns, reliefcamps, hospitals, vendors, roads, resources,
-- beneficiaries, allocations, vouchers, synchronizationevents, conflicts, auditevents,
-- agentruns, agentevidence, agentapprovals, notifications, routesnapshots, documents, fieldreports.
CREATE TABLE IF NOT EXISTS audit_schema_version (version integer primary key, applied_at timestamptz not null default now());
INSERT INTO audit_schema_version(version) VALUES (1) ON CONFLICT DO NOTHING;
