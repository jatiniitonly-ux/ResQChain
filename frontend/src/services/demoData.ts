import type { AgentRun, Allocation, Approval, AuditEvent, Beneficiary, Conflict, IncidentReport, Voucher } from '../types/models'

export const incidentReports: IncidentReport[] = [
  { id: 'REPORT-104', source: 'Field Agent 03 · Offline', location: 'Coastal Link / Camp Beta', signal: 'Road blocked', receivedAt: '09:42', urgency: 'Critical', verified: false, detail: 'Floodwater has isolated the coastal segment; Camp Beta reports food stock for two days and limited medical supplies.' },
  { id: 'REPORT-103', source: 'Camp Gamma coordinator', location: 'Camp Gamma', signal: 'Water point open', receivedAt: '09:04', urgency: 'Medium', verified: true, detail: 'Water point is operational but serving above planned capacity; three households still require water.' },
  { id: 'REPORT-102', source: 'Community Care Hospital', location: 'Community Care Hospital', signal: '82% capacity', receivedAt: '08:54', urgency: 'High', verified: true, detail: 'Hospital capacity is at 82%; emergency medicine availability needs coordinator confirmation.' },
]

export const beneficiaries: Beneficiary[] = [
  { id: 'b1', reference: 'BEN-ALPHA-014', householdSize: 6, location: 'Camp Alpha', urgency: 'High', vulnerability: 'Severe', resources: ['Food kits'], verified: true, createdAt: '08:12' },
  { id: 'b2', reference: 'BEN-BETA-022', householdSize: 4, location: 'Camp Beta', urgency: 'Critical', vulnerability: 'High', resources: ['Food kits', 'Medicine'], verified: true, createdAt: '08:38' },
  { id: 'b3', reference: 'BEN-GAMMA-031', householdSize: 3, location: 'Camp Gamma', urgency: 'Medium', vulnerability: 'Medium', resources: ['Food kits'], verified: false, createdAt: '09:04' },
  { id: 'b4', reference: 'BEN-BETA-041', householdSize: 7, location: 'Camp Beta', urgency: 'High', vulnerability: 'Severe', resources: ['Medicine'], verified: true, createdAt: '09:18' },
]

export const allocations: Allocation[] = [
  { id: 'ALLOC-001', destination: 'Camp Beta', resourceType: 'Food kits', quantity: 120, priorityScore: 80, status: 'Approved', reason: 'Critical urgency + high vulnerability; closest accessible route.' },
  { id: 'ALLOC-002', destination: 'Camp Alpha', resourceType: 'Food kits', quantity: 90, priorityScore: 83, status: 'Pending approval', reason: 'High food priority from severity, affected population, and food shortage.' },
  { id: 'ALLOC-003', destination: 'District General Hospital', resourceType: 'Medicine', quantity: 80, priorityScore: 92, status: 'Delivered', reason: 'Capacity and emergency stock request validated.' },
]

export const vouchers: Voucher[] = [
  { id: 'VCH-382014', campaignId: 'CAMP-DA-01', beneficiaryRef: 'BEN-BETA-022', resourceType: 'Food kits', quantity: 2, issuedAt: '2026-10-03T08:20:00Z', expiresAt: '2026-10-05T08:20:00Z', status: 'Redeemed', signature: 'sig_demo_382014' },
  { id: 'VCH-382017', campaignId: 'CAMP-DA-01', beneficiaryRef: 'BEN-ALPHA-014', resourceType: 'Medicine', quantity: 1, issuedAt: '2026-10-03T09:01:00Z', expiresAt: '2026-10-05T09:01:00Z', status: 'Issued', signature: 'sig_demo_382017' },
]

export const approvals: Approval[] = [
  { id: 'APR-029', title: 'Allocate 90 food kits to Camp Alpha', agent: 'Resource Allocation Rules', confidence: 0.91, evidence: [{ id: 'EV-01', label: 'BEN-ALPHA-014', detail: 'Severe vulnerability cluster' }, { id: 'EV-02', label: 'INV-FOOD-500', detail: '380 food kits remain after approved allocation' }], risk: 'Medium — consumes 18% of remaining food inventory.', alternatives: ['Release 60 kits now and review after next field report.', 'Re-route Camp Alpha delivery through Ring Road.'], status: 'Pending', createdAt: '10:06' },
]

export const conflicts: Conflict[] = [
  { id: 'CON-014', title: 'Duplicate claim · BEN-BETA-022', detail: 'Offline redemption matches an existing redeemed voucher for the same campaign and resource category.', risk: 'High', status: 'Open', evidence: [{ id: 'DUP-01', label: 'VCH-382014', detail: 'Redeemed at Vendor 04 · 08:20' }, { id: 'DUP-02', label: 'DEVICE-FLD-03', detail: 'Second claim queued offline · 09:47' }] },
]

export const agentRuns: AgentRun[] = [
  { id: 'RUN-104', agent: 'Incident Triage Rules', status: 'Completed', confidence: 0.94, createdAt: '09:42', duration: '1.8s', evidence: [{ id: 'REPORT-104', label: 'FIELD REPORT', detail: 'Flooding reported near Coastal Link' }, { id: 'HOSP-02', label: 'HOSPITAL', detail: 'Community Care at 82% capacity' }], summary: 'Critical access disruption at Camp Beta; medicine and clean water are the immediate operational priorities.', uncertainty: 'Road status is based on one unverified field report.', output: { severity: 'Critical', affectedLocations: ['Camp Alpha', 'Camp Beta', 'Camp Gamma'], affectedPopulation: 612, requiredResources: ['Food kits', 'Medicine units', 'Water'], immediateRisks: ['Blocked Coastal Link', 'Limited medicine', 'Stale population count'], missingInformation: ['Latest Camp Beta registration count', 'Medicine inventory confirmation'], recommendedNextAction: 'First review Camp Beta’s medicine and water priorities. Then allocate the next unmet food requirement to Camp Alpha, subject to coordinator approval.' }, requiresApproval: true },
  { id: 'RUN-103', agent: 'Resource Allocation Rules', status: 'Waiting for approval', confidence: 0.91, createdAt: '09:31', duration: '2.3s', evidence: [{ id: 'INV-FOOD', label: 'INVENTORY', detail: '380 food kits current stock after approved commitments; 90 pending' }, { id: 'CAMP-BETA', label: 'CAMP', detail: 'Overall medicine priority 92/100; Camp Alpha food priority 83/100' }], summary: "Camp Beta has the highest overall emergency priority at 92/100 because of medicine and water shortages. For food specifically, Camp Alpha has the highest remaining unmet food priority at 83/100. Camp Beta’s approved 120 food-kit commitment is already reserved, so the current 90 food-kit recommendation is directed to Camp Alpha. Separate route assessment — Camp Beta: Ring Road is the validated alternate route around Coastal Link. The pending 90 food-kit allocation remains directed to Camp Alpha; route validation for Camp Alpha is shown separately.", uncertainty: 'Camp Alpha household count has not been verified in the last 2 hours.', requiresApproval: true },
  { id: 'RUN-102', agent: 'Route and Logistics Rules', status: 'Completed', confidence: 0.88, createdAt: '09:18', duration: '0.7s', evidence: [{ id: 'ROAD-07', label: 'ROAD', detail: 'Coastal Link status changed to blocked' }], summary: 'Separate route assessment — Camp Beta: Ring Road is the validated alternate route around Coastal Link. The pending 90 food-kit allocation remains directed to Camp Alpha; route validation for Camp Alpha is shown separately.', uncertainty: 'Bridge checkpoint requires field verification.' },
]

export const auditEvents: AuditEvent[] = [
  { id: 'AUD-018', type: 'ALLOCATION_RECOMMENDATION', actor: 'Resource Allocation Rules · System', timestamp: '09:31', hash: 'sha256:3d0c9b1f4e2a8c77', status: 'Warning', detail: 'Recommendation awaiting coordinator approval · 90 food kits → Camp Alpha' },
  { id: 'AUD-017', type: 'VOUCHER_REDEEMED', actor: 'Vendor 04 · Device 03', timestamp: '09:21', hash: 'sha256:2aa810bd1c9e77d2', status: 'Verified' },
  { id: 'AUD-016', type: 'ROAD_BLOCKED', actor: 'A. Mensah · Coordinator', timestamp: '09:15', hash: 'sha256:8b0a92e1c3f41a9b', status: 'Verified' },
  { id: 'AUD-015', type: 'FIELD_REPORT_QUEUED', actor: 'Field Agent 03 · Offline', timestamp: '09:04', hash: 'sha256:7f90d0e4ca21b876', status: 'Warning' },
]
