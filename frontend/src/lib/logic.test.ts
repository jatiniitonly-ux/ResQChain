import { describe, expect, it } from 'vitest'
import { createVoucher, duplicateEvidence, operationalDecision, priorityBreakdown, priorityScore, routeRecommendation, sharedAllocationDecision, signPayload, validateAllocation } from './logic'

describe('ResQChain deterministic rules', () => {
  it('calculates transparent priority scores', () => {
    expect(priorityScore({ urgency: 'Critical', vulnerability: 'Severe' } as any)).toBe(95)
  })
  it('returns an alternate route when the coastal link is blocked', () => {
    expect(routeRecommendation(true).route).toContain('Ring Road')
    expect(routeRecommendation(true).avoided).toContain('Coastal Link')
  })
  it('keeps camp and resource priorities separate', () => {
    const beta = { location: 'Camp Beta', householdSize: 4, urgency: 'Critical', vulnerability: 'High' } as any
    const alpha = { location: 'Camp Alpha', householdSize: 6, urgency: 'High', vulnerability: 'Severe' } as any
    expect(priorityBreakdown(beta, 'Medicine units', true).label).toBe('Critical')
    expect(priorityBreakdown(beta, 'Water', true).label).toBe('Critical')
    expect(priorityBreakdown(beta, 'Food kits', true).label).toBe('High')
    expect(priorityBreakdown(alpha, 'Food kits', true).label).toBe('High')
    expect(priorityBreakdown(alpha, 'Medicine units', true).label).toBe('Medium')
    expect(priorityBreakdown(alpha, 'Water', true).label).toBe('Medium')
  })
  it('returns a stable shared calculation with an additive breakdown', () => {
    const beta = { id: 'b2', location: 'Camp Beta', householdSize: 4, urgency: 'Critical', vulnerability: 'High' } as any
    const blocked = priorityBreakdown(beta, 'Medicine units', true).calculation
    const open = priorityBreakdown(beta, 'Medicine units', false).calculation
    expect(blocked.factorBreakdown.reduce((sum, part) => sum + part.value, 0)).toBe(blocked.score)
    expect(blocked.scoringVersion).toBe('priority-v2')
    expect(blocked.score).toBeLessThan(open.score)
  })
  it('creates one shared pending allocation record for every downstream workflow', () => {
    const beneficiaries = [
      { id: 'b1', location: 'Camp Alpha', householdSize: 6, urgency: 'High', vulnerability: 'Severe' },
      { id: 'b2', location: 'Camp Beta', householdSize: 4, urgency: 'Critical', vulnerability: 'High' },
    ] as any
    const allocations = [
      { id: 'ALLOC-001', destination: 'Camp Beta', resourceType: 'Food kits', quantity: 120, priorityScore: 80, status: 'Approved' },
      { id: 'ALLOC-002', destination: 'Camp Alpha', resourceType: 'Food kits', quantity: 90, priorityScore: 83, status: 'Pending approval' },
    ] as any
    const decision = sharedAllocationDecision(allocations, beneficiaries, 380, true)
    expect(decision).toMatchObject({ allocationId: 'ALLOC-002', quantity: 90, destinationCamp: 'Camp Alpha', priorityScore: 83, selectedRoute: 'Ring Road', alternateRoute: 'Ring Road', blockedRoad: 'Coastal Link', allocationStatus: 'Pending coordinator approval', inventoryBefore: 500, inventoryAfterApproval: 290 })
    expect(decision.evidenceIds).toContain('ALLOC-002')
  })
  it('keeps overall priority, food priority, route, and inventory in one operational state', () => {
    const beneficiaries = [
      { id: 'b1', location: 'Camp Alpha', householdSize: 6, urgency: 'High', vulnerability: 'Severe' },
      { id: 'b2', location: 'Camp Beta', householdSize: 4, urgency: 'Critical', vulnerability: 'High' },
    ] as any
    const allocations = [{ id: 'ALLOC-001', destination: 'Camp Beta', resourceType: 'Food kits', quantity: 120, priorityScore: 80, status: 'Approved' }, { id: 'ALLOC-002', destination: 'Camp Alpha', resourceType: 'Food kits', quantity: 90, priorityScore: 83, status: 'Pending approval' }] as any
    const state = operationalDecision(allocations, beneficiaries, 380, true)
    expect(state.priorities.overall.score).toBe(92)
    expect(state.priorities.food?.score).toBe(83)
    expect(state.route.selectedRoute).toBe('Ring Road')
    expect(state.route.destination).toBe('Camp Beta')
    expect(state.inventory).toMatchObject({ currentStock: 380, approvedCommitments: 120, pendingAllocation: 90, afterPendingAllocation: 290, state: 'after_approved_commitments' })
  })
  it('does not deduct pending inventory until approval and preserves stock after rejection', () => {
    const beneficiaries = [{ id: 'b1', location: 'Camp Alpha', householdSize: 6, urgency: 'High', vulnerability: 'Severe' }, { id: 'b2', location: 'Camp Beta', householdSize: 4, urgency: 'Critical', vulnerability: 'High' }] as any
    const rejected = sharedAllocationDecision([{ id: 'ALLOC-001', destination: 'Camp Beta', resourceType: 'Food kits', quantity: 120, priorityScore: 80, status: 'Approved' }, { id: 'ALLOC-002', destination: 'Camp Alpha', resourceType: 'Food kits', quantity: 90, priorityScore: 83, status: 'Rejected' }] as any, beneficiaries, 380, true)
    expect(rejected).toMatchObject({ pendingCommitments: 0, inventoryAfterApproval: 380, allocationStatus: 'Rejected' })
    const approved = sharedAllocationDecision([{ id: 'ALLOC-001', destination: 'Camp Beta', resourceType: 'Food kits', quantity: 120, priorityScore: 80, status: 'Approved' }, { id: 'ALLOC-002', destination: 'Camp Alpha', resourceType: 'Food kits', quantity: 90, priorityScore: 83, status: 'Approved' }] as any, beneficiaries, 290, true)
    expect(approved).toMatchObject({ pendingCommitments: 0, inventoryAfterApproval: 290, allocationStatus: 'Approved' })
  })
  it('withholds a recommendation that breaches the emergency reserve', () => {
    const result = validateAllocation({ location: 'Camp Alpha', resources: ['Food kits'] } as any, 'Food kits', 380, 380, true)
    expect(result.valid).toBe(false)
    expect(result.warning).toMatch(/withheld/i)
  })
  it('signs a voucher without private personal data', () => {
    const voucher = createVoucher('BEN-ALPHA-014', 'Food kits', 2)
    expect(voucher.signature).toMatch(/^sig_/)
    expect(JSON.stringify(voucher)).not.toContain('phone')
    expect(signPayload(voucher)).toBe(voucher.signature)
  })
  it('provides evidence for duplicate review', () => {
    const voucher = createVoucher('BEN-ALPHA-014', 'Food kits', 2)
    expect(duplicateEvidence(voucher)).toHaveLength(2)
  })
})
