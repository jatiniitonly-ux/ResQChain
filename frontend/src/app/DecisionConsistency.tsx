import { useDemo } from './DemoState'
import { priorityMatrix, priorityBreakdown, recommendationExplanation, type ResourceType } from '../lib/logic'
import type { Beneficiary, PriorityPart } from '../types/models'

export function ResourceMetrics({ compact = false }: { compact?: boolean }) {
  const { medicineUnitsAvailable, ambulancesAvailable, hospitalBedsAvailable, operationalDecision } = useDemo()
  const metrics = [
    ['Food kits available', operationalDecision.inventory.currentStock, `food kits · after approved commitments · ${operationalDecision.inventory.pendingAllocation} pending`],
    ['Medicine units available', medicineUnitsAvailable, 'medicine units'],
    ['Ambulances available', ambulancesAvailable, 'ambulances'],
    ['Hospital beds available', hospitalBedsAvailable, 'hospital beds'],
  ] as const
  return <>{metrics.map(([label, value, unit]) => <div className="kpi kpi-default" key={label}><div className="kpi-top"><span>{label}</span></div><strong>{value}</strong><small>{unit} · current operational stock</small></div>)}</>
}

export function DecisionExplanation({ compact = false }: { compact?: boolean }) {
  const { allocations, beneficiaries, foodKitsAvailable, routeBlocked, operationalDecision } = useDemo()
  return <div className={`decision-explanation ${compact ? 'compact' : ''}`}><span className="eyebrow">DECISION CONSISTENCY</span><strong>{recommendationExplanation(allocations, beneficiaries, foodKitsAvailable, routeBlocked)}</strong><small>Gross inventory: 500 food kits · Approved commitments: {operationalDecision.inventory.approvedCommitments} food kits · Operationally available: {operationalDecision.inventory.currentStock} food kits · Pending allocation: {operationalDecision.inventory.pendingAllocation} food kits · Projected balance after approval: {operationalDecision.inventory.afterPendingAllocation} food kits · Approval status: {operationalDecision.allocation.status === 'pending' ? 'Pending coordinator approval' : operationalDecision.allocation.status}</small></div>
}

export function PriorityMatrix() {
  const { beneficiaries, routeBlocked } = useDemo()
  const rows = priorityMatrix(beneficiaries, routeBlocked)
  return <div className="priority-matrix"><div className="priority-matrix-head"><span>Camp</span><span>Medicine priority</span><span>Water priority</span><span>Food priority</span></div>{rows.slice(0, 3).map((row) => <div className="priority-matrix-row" key={row.location}><strong>{row.location}</strong>{row.priorities.map((item) => <span key={item.resourceType}><b>{item.label}</b><small>{item.total}/100</small></span>)}</div>)}</div>
}

export function PriorityBreakdown({ beneficiary, resourceType = 'Medicine units' }: { beneficiary: Beneficiary; resourceType?: ResourceType }) {
  const { routeBlocked } = useDemo()
  const breakdown = priorityBreakdown(beneficiary, resourceType, routeBlocked)
  return <div className="priority-breakdown"><div className="breakdown-total"><span>{resourceType === 'Medicine units' ? 'Medicine priority' : resourceType === 'Food kits' ? 'Food priority' : 'Water priority'}</span><strong>{breakdown.calculation.score}/{breakdown.calculation.maximumScore}</strong><b>{breakdown.label}</b></div>{breakdown.calculation.factorBreakdown.map((part) => <div className="breakdown-row" key={part.label}><span>{part.label}</span><strong>{part.value}/{part.max}</strong></div>)}<small>Scoring source: {breakdown.calculation.scoringVersion} · {breakdown.calculation.campId}</small></div>
}

export function InlineScoreBreakdown({ parts }: { parts?: PriorityPart[] }) {
  if (!parts) return null
  return <div className="inline-score-breakdown">{parts.map((part) => <span key={part.label}>{part.label}: {part.value}/{part.max}</span>)}</div>
}
