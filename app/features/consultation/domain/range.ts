export type AvailabilityRange = {
  from: string
  to: string
}

export function buildConsultationAvailabilityRange(days = 14): AvailabilityRange {
  const from = new Date()
  const to = new Date(Date.now() + days * 24 * 60 * 60 * 1000)
  return {
    from: from.toISOString(),
    to: to.toISOString()
  }
}
