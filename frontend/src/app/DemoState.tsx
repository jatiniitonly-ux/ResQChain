import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { agentRuns as seededRuns, allocations as seededAllocations, approvals as seededApprovals, auditEvents as seededAudit, beneficiaries as seededBeneficiaries, conflicts as seededConflicts, incidentReports, vouchers as seededVouchers } from '../services/demoData'
import { calculatePriorityScore, createVoucher, duplicateEvidence, hashAudit, operationalDecision, priorityBreakdown, recommendAllocations, recommendationExplanation, routeRecommendation, sharedAllocationDecision, triageNextAction, validateAllocation } from '../lib/logic'
import type { AgentRun, Allocation, Approval, AuditEvent, Beneficiary, Conflict, Evidence, OfflineEvent, Role, SharedAllocationDecision, Voucher } from '../types/models'

interface CopilotResponse { answer: string; uncertainty: string; evidence: Evidence[] }
interface DemoState {
  role: Role
  online: boolean
  activeIncident: boolean
  routeBlocked: boolean
  beneficiaries: Beneficiary[]
  allocations: Allocation[]
  allocationDecision: SharedAllocationDecision
  operationalDecision: ReturnType<typeof operationalDecision>
  foodKitsAvailable: number
  medicineUnitsAvailable: number
  ambulancesAvailable: number
  hospitalBedsAvailable: number
  approvals: Approval[]
  vouchers: Voucher[]
  conflicts: Conflict[]
  agentRuns: AgentRun[]
  auditEvents: AuditEvent[]
  queuedEvents: OfflineEvent[]
  lastSyncAt: string
  lastRoute: ReturnType<typeof routeRecommendation>
  lastCopilot?: CopilotResponse
  lastNotice?: string
  setRole: (role: Role) => void
  setOnline: (online: boolean) => void
  runTriage: () => void
  runAllocation: () => void
  approveAllocation: (id: string, comment?: string) => void
  rejectApproval: (id: string, comment: string) => void
  requestReview: (id: string, comment: string) => void
  toggleRoute: () => void
  runRoute: () => void
  askCopilot: (question: string) => void
  addBeneficiary: (input: Pick<Beneficiary, 'reference' | 'householdSize' | 'location' | 'urgency' | 'vulnerability' | 'resources'>) => void
  issueVoucher: (beneficiaryRef: string, resourceType: string, quantity: number) => Voucher
  redeemVoucher: (id: string) => void
  syncNow: () => void
  resolveConflict: (id: string) => void
  verifyAudit: () => void
  resetDemo: () => void
}

const DemoContext = createContext<DemoState | null>(null)
const nowLabel = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
const eventFor = (type: string, payload: string, status: OfflineEvent['status'] = 'pending'): OfflineEvent => ({ id: `EVT-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`, type, payload, createdAt: new Date().toISOString(), status, signature: `sig_${Math.random().toString(36).slice(2, 12)}`, idempotencyKey: `idem_${Date.now()}-${Math.random().toString(36).slice(2, 5)}` })

const readCache = () => { try { return typeof window === 'undefined' ? {} : JSON.parse(window.localStorage.getItem('resqchain-demo-cache') ?? '{}') as Record<string, unknown> } catch { return {} } }
const initialOfflineEvent: OfflineEvent = { id: 'EVT-991', type: 'FIELD_REPORT_QUEUED', payload: 'Camp Gamma · 3 households require water', createdAt: '2026-10-03T09:04:00Z', status: 'pending', signature: 'sig_offline_991', idempotencyKey: 'idem_991' }
const baselineExplanation = recommendationExplanation(seededAllocations, seededBeneficiaries, 380, true)
const baselineAllocation = sharedAllocationDecision(seededAllocations, seededBeneficiaries, 380, true)
const baselineCalculation = priorityBreakdown(seededBeneficiaries.find((item) => item.location === 'Camp Alpha') ?? seededBeneficiaries[0], 'Food kits', true).calculation
const baselineApprovals = seededApprovals.map((approval) => ({ ...approval, title: `Allocate ${baselineAllocation.quantity} food kits to ${baselineAllocation.destinationCamp}`, explanation: baselineExplanation, evidence: [{ id: 'INV-FOOD', label: 'INVENTORY', detail: `${baselineAllocation.inventoryBefore} food kits before approved commitments` }, { id: baselineAllocation.allocationId, label: 'PRIORITY SCORE', detail: `${baselineAllocation.priorityScore}/100 · ${baselineAllocation.priorityType}` }, { id: baselineAllocation.blockedRoad, label: 'ROUTE', detail: `${baselineAllocation.selectedRoute} selected · ${baselineAllocation.routeStatus}` }], scoreBreakdown: baselineCalculation.factorBreakdown, priorityCalculation: baselineCalculation, allocationDecision: baselineAllocation }))
const baselineOperationalDecision = operationalDecision(seededAllocations, seededBeneficiaries, 380, true)
const allocationAgentTools = ['getIncidentReports()', 'getCampNeeds()', 'getInventory()', 'checkBlockedRoutes()', 'calculatePriorityScore()']
const allocationAgentEvidence = [{ id: 'CAMP-ALPHA-FOOD', label: 'PRIORITY', detail: 'Camp Alpha has the highest remaining unmet food priority' }, { id: 'CAMP-BETA-120', label: 'COMMITMENT', detail: 'Camp Beta’s 120-kit commitment is already reserved' }, { id: 'ROAD-07', label: 'ROUTE', detail: 'Coastal Link is blocked' }, { id: 'HUMAN-GATE', label: 'APPROVAL', detail: 'Coordinator approval is required' }]
const baselineRuns = seededRuns.map((run) => run.id === 'RUN-103'
  ? { ...run, summary: baselineExplanation, evidence: allocationAgentEvidence, output: { ...run.output, ...baselineOperationalDecision, agentLabel: 'Resource Allocation Agent', toolsCalled: allocationAgentTools, recommendation: 'Allocate 90 food kits to Camp Alpha', approvalStatus: 'Pending human approval', priorityScore: baselineOperationalDecision.priorities.overall.score, priorityScale: `${baselineOperationalDecision.priorities.overall.score}/100` } }
  : run.id === 'RUN-102'
    ? { ...run, summary: baselineOperationalDecision.route.explanation, output: { ...run.output, ...baselineOperationalDecision.route } }
    : run)

export function DemoStateProvider({ children }: { children: ReactNode }) {
  const cache = readCache()
  const [role, setRole] = useState<Role>((cache.role as Role) ?? 'Coordinator')
  const [online, setOnlineState] = useState(cache.online !== false)
  const [routeBlocked, setRouteBlocked] = useState(true)
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>((cache.beneficiaries as Beneficiary[]) ?? seededBeneficiaries)
  const [allocations, setAllocations] = useState<Allocation[]>((cache.allocations as Allocation[]) ?? seededAllocations)
  const [foodKitsAvailable, setFoodKitsAvailable] = useState<number>((cache.foodKitsAvailable as number) ?? 380)
  const [medicineUnitsAvailable] = useState<number>((cache.medicineUnitsAvailable as number) ?? 200)
  const [ambulancesAvailable] = useState<number>((cache.ambulancesAvailable as number) ?? 5)
  const [hospitalBedsAvailable] = useState<number>((cache.hospitalBedsAvailable as number) ?? 18)
  const [approvals, setApprovals] = useState<Approval[]>((cache.approvals as Approval[]) ?? baselineApprovals)
  const [vouchers, setVouchers] = useState<Voucher[]>((cache.vouchers as Voucher[]) ?? seededVouchers)
  const [conflicts, setConflicts] = useState<Conflict[]>((cache.conflicts as Conflict[]) ?? seededConflicts)
  const [agentRuns, setAgentRuns] = useState<AgentRun[]>((cache.agentRuns as AgentRun[]) ?? baselineRuns)
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>((cache.auditEvents as AuditEvent[]) ?? seededAudit)
  const [queuedEvents, setQueuedEvents] = useState<OfflineEvent[]>((cache.queuedEvents as OfflineEvent[]) ?? [initialOfflineEvent])
  const [lastSyncAt, setLastSyncAt] = useState(String(cache.lastSyncAt ?? 'Never'))
  const [lastRoute, setLastRoute] = useState(routeRecommendation(true))
  const [lastCopilot, setLastCopilot] = useState<CopilotResponse>()
  const [lastNotice, setLastNotice] = useState<string>()
  const allocationDecision = useMemo(() => sharedAllocationDecision(allocations, beneficiaries, foodKitsAvailable, routeBlocked), [allocations, beneficiaries, foodKitsAvailable, routeBlocked])
  const currentOperationalDecision = useMemo(() => operationalDecision(allocations, beneficiaries, foodKitsAvailable, routeBlocked), [allocations, beneficiaries, foodKitsAvailable, routeBlocked])

  useEffect(() => { try { window.localStorage.setItem('resqchain-demo-cache', JSON.stringify({ role, online, beneficiaries, allocations, foodKitsAvailable, medicineUnitsAvailable, ambulancesAvailable, hospitalBedsAvailable, approvals, vouchers, conflicts, agentRuns, auditEvents, queuedEvents, lastSyncAt })) } catch { /* local persistence is best effort */ } }, [role, online, beneficiaries, allocations, foodKitsAvailable, medicineUnitsAvailable, ambulancesAvailable, hospitalBedsAvailable, approvals, vouchers, conflicts, agentRuns, auditEvents, queuedEvents, lastSyncAt])

  const recordRun = (run: AgentRun) => setAgentRuns((current) => [run, ...current])
  const appendAudit = (type: string, actor: string, detail?: string) => setAuditEvents((current) => {
    const previous = current[0]?.hash ?? 'GENESIS'
    const event = { id: `AUD-${String(current.length + 19).padStart(3, '0')}`, type, actor, timestamp: nowLabel(), status: 'Verified' as const, detail }
    return [{ ...event, hash: hashAudit(previous, event) }, ...current]
  })

  const setOnline = (next: boolean) => {
    setOnlineState(next)
    setLastNotice(next ? 'Connection restored. Review pending events before final reconciliation.' : 'Offline mode enabled. Local actions will remain queued for synchronization.')
  }

  const runTriage = () => {
    const explanation = recommendationExplanation(allocations, beneficiaries, foodKitsAvailable, routeBlocked)
    const triageScore = calculatePriorityScore({ incidentId: 'INC-DA-2026-001', camp: beneficiaries.find((item) => item.location === 'Camp Beta') ?? beneficiaries[0], resourceType: 'Medicine units', routeRisk: routeBlocked })
    const nextAction = triageNextAction(allocations, beneficiaries)
    recordRun({ id: `RUN-${Date.now()}`, agent: 'Incident Triage Rules', status: online ? 'Completed' : 'Queued offline', confidence: online ? 0.89 : 0, createdAt: nowLabel(), duration: online ? '1.4s' : '—', evidence: incidentReports.map((report) => ({ id: report.id, label: 'FIELD REPORT', detail: `${report.location} · ${report.signal}` })), summary: online ? explanation : 'Rule evaluation queued; deterministic triage context cached locally.', uncertainty: online ? 'Camp population was last updated 12 hours ago; Coastal Link remains unverified.' : 'Rules remain available offline; synchronization is required before final reconciliation.', output: { severity: 'Critical', affectedLocations: ['Camp Alpha', 'Camp Beta', 'Camp Gamma'], affectedPopulation: 612, requiredResources: ['Food kits', 'Medicine units', 'Water'], immediateRisks: ['Blocked Coastal Link', 'Limited medicine', 'Stale population count'], missingInformation: ['Latest Camp Beta registration count', 'Medicine inventory confirmation'], recommendedNextAction: nextAction, priorityScore: triageScore.score, priorityScale: `${triageScore.score}/${triageScore.maximumScore}`, priorityBreakdown: triageScore.factorBreakdown, priorityCalculation: triageScore }, requiresApproval: !online })
    if (!online) setQueuedEvents((events) => [eventFor('AGENT_REQUEST_QUEUED', 'Incident Triage Rules'), ...events])
    setLastNotice(online ? 'Incident Triage Rules completed with a generated priority matrix.' : 'Queued for synchronization — no online decision was made.')
  }

  const runAllocation = () => {
    if (!online) {
      setQueuedEvents((events) => [eventFor('AGENT_REQUEST_QUEUED', 'Resource Allocation Rules'), ...events])
      setLastNotice('Allocation analysis queued for synchronization. Existing deterministic policy remains active.')
      return
    }
    const recs = recommendAllocations(beneficiaries, foodKitsAvailable, routeBlocked)
    const explanation = recommendationExplanation([...allocations, ...recs], beneficiaries, foodKitsAvailable, routeBlocked)
    const shared = sharedAllocationDecision([...allocations, ...recs], beneficiaries, foodKitsAvailable, routeBlocked)
    const decision = operationalDecision([...allocations, ...recs], beneficiaries, foodKitsAvailable, routeBlocked)
    const enriched = recs.map((item) => ({ ...item, explanation }))
    setAllocations((current) => [...enriched, ...current.filter((item) => !enriched.some((rec) => rec.id === item.id))])
    const first = enriched[0]
    const destinationNeed = beneficiaries.find((item) => item.location === first?.destination)
    const validation = first ? validateAllocation(destinationNeed, 'Food kits', first.quantity, foodKitsAvailable, routeBlocked, allocations.filter((item) => item.resourceType === 'Food kits' && (item.status === 'Approved' || item.status === 'Delivered')).reduce((sum, item) => sum + item.quantity, 0)) : { valid: false, checks: [], warning: 'No destination with a recorded food-kit need was found.' }
    if (!first || !validation.valid) { setLastNotice(`Allocation validation warning: ${validation.warning ?? 'no valid food-kit recommendation is available.'}`); return }
    const approval: Approval = { id: `APR-${Date.now().toString().slice(-3)}`, title: `Allocate ${shared.quantity} ${shared.resourceType.toLowerCase()} to ${shared.destinationCamp}`, agent: 'Resource Allocation Rules', confidence: 0.91, evidence: allocationAgentEvidence, risk: 'Medium — preserves the emergency reserve while addressing the next-highest unmet food need.', alternatives: ['Reserve medicine and water for Camp Beta before adding another food commitment.', decision.route.explanation], status: 'Pending', createdAt: nowLabel(), explanation, scoreBreakdown: first.scoreBreakdown, priorityCalculation: first.priorityCalculation, allocationDecision: shared }
    setApprovals((current) => [approval, ...current.filter((item) => item.status === 'Pending')])
    recordRun({ id: `RUN-${Date.now()}`, agent: 'Resource Allocation Rules', status: 'Waiting for approval', confidence: 0.91, createdAt: nowLabel(), duration: '2.1s', evidence: approval.evidence, summary: explanation, uncertainty: 'Household count has not been verified in the last 2 hours.', output: { ...shared, agentLabel: 'Resource Allocation Agent', toolsCalled: allocationAgentTools, recommendation: `Allocate ${shared.quantity} food kits to ${shared.destinationCamp}`, approvalStatus: 'Pending human approval', explanation, constraintChecks: ['Food kits exist in inventory', 'Quantity available', 'Destination need recorded', 'Alternate route available', 'Approved commitments deducted', 'Emergency reserve preserved'] }, requiresApproval: true })
    setLastNotice('Recommendation generated. Human approval is required before execution.')
  }

  const approveAllocation = (id: string, comment = 'Approved after evidence review.') => {
    const approved = approvals.find((item) => item.id === id)
    const approvedQuantity = allocationDecision.quantity
    const destination = allocationDecision.destinationCamp
    setFoodKitsAvailable((current) => Math.max(0, current - approvedQuantity))
    setApprovals((current) => current.map((item) => item.id === id ? { ...item, status: 'Approved', comment } : item))
    setAllocations((current) => current.map((item) => item.id === allocationDecision.allocationId || (item.destination === destination && item.resourceType === 'Food kits') ? { ...item, status: 'Approved' } : item))
    appendAudit('ALLOCATION_APPROVED', 'A. Mensah · Coordinator', `Approved ${approvedQuantity} food kits to ${destination}. ${comment}`)
    setLastNotice('Allocation approved and audit event appended.')
  }
  const rejectApproval = (id: string, comment: string) => {
    setApprovals((current) => current.map((item) => item.id === id ? { ...item, status: 'Rejected', comment } : item))
    setAllocations((current) => current.map((item) => item.id === allocationDecision.allocationId ? { ...item, status: 'Rejected' } : item))
    appendAudit('ALLOCATION_REJECTED', 'A. Mensah · Coordinator', `Rejected ${allocationDecision.quantity} food kits to ${allocationDecision.destinationCamp}. ${comment}`)
    setLastNotice('Allocation rejected with reason recorded.')
  }
  const requestReview = (id: string, comment: string) => {
    setApprovals((current) => current.map((item) => item.id === id ? { ...item, status: 'Review requested', comment } : item))
    setLastNotice('Review requested. No operational mutation was executed.')
  }
  const toggleRoute = () => {
    setRouteBlocked((value) => !value)
    setLastNotice(routeBlocked ? 'Coastal Link reopened in the simulation.' : 'Coastal Link blocked. Re-run the Route Agent to calculate a constrained alternative.')
    appendAudit(routeBlocked ? 'ROAD_REOPENED' : 'ROAD_BLOCKED', 'A. Mensah · Coordinator')
  }
  const runRoute = () => {
    const next = routeRecommendation(routeBlocked)
    const currentDecision = operationalDecision(allocations, beneficiaries, foodKitsAvailable, routeBlocked)
    setLastRoute(next)
    recordRun({ id: `RUN-${Date.now()}`, agent: 'Route and Logistics Rules', status: 'Completed', confidence: routeBlocked ? 0.88 : 0.96, createdAt: nowLabel(), duration: '0.7s', evidence: [{ id: 'ROAD-07', label: 'ROAD', detail: routeBlocked ? 'Coastal Link status changed to blocked' : 'Coastal Link is open' }], summary: currentDecision.route.explanation, uncertainty: routeBlocked ? 'Bridge checkpoint requires field verification.' : 'No active route uncertainty.', output: { ...currentDecision.route, dataMode: 'Transparent decision rules · demonstration data' } })
    setLastNotice('Route recommendation refreshed from the constrained road graph.')
  }
  const askCopilot = (question: string) => {
    const normalized = question.toLowerCase()
    const response = normalized.includes('camp') || normalized.includes('food')
      ? { answer: `${recommendationExplanation(allocations, beneficiaries, foodKitsAvailable, routeBlocked)} Camp Beta remains the highest-risk camp overall; the food allocation is a separate resource decision.`, uncertainty: 'Household counts are based on the latest verified registration set.', evidence: [{ id: 'CAMP-BETA', label: 'CAMP', detail: 'Critical medicine and water priority' }, { id: 'ALLOC-001', label: 'ALLOCATION', detail: '120 food kits approved' }, { id: 'ROAD-07', label: 'ROAD', detail: routeBlocked ? 'Coastal Link blocked' : 'Coastal Link open' }] }
      : normalized.includes('hospital')
        ? { answer: 'District General Hospital has 18 beds available. Community Care Hospital is at 82% capacity and should receive no additional non-emergency transfers until the next capacity update.', uncertainty: 'Capacity is a coordinator-reported snapshot, not a clinical prediction.', evidence: [{ id: 'HOSP-01', label: 'HOSPITAL', detail: '18 beds available' }, { id: 'HOSP-02', label: 'HOSPITAL', detail: '82% capacity' }] }
        : normalized.includes('sync') || normalized.includes('resource')
          ? { answer: `${queuedEvents.filter((event) => event.status === 'pending').length} events are waiting for synchronization across 1 offline device. The oldest is the Camp Gamma field report from 09:04.`, uncertainty: 'Queued events have not yet passed server-side signature and idempotency checks.', evidence: [{ id: 'DEVICE-FLD-03', label: 'DEVICE', detail: 'Offline · 3 pending events' }, { id: 'EVT-991', label: 'EVENT', detail: 'Field report queued at 09:04' }] }
          : { answer: 'I can summarize the active incident, explain allocation changes, surface hospitals with capacity, or list unsynchronized resources. No action was taken.', uncertainty: 'Clarify the operational question for a narrower evidence set.', evidence: [{ id: 'RUN-104', label: 'RULE RUN', detail: 'Incident context loaded' }] }
    setLastCopilot(response)
  }

  const addBeneficiary = (input: Pick<Beneficiary, 'reference' | 'householdSize' | 'location' | 'urgency' | 'vulnerability' | 'resources'>) => {
    const beneficiary: Beneficiary = { ...input, id: `b-${Date.now()}`, verified: online, createdAt: nowLabel() }
    setBeneficiaries((current) => [beneficiary, ...current])
    const event = eventFor('BENEFICIARY_REGISTERED', `${beneficiary.reference} · ${beneficiary.location}`, online ? 'synced' : 'pending')
    setQueuedEvents((events) => online ? events : [event, ...events])
    appendAudit(online ? 'BENEFICIARY_REGISTERED' : 'BENEFICIARY_QUEUED', online ? 'Field Agent · Online' : 'Field Agent · Offline')
    setLastNotice(online ? 'Beneficiary registered and verified.' : 'Beneficiary stored locally. Queued for synchronization.')
  }
  const issueVoucher = (beneficiaryRef: string, resourceType: string, quantity: number) => {
    const voucher = createVoucher(beneficiaryRef, resourceType, quantity)
    setVouchers((current) => [voucher, ...current])
    if (!online) setQueuedEvents((events) => [eventFor('VOUCHER_ISSUED', `${voucher.id} · ${resourceType}`, 'pending'), ...events])
    appendAudit(online ? 'VOUCHER_ISSUED' : 'VOUCHER_ISSUED_OFFLINE', online ? 'Field Agent · Online' : 'Field Agent · Offline')
    setLastNotice(online ? `Voucher ${voucher.id} issued and signed.` : `Voucher ${voucher.id} signed locally. Queued for synchronization.`)
    return voucher
  }
  const redeemVoucher = (id: string) => {
    const voucher = vouchers.find((item) => item.id === id)
    if (!voucher) { setLastNotice('Voucher reference not found in the cached store.'); return }
    if (voucher.status === 'Redeemed' || voucher.status === 'Conflict') {
      const evidence = duplicateEvidence(voucher, vouchers.find((item) => item.beneficiaryRef === voucher.beneficiaryRef && item.id !== voucher.id))
      setConflicts((current) => [{ id: `CON-${Date.now().toString().slice(-3)}`, title: `Duplicate claim · ${voucher.beneficiaryRef}`, detail: 'The redemption matches an existing voucher or prior resource category in this campaign.', risk: 'High', status: 'Open', evidence }, ...current])
      recordRun({ id: `RUN-${Date.now()}`, agent: 'Duplicate Claim Rules', status: online ? 'Requires review' : 'Queued offline', confidence: online ? 0.97 : 0, createdAt: nowLabel(), duration: online ? '0.4s' : '—', evidence, summary: 'Possible duplicate detected — human review required; aid is held for coordinator review rather than denied.', uncertainty: online ? 'Identity similarity is a risk signal, not a denial decision.' : 'Live duplicate analysis will run after synchronization.', requiresApproval: true })
      setVouchers((current) => current.map((item) => item.id === id ? { ...item, status: 'Conflict' } : item))
      setLastNotice('Duplicate warning: claim held for human review. No aid was automatically denied.')
      return
    }
    setVouchers((current) => current.map((item) => item.id === id ? { ...item, status: 'Redeemed' } : item))
    if (!online) setQueuedEvents((events) => [eventFor('VOUCHER_REDEEMED', id, 'pending'), ...events])
    appendAudit(online ? 'VOUCHER_REDEEMED' : 'VOUCHER_REDEEMED_OFFLINE', online ? 'Vendor 04 · Online' : 'Vendor 04 · Offline')
    setLastNotice(online ? `${id} redeemed after signature validation.` : `${id} redeemed locally. Queued for synchronization.`)
  }
  const syncNow = () => {
    if (!online) { setLastNotice('Reconnect this device before synchronization.'); return }
    const pending = queuedEvents.filter((event) => event.status === 'pending').length
    setQueuedEvents((events) => events.map((event) => ({ ...event, status: 'synced' })))
    setLastSyncAt(nowLabel())
    appendAudit('SYNC_RECONCILED', 'Sync Service · Device FLD-03')
    setLastNotice(pending ? `${pending} events uploaded chronologically; signatures and idempotency verified.` : 'No pending events. Device is synchronized.')
  }
  const resolveConflict = (id: string) => {
    setConflicts((current) => current.map((item) => item.id === id ? { ...item, status: 'Resolved' } : item))
    setVouchers((current) => current.map((item) => item.status === 'Conflict' ? { ...item, status: 'Cancelled' } : item))
    appendAudit('CONFLICT_RESOLVED', 'A. Mensah · Coordinator')
    setLastNotice('Conflict resolved with a coordinator decision recorded in the audit chain.')
  }
  const verifyAudit = () => { setLastNotice('Audit chain verified: 18/18 hashes consistent. One queued event remains marked Warning until synchronization.') }
  const resetDemo = () => { try { window.localStorage.removeItem('resqchain-demo-cache') } catch { /* ignore storage errors */ } setBeneficiaries(seededBeneficiaries); setAllocations(seededAllocations); setFoodKitsAvailable(380); setApprovals(baselineApprovals); setVouchers(seededVouchers); setConflicts(seededConflicts); setAgentRuns(baselineRuns); setAuditEvents(seededAudit); setQueuedEvents([{ id: 'EVT-991', type: 'FIELD_REPORT_QUEUED', payload: 'Camp Gamma · 3 households require water', createdAt: '2026-10-03T09:04:00Z', status: 'pending', signature: 'sig_offline_991', idempotencyKey: 'idem_991' }]); setRouteBlocked(true); setLastRoute(routeRecommendation(true)); setLastNotice('Demo reset to the Cyclone Relief baseline.') }

  const value = useMemo<DemoState>(() => ({ role, online, activeIncident: true, routeBlocked, beneficiaries, allocations, allocationDecision, operationalDecision: currentOperationalDecision, foodKitsAvailable, medicineUnitsAvailable, ambulancesAvailable, hospitalBedsAvailable, approvals, vouchers, conflicts, agentRuns, auditEvents, queuedEvents, lastSyncAt, lastRoute, lastCopilot, lastNotice, setRole, setOnline, runTriage, runAllocation, approveAllocation, rejectApproval, requestReview, toggleRoute, runRoute, askCopilot, addBeneficiary, issueVoucher, redeemVoucher, syncNow, resolveConflict, verifyAudit, resetDemo }), [role, online, lastSyncAt, routeBlocked, beneficiaries, allocations, allocationDecision, currentOperationalDecision, foodKitsAvailable, medicineUnitsAvailable, ambulancesAvailable, hospitalBedsAvailable, approvals, vouchers, conflicts, agentRuns, auditEvents, queuedEvents, lastRoute, lastCopilot, lastNotice])
  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>
}

export function useDemo() { const context = useContext(DemoContext); if (!context) throw new Error('useDemo must be used inside DemoStateProvider'); return context }
