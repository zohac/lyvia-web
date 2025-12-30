export type TimeSlot = {
  startAt: string
  endAt: string
}

function toTimestamp(value: string): number | null {
  const timestamp = new Date(value).getTime()
  return Number.isFinite(timestamp) ? timestamp : null
}

export function sortSlotsByStartAt<T extends TimeSlot>(slots: T[]): T[] {
  return slots
    .slice()
    .sort((a, b) => (toTimestamp(a.startAt) ?? 0) - (toTimestamp(b.startAt) ?? 0))
}

export type SlotDayGroup<T extends TimeSlot = TimeSlot> = {
  key: string
  label: string
  slots: T[]
}

export function getYmdInTimeZone(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(date)
}

export function groupSlotsByLocalDay<T extends TimeSlot>(slots: T[], timeZone: string): SlotDayGroup<T>[] {
  const sorted = sortSlotsByStartAt(slots)
  const formatter = new Intl.DateTimeFormat('fr-FR', { timeZone, dateStyle: 'full' })

  const byKey = new Map<string, SlotDayGroup<T>>()
  for (const slot of sorted) {
    const date = new Date(slot.startAt)
    const key = getYmdInTimeZone(date, timeZone)
    const existing = byKey.get(key)
    if (existing) {
      existing.slots.push(slot)
      continue
    }
    byKey.set(key, { key, label: formatter.format(date), slots: [slot] })
  }

  return Array.from(byKey.values()).sort((a, b) => a.key.localeCompare(b.key))
}
