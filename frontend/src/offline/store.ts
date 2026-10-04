export type LocalSyncStatus = 'pending' | 'synced' | 'conflict'
export interface LocalEvent { eventId: string; eventType: string; campaignId: string; deviceId: string; userId: string; createdAt: string; payload: unknown; idempotencyKey: string; digitalSignature: string; syncStatus: LocalSyncStatus }

const memoryQueue: LocalEvent[] = []
export const offlineStore = {
  async enqueue(event: LocalEvent) { memoryQueue.unshift(event); return event },
  async pending() { return memoryQueue.filter((event) => event.syncStatus === 'pending') },
  async markSynced(ids: string[]) { memoryQueue.forEach((event) => { if (ids.includes(event.eventId)) event.syncStatus = 'synced' }) },
  async clear() { memoryQueue.splice(0, memoryQueue.length) },
}
