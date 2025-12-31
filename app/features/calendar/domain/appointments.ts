import type { ProviderAppointmentListItem } from '../api/calendar.contract'
import { getYmdInTimeZone } from '../../slots/domain/slots'

function toTimestamp(value: string): number | null {
  const timestamp = new Date(value).getTime()
  return Number.isFinite(timestamp) ? timestamp : null
}

export function sortAppointmentsByStartAt(appointments: ProviderAppointmentListItem[]): ProviderAppointmentListItem[] {
  return appointments
    .slice()
    .sort((a, b) => (toTimestamp(a.startAt) ?? 0) - (toTimestamp(b.startAt) ?? 0))
}

export type AppointmentDayGroup = {
  key: string
  label: string
  appointments: ProviderAppointmentListItem[]
}

export function groupAppointmentsByLocalDay(appointments: ProviderAppointmentListItem[], timeZone: string): AppointmentDayGroup[] {
  const sorted = sortAppointmentsByStartAt(appointments)
  const formatter = new Intl.DateTimeFormat('fr-FR', { timeZone, dateStyle: 'full' })

  const byKey = new Map<string, AppointmentDayGroup>()
  for (const appointment of sorted) {
    const date = new Date(appointment.startAt)
    const key = getYmdInTimeZone(date, timeZone)
    const existing = byKey.get(key)
    if (existing) {
      existing.appointments.push(appointment)
      continue
    }
    byKey.set(key, { key, label: formatter.format(date), appointments: [appointment] })
  }

  return Array.from(byKey.values()).sort((a, b) => a.key.localeCompare(b.key))
}
