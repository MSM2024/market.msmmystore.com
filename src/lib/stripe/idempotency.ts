const processedEvents = new Map<string, number>()
const EVENT_TTL = 24 * 60 * 60 * 1000

export function isEventProcessed(eventId: string): boolean {
  cleanup()
  return processedEvents.has(eventId)
}

export function markEventProcessed(eventId: string): void {
  processedEvents.set(eventId, Date.now())
}

export function getProcessedEventCount(): number {
  return processedEvents.size
}

function cleanup(): void {
  const now = Date.now()
  for (const [id, timestamp] of processedEvents) {
    if (now - timestamp > EVENT_TTL) {
      processedEvents.delete(id)
    }
  }
}
