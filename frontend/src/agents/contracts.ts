import type { AgentRun, Evidence } from '../types/models'

export interface AgentContract<TOutput extends Record<string, unknown> = Record<string, unknown>> {
  agent: string
  output: TOutput
  confidence: number
  uncertainty: string
  evidence: Evidence[]
  status: AgentRun['status']
  requiresHumanReview: boolean
  fallback: boolean
}

export const FALLBACK_COPY = 'Agent unavailable. The system is using deterministic fallback rules. Human review is required.'
