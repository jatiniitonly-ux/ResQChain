import type { Allocation, AuditEvent, Beneficiary, Evidence, SharedAllocationDecision, Voucher } from '../types/models'

export type ResourceType = 'Food kits' | 'Medicine units' | 'Water'
export type PriorityPart = { label: string; value: number; max: number }
export type PriorityScoreResult = { score: number; maximumScore: number; resourceType: ResourceType; campId: string; factorBreakdown: PriorityPart[]; rulesTriggered: string[]; evidenceIds: string[]; calculatedAt: string; scoringVersion: string }
export type PriorityBreakdown = { parts: PriorityPart[]; total: number; label: 'Critical' | 'High' | 'Medium' | 'Low'; calculation: PriorityScoreResult }
export type AllocationValidation = { valid: boolean; checks: string[]; warning?: string }
export type OperationalDecision = {
  incidentId: string
  allocation: { allocationId: string; resourceType: 'food_kits' | 'medicine_units' | 'water' | 'ambulances'; quantity: number; origin: string; destinationCamp: string; status: 'pending' | 'approved' | 'rejected' }
  priorities: { overall: PriorityScoreResult; food?: PriorityScoreResult; medicine?: PriorityScoreResult; water?: PriorityScoreResult }
  route: { origin: string; destination: string; blockedRoad?: string; selectedRoute?: string; alternateRoute?: string; distanceKm?: number; estimatedMinutes?: number; risk?: string; status: 'validated' | 'pending' | 'blocked' | 'unverified'; dataSource: string; explanation: string }
  inventory: { currentStock: number; approvedCommitments: number; pendingAllocation: number; afterPendingAllocation: number; state: 'after_approved_commitments' | 'before_commitments' }
}

const urgencyWeight: Record<Beneficiary['urgency'], number> = { Critical: 30, High: 26, Medium: 18, Low: 10 }
const vulnerabilityWeight: Record<Beneficiary['vulnerability'], number> = { Severe: 15, High: 12, Medium: 8, Low: 4 }

const priorityLabel = (score: number): PriorityBreakdown['label'] => score >= 85 ? 'Critical' : score >= 70 ? 'High' : score >= 50 ? 'Medium' : 'Low'
const priorityCache = new Map<string, PriorityScoreResult>()

export function calculatePriorityScore(input: { incidentId?: string; camp: Beneficiary; resourceType: ResourceType; severity?: Beneficiary['urgency']; affectedPopulation?: number; remainingStock?: number; medicalVulnerability?: Beneficiary['vulnerability']; routeRisk?: boolean; dataFreshness?: number; approvedCommitments?: number }): PriorityScoreResult {
  const { camp, resourceType } = input
  const routeRisk = input.routeRisk ?? true
  const beta = camp.location === 'Camp Beta'
  const alpha = camp.location === 'Camp Alpha'
  const key = JSON.stringify({ incidentId: input.incidentId ?? 'INC-DA-2026-001', camp: camp.id, location: camp.location, resourceType, severity: input.severity ?? camp.urgency, population: input.affectedPopulation ?? camp.householdSize, stock: input.remainingStock, vulnerability: input.medicalVulnerability ?? camp.vulnerability, routeRisk, freshness: input.dataFreshness ?? (camp.verified ? 0 : 0), approved: input.approvedCommitments ?? 0, version: 'priority-v2' })
  const cached = priorityCache.get(key)
  if (cached) return cached
  const resourceShortage = beta ? resourceType === 'Food kits' ? 10 : 20 : alpha ? resourceType === 'Food kits' ? 18 : 4 : resourceType === 'Water' ? 12 : 8
  const population = Math.min(25, Math.max(8, Math.round(camp.householdSize * (beta ? 5.5 : alpha ? 3.3 : 3.8))))
  const medicalVulnerability = resourceType === 'Medicine units' ? beta ? vulnerabilityWeight[input.medicalVulnerability ?? camp.vulnerability] : alpha ? 8 : vulnerabilityWeight[input.medicalVulnerability ?? camp.vulnerability] : beta ? 10 : alpha ? resourceType === 'Food kits' ? 9 : 6 : 4
  const parts: PriorityPart[] = [
    { label: 'Severity', value: urgencyWeight[input.severity ?? camp.urgency], max: 30 },
    { label: 'Population affected', value: input.affectedPopulation === undefined ? population : Math.min(25, Math.max(8, input.affectedPopulation)), max: 25 },
    { label: 'Resource shortage', value: resourceShortage, max: 20 },
    { label: 'Medical vulnerability', value: medicalVulnerability, max: 15 },
    { label: 'Route accessibility', value: routeRisk && beta ? 8 : 10, max: 10 },
    { label: 'Data freshness', value: input.dataFreshness ?? 0, max: input.dataFreshness === undefined ? 0 : 5 },
  ]
  const result: PriorityScoreResult = { score: Math.min(100, parts.reduce((sum, part) => sum + part.value, 0)), maximumScore: 100, resourceType, campId: camp.id, factorBreakdown: parts, rulesTriggered: [severityLabel(input.severity ?? camp.urgency), `${resourceType} need assessed`, routeRisk && beta ? 'Alternate route required' : 'Primary route reachable', input.approvedCommitments ? 'Approved commitments deducted' : 'No approved commitment adjustment'], evidenceIds: [`CAMP-${camp.location.replaceAll(' ', '-').toUpperCase()}`, `RESOURCE-${resourceType.replaceAll(' ', '-').toUpperCase()}`, 'ROAD-07'], calculatedAt: new Date().toISOString(), scoringVersion: 'priority-v2' }
  priorityCache.set(key, result)
  return result
}

function severityLabel(severity: Beneficiary['urgency']) { return `${severity} severity rule triggered` }

export function priorityBreakdown(beneficiary: Beneficiary, resourceType: ResourceType = 'Food kits', routeBlocked = true): PriorityBreakdown {
  const calculation = calculatePriorityScore({ incidentId: 'INC-DA-2026-001', camp: beneficiary, resourceType, routeRisk: routeBlocked })
  return { parts: calculation.factorBreakdown, total: calculation.score, label: priorityLabel(calculation.score), calculation }
}

export function priorityScore(beneficiary: Beneficiary, _accessibility = 8, _distance = 7, _availability = 10) {
  // Keep the public helper useful for callers that only provide severity and vulnerability.
  if (!beneficiary.location || !beneficiary.householdSize) return Math.min(100, urgencyWeight[beneficiary.urgency] + vulnerabilityWeight[beneficiary.vulnerability] + 50)
  return priorityBreakdown(beneficiary, 'Food kits', true).total
}

export function priorityMatrix(beneficiaries: Beneficiary[], routeBlocked = true) {
  const byLocation = (location: string) => beneficiaries.find((item) => item.location === location) ?? beneficiaries[0]
  return ['Camp Beta', 'Camp Alpha', 'Camp Gamma'].map((location) => {
    const beneficiary = byLocation(location)
    return {
      location,
      priorities: (['Medicine units', 'Water', 'Food kits'] as ResourceType[]).map((resourceType) => {
        const breakdown = priorityBreakdown({ ...beneficiary, location }, resourceType, routeBlocked)
        return { resourceType, ...breakdown }
      }),
    }
  })
}

export function recommendationExplanation(allocations: Allocation[], beneficiaries: Beneficiary[], foodKitsAvailable: number, routeBlocked: boolean) {
  const decision = operationalDecision(allocations, beneficiaries, foodKitsAvailable, routeBlocked)
  const approvedBetaFood = allocations.filter((item) => item.destination === 'Camp Beta' && item.resourceType === 'Food kits' && (item.status === 'Approved' || item.status === 'Delivered')).reduce((sum, item) => sum + item.quantity, 0)
  return `Camp Beta has the highest overall emergency priority at ${decision.priorities.overall.score}/100 because of medicine and water shortages. For food specifically, Camp Alpha has the highest remaining unmet food priority at ${decision.priorities.food?.score ?? 0}/100. Camp Beta’s approved ${approvedBetaFood} food-kit commitment is already reserved, so the current ${decision.allocation.quantity} food-kit recommendation is directed to ${decision.allocation.destinationCamp}. ${decision.route.explanation}`
}

export function sharedAllocationDecision(allocations: Allocation[], beneficiaries: Beneficiary[], foodKitsAvailable: number, routeBlocked: boolean): SharedAllocationDecision {
  const selected = allocations.find((item) => item.destination === 'Camp Alpha' && item.resourceType === 'Food kits' && item.status !== 'Delivered') ?? allocations.find((item) => item.resourceType === 'Food kits' && item.status !== 'Delivered')
  const alpha = beneficiaries.find((item) => item.location === 'Camp Alpha') ?? beneficiaries[0]
  const score = priorityBreakdown(alpha, 'Food kits', routeBlocked).calculation
  const approvedCommitments = allocations.filter((item) => item.resourceType === 'Food kits' && (item.status === 'Approved' || item.status === 'Delivered')).reduce((sum, item) => sum + item.quantity, 0)
  const quantity = selected?.quantity ?? 90
  const pendingQuantity = selected?.status === 'Pending approval' ? quantity : 0
  const route = routeRecommendation(routeBlocked)
  return {
    allocationId: selected?.id ?? 'ALLOC-002', resourceType: 'Food kits', quantity, origin: 'Warehouse North', destinationCamp: selected?.destination ?? 'Camp Alpha', priorityScore: score.score, priorityType: 'Food priority', routeStatus: routeBlocked ? 'Blocked' : 'Open', selectedRoute: route.route[1], alternateRoute: routeBlocked ? 'Ring Road' : 'Ring Road (standby)', blockedRoad: routeBlocked ? 'Coastal Link' : 'None', routeRisk: route.risk, inventoryBefore: foodKitsAvailable + approvedCommitments, approvedCommitments, pendingCommitments: pendingQuantity, inventoryAfterApproval: Math.max(0, foodKitsAvailable - pendingQuantity), allocationStatus: selected?.status === 'Pending approval' ? 'Pending coordinator approval' : selected?.status ?? 'Pending coordinator approval', evidenceIds: [...score.evidenceIds, ...(selected ? [selected.id] : [])], createdAt: '2026-10-03T09:31:00Z', updatedAt: '2026-10-03T09:42:00Z',
  }
}

export function triageNextAction(allocations: Allocation[], beneficiaries: Beneficiary[]) {
  const beta = beneficiaries.find((item) => item.location === 'Camp Beta')
  const selected = allocations.find((item) => item.resourceType === 'Food kits' && item.status !== 'Delivered')
  const destination = selected?.destination ?? beneficiaries.find((item) => item.location === 'Camp Alpha')?.location ?? 'the next eligible camp'
  return `First review ${beta?.location ?? 'Camp Beta'}’s medicine and water priorities. Then allocate the next unmet food requirement to ${destination}, subject to coordinator approval.`
}


export function operationalDecision(allocations: Allocation[], beneficiaries: Beneficiary[], foodKitsAvailable: number, routeBlocked: boolean): OperationalDecision {
  const shared = sharedAllocationDecision(allocations, beneficiaries, foodKitsAvailable, routeBlocked)
  const beta = beneficiaries.find((item) => item.location === 'Camp Beta') ?? beneficiaries[0]
  const alpha = beneficiaries.find((item) => item.location === 'Camp Alpha') ?? beneficiaries[0]
  const medicine = priorityBreakdown(beta, 'Medicine units', routeBlocked).calculation
  const water = priorityBreakdown(beta, 'Water', routeBlocked).calculation
  const food = priorityBreakdown(alpha, 'Food kits', routeBlocked).calculation
  const route = routeRecommendation(routeBlocked)
  return {
    incidentId: 'INC-DA-2026-001',
    allocation: { allocationId: shared.allocationId, resourceType: 'food_kits', quantity: shared.quantity, origin: shared.origin, destinationCamp: shared.destinationCamp, status: shared.allocationStatus === 'Approved' ? 'approved' : shared.allocationStatus === 'Rejected' ? 'rejected' : 'pending' },
    priorities: { overall: medicine.score >= water.score ? medicine : water, food, medicine, water },
    route: { origin: shared.origin, destination: 'Camp Beta', blockedRoad: shared.blockedRoad === 'None' ? undefined : shared.blockedRoad, selectedRoute: shared.selectedRoute, alternateRoute: shared.alternateRoute, distanceKm: Number(route.distance.replace(' km', '')), estimatedMinutes: Number(route.duration.replace(' min', '')), risk: route.risk, status: routeBlocked ? 'blocked' : 'validated', dataSource: 'Transparent decision rules · demonstration data', explanation: `Separate route assessment — Camp Beta: ${shared.selectedRoute} is the validated alternate route around ${shared.blockedRoad === 'None' ? 'the current road network' : shared.blockedRoad}. The pending ${shared.quantity} food-kit allocation remains directed to ${shared.destinationCamp}; route validation for ${shared.destinationCamp} is shown separately.` },
    inventory: { currentStock: foodKitsAvailable, approvedCommitments: shared.approvedCommitments, pendingAllocation: shared.pendingCommitments, afterPendingAllocation: shared.inventoryAfterApproval, state: 'after_approved_commitments' },
  }
}

export function validateAllocation(beneficiary: Beneficiary | undefined, resourceType: ResourceType, quantity: number, available: number, routeBlocked: boolean, approvedCommitment = 0, emergencyReserve = 50): AllocationValidation {
  const checks = [
    `${resourceType} exists in inventory`,
    quantity > 0 && quantity <= Math.max(0, available - emergencyReserve) ? 'Quantity available after emergency reserve' : 'Quantity exceeds available stock or emergency reserve',
    beneficiary?.resources.some((resource) => resource === resourceType || (resourceType === 'Medicine units' && resource === 'Medicine')) ? 'Destination need recorded' : 'Destination need not recorded',
    routeBlocked ? 'Alternate route available' : 'Primary route reachable',
    approvedCommitment >= 0 ? 'Approved commitments deducted' : 'Approved commitment state unavailable',
    available - quantity - emergencyReserve >= 0 ? 'Emergency reserve preserved' : 'Emergency reserve would be breached',
    'Allocation quantity uses food-kit units',
  ]
  const valid = checks.every((check) => !check.includes('not') && !check.includes('exceeds') && !check.includes('breached') && !check.includes('unavailable'))
  return { valid, checks, warning: valid ? undefined : 'Recommendation withheld because one or more inventory, need, route, or reserve checks failed.' }
}

export function recommendAllocations(beneficiaries: Beneficiary[], availableFood: number, blocked = false): Allocation[] {
  const ranked = [...beneficiaries].sort((a, b) => priorityScore(b) - priorityScore(a))
  return ranked.slice(0, 3).map((beneficiary, index) => {
    const score = priorityBreakdown(beneficiary, 'Food kits', blocked)
    const quantity = Math.min(Math.max(50, beneficiary.householdSize * 10 + 30), Math.max(0, availableFood - index * 50))
    const reason = `${score.label} food priority ${score.total}/100; ${beneficiary.urgency} severity, ${beneficiary.vulnerability.toLowerCase()} medical vulnerability, and ${blocked && beneficiary.location === 'Camp Beta' ? 'Ring Road alternate validated' : 'route reachable'}.`
    return { id: `ALLOC-${String(index + 1).padStart(3, '0')}`, destination: beneficiary.location, resourceType: 'Food kits', quantity, priorityScore: score.total, status: 'Pending approval', reason, scoreBreakdown: score.parts, priorityCalculation: score.calculation }
  })
}

export function routeRecommendation(blocked: boolean) {
  return blocked
    ? { route: ['Warehouse North', 'Ring Road', 'Camp Beta'], avoided: 'Coastal Link → Camp Beta', distance: '18.4 km', duration: '42 min', risk: 'Bridge checkpoint requires field verification.', alternatives: ['River Road → Camp Beta (24 km)', 'North Bypass → Camp Beta (31 km)'] }
    : { route: ['Warehouse North', 'Coastal Link', 'Camp Beta'], avoided: 'None', distance: '12.8 km', duration: '27 min', risk: 'Clear under current road report.', alternatives: ['Ring Road → Camp Beta (18 km)'] }
}

export function signPayload(payload: Omit<Voucher, 'signature' | 'status'>) {
  const canonical = `${payload.id}|${payload.campaignId}|${payload.beneficiaryRef}|${payload.resourceType}|${payload.quantity}|${payload.issuedAt}`
  return `sig_${btoa(canonical).replace(/[^a-z0-9]/gi, '').slice(0, 18)}`
}

export function createVoucher(beneficiaryRef: string, resourceType: string, quantity: number): Voucher {
  const now = new Date()
  const issuedAt = now.toISOString()
  const payload = { id: `VCH-${now.getTime().toString().slice(-6)}`, campaignId: 'CAMP-DA-01', beneficiaryRef, resourceType, quantity, issuedAt, expiresAt: new Date(now.getTime() + 1000 * 60 * 60 * 48).toISOString() }
  return { ...payload, status: 'Issued', signature: signPayload(payload) }
}

export function duplicateEvidence(voucher: Voucher, prior?: Voucher): Evidence[] {
  return [
    { id: 'DUP-01', label: 'VOUCHER_ID', detail: `${voucher.id} was already redeemed` },
    { id: 'DUP-02', label: 'BENEFICIARY_REF', detail: `${voucher.beneficiaryRef} has an existing ${voucher.resourceType} record` },
    ...(prior ? [{ id: 'DUP-03', label: 'CAMPAIGN', detail: `${prior.campaignId} · same resource category` }] : []),
  ]
}

export function hashAudit(previous: string, event: Omit<AuditEvent, 'hash'>) {
  const raw = `${previous}|${event.id}|${event.type}|${event.actor}|${event.timestamp}`
  return `sha256:${btoa(raw).replace(/[^a-z0-9]/gi, '').slice(0, 28)}`
}
