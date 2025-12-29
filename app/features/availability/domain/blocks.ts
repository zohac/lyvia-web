import type { AvailabilityBlock } from '../api/availability.contract'

function toTimestamp(value: string): number | null {
  const timestamp = new Date(value).getTime()
  return Number.isFinite(timestamp) ? timestamp : null
}

export function sortBlocksByStartAt(blocks: AvailabilityBlock[], now = Date.now()): AvailabilityBlock[] {
  const upcoming: AvailabilityBlock[] = []
  const past: AvailabilityBlock[] = []

  for (const block of blocks) {
    const startAt = toTimestamp(block.startAt)
    if (startAt === null) {
      past.push(block)
      continue
    }
    if (startAt >= now) {
      upcoming.push(block)
      continue
    }
    past.push(block)
  }

  const byStartAsc = (a: AvailabilityBlock, b: AvailabilityBlock) => {
    const aTime = toTimestamp(a.startAt) ?? Number.POSITIVE_INFINITY
    const bTime = toTimestamp(b.startAt) ?? Number.POSITIVE_INFINITY
    return aTime - bTime
  }

  const byStartDesc = (a: AvailabilityBlock, b: AvailabilityBlock) => {
    const aTime = toTimestamp(a.startAt) ?? Number.NEGATIVE_INFINITY
    const bTime = toTimestamp(b.startAt) ?? Number.NEGATIVE_INFINITY
    return bTime - aTime
  }

  return upcoming.slice().sort(byStartAsc).concat(past.slice().sort(byStartDesc))
}

export function formatBlockReason(reason: AvailabilityBlock['reason']): string | null {
  if (reason === null) return null
  const trimmed = reason.trim()
  return trimmed.length ? trimmed : null
}
