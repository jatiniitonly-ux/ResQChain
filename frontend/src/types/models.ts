export type Role = 'Coordinator' | 'Field Agent' | 'Hospital' | 'Vendor' | 'Donor' | 'Auditor'
export type AgentStatus = 'Ready' | 'Running' | 'Waiting for approval' | 'Completed' | 'Queued offline' | 'Failed' | 'Requires review'
export type SyncStatus = 'synced' | 'pending' | 'conflict'
export type VoucherStatus = 'Issued' | 'Redeemed' | 'Expired' | 'Cancelled' | 'Conflict' | 'Pending synchronization'

export interface Evidence { id: string; label: string; detail: string }
export interface PriorityPart { label: string; value: number; max: number }
export interface IncidentReport { id: string; source: string; location: string; signal: string; receivedAt: string; urgency: 'Critical' | 'High' | 'Medium' | 'Low'; verified: boolean; detail: string }
export interface AgentRun {
  id: string
  agent: string
  status: AgentStatus
  confidence: number
  createdAt: string
  duration: string
  evidence: Evidence[]
  summary: string
  uncertainty: string
  output?: Record<string, unknown>
  requiresApproval?: boolean
}
export interface Approval {
  id: string
  title: string
  agent: string
  confidence: number
  evidence: Evidence[]
  risk: string
  alternatives: string[]
  status: 'Pending' | 'Approved' | 'Rejected' | 'Review requested'
  createdAt: string
  comment?: string
  explanation?: string
  scoreBreakdown?: PriorityPart[]
  priorityCalculation?: Record<string, unknown>
  allocationDecision?: SharedAllocationDecision
}
export interface OfflineEvent {
  id: string
  type: string
  payload: string
  createdAt: string
  status: SyncStatus
  signature: string
  idempotencyKey: string
}
export interface Voucher {
  id: string
  campaignId: string
  beneficiaryRef: string
  resourceType: string
  quantity: number
  issuedAt: string
  expiresAt: string
  status: VoucherStatus
  signature: string
}
export interface Beneficiary {
  id: string
  reference: string
  householdSize: number
  location: string
  urgency: 'Critical' | 'High' | 'Medium' | 'Low'
  vulnerability: 'Severe' | 'High' | 'Medium' | 'Low'
  resources: string[]
  verified: boolean
  createdAt: string
}
export interface Allocation {
  id: string
  destination: string
  resourceType: string
  quantity: number
  priorityScore: number
  status: 'Recommended' | 'Pending approval' | 'Approved' | 'Rejected' | 'Delivered'
  reason: string
  scoreBreakdown?: PriorityPart[]
  explanation?: string
  priorityCalculation?: Record<string, unknown>
}
export interface SharedAllocationDecision {
  allocationId: string
  resourceType: string
  quantity: number
  origin: string
  destinationCamp: string
  priorityScore: number
  priorityType: string
  routeStatus: string
  selectedRoute: string
  alternateRoute: string
  blockedRoad: string
  routeRisk: string
  inventoryBefore: number
  approvedCommitments: number
  pendingCommitments: number
  inventoryAfterApproval: number
  allocationStatus: string
  evidenceIds: string[]
  createdAt: string
  updatedAt: string
}
export interface Conflict {
  id: string
  title: string
  detail: string
  risk: 'High' | 'Medium' | 'Low'
  status: 'Open' | 'Resolved'
  evidence: Evidence[]
}
export interface AuditEvent { id: string; type: string; actor: string; timestamp: string; hash: string; status: 'Verified' | 'Warning' | 'Critical'; detail?: string }
