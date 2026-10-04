const API_BASE = import.meta.env.VITE_API_BASE ?? '/api'

export async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, { headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) }, ...init })
  if (!response.ok) throw new Error('ResQChain service request failed safely.')
  return response.json() as Promise<T>
}

export const api = {
  health: () => apiRequest<{ status: string }>('/health'),
  runAgent: (name: string, body: unknown) => apiRequest(`/agents/${name}`, { method: 'POST', body: JSON.stringify(body) }),
  sync: (events: unknown[]) => apiRequest('/sync/events', { method: 'POST', body: JSON.stringify(events) }),
}
