import type { ProviderAppointmentListItem } from '../api/calendar.contract'
import { getYmdInTimeZone } from '../../slots/domain/slots'

export type ConflictHighlight = {
  dayKey: string
  startMinutes: number
  endMinutes: number
  appointmentId: string | null
  autoScroll: boolean
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function getZonedHourMinute(
  date: Date,
  timeZone: string,
  options: { allow24Hour?: boolean } = {}
): { hour: number, minute: number } {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23'
  }).formatToParts(date)

  const map: Record<string, string> = {}
  for (const part of parts) {
    if (part.type !== 'literal') map[part.type] = part.value
  }

  const rawHour = map.hour ?? '0'
  const parsedHour = Number(rawHour)
  const hour = rawHour === '24' && options.allow24Hour ? 24 : parsedHour
  const minute = Number(map.minute ?? '0')
  return { hour: Number.isFinite(hour) ? hour : 0, minute: Number.isFinite(minute) ? minute : 0 }
}

export function minutesSinceStartOfDayInTimeZone(
  iso: string,
  timeZone: string,
  options: { allow24Hour?: boolean } = {}
): number {
  const date = new Date(iso)
  const { hour, minute } = getZonedHourMinute(date, timeZone, options)
  const safeHour = hour === 24 && minute === 0 ? 24 : hour % 24
  const total = safeHour * 60 + minute
  return clamp(total, 0, 24 * 60)
}

export function findConflictingAppointmentId(input: {
  appointments: ProviderAppointmentListItem[]
  timeZone: string
  startAt: string
  durationMinutes: number
}): string | null {
  const targetStart = new Date(input.startAt).getTime()
  const targetEnd = targetStart + Math.max(1, input.durationMinutes) * 60_000
  const targetDayKey = getYmdInTimeZone(new Date(targetStart), input.timeZone)

  const exact = input.appointments.find(appointment => appointment.startAt === input.startAt)
  if (exact) return exact.id

  const overlapping = input.appointments.filter((appointment) => {
    const start = new Date(appointment.startAt).getTime()
    const end = new Date(appointment.endAt).getTime()
    return start < targetEnd && end > targetStart
  })

  const sameDay = overlapping.find((appointment) => {
    const key = getYmdInTimeZone(new Date(appointment.startAt), input.timeZone)
    return key === targetDayKey
  })

  return sameDay?.id ?? overlapping[0]?.id ?? null
}

export function buildConflictHighlight(input: {
  appointments: ProviderAppointmentListItem[]
  timeZone: string
  startAt: string
  durationMinutes: number
  autoScroll?: boolean
}): ConflictHighlight {
  const dayKey = getYmdInTimeZone(new Date(input.startAt), input.timeZone)
  const startMinutes = minutesSinceStartOfDayInTimeZone(input.startAt, input.timeZone)
  const endMinutes = clamp(startMinutes + Math.max(1, input.durationMinutes), 0, 24 * 60)

  return {
    dayKey,
    startMinutes,
    endMinutes,
    appointmentId: findConflictingAppointmentId({
      appointments: input.appointments,
      timeZone: input.timeZone,
      startAt: input.startAt,
      durationMinutes: input.durationMinutes
    }),
    autoScroll: input.autoScroll ?? false
  }
}
