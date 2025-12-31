type ZonedDateTimeParts = {
  year: number
  month: number
  day: number
  hour: number
  minute: number
}

function toInt(value: string | undefined): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function partsToNaiveUtcMs(parts: ZonedDateTimeParts): number {
  return Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, 0, 0)
}

function getZonedDateTimeParts(date: Date, timeZone: string): ZonedDateTimeParts {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23'
  }).formatToParts(date)

  const map: Record<string, string> = {}
  for (const part of parts) {
    if (part.type !== 'literal') map[part.type] = part.value
  }

  return {
    year: toInt(map.year),
    month: toInt(map.month),
    day: toInt(map.day),
    hour: toInt(map.hour),
    minute: toInt(map.minute)
  }
}

export function minutesToHHmm(minutes: number): string {
  const clamped = Math.min(24 * 60 - 1, Math.max(0, Math.floor(minutes)))
  const hour = Math.floor(clamped / 60)
  const minute = clamped % 60
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
}

export function parseHHmm(value: string): { hour: number, minute: number } | null {
  const match = /^(\d{2}):(\d{2})$/.exec(value.trim())
  if (!match) return null
  const hour = Number(match[1])
  const minute = Number(match[2])
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return null
  if (hour < 0 || hour > 23) return null
  if (minute < 0 || minute > 59) return null
  return { hour, minute }
}

export function parseDayKey(value: string): { year: number, month: number, day: number } | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim())
  if (!match) return null
  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) return null
  if (month < 1 || month > 12) return null
  if (day < 1 || day > 31) return null
  return { year, month, day }
}

/**
 * Converts a local date-time (in `timeZone`) to a UTC ISO string.
 *
 * This function uses a bounded iteration to resolve DST offsets without extra dependencies.
 */
export function zonedLocalDateTimeToUtcIso(input: {
  dayKey: string
  time: string
  timeZone: string
}): string | null {
  const dateParts = parseDayKey(input.dayKey)
  const timeParts = parseHHmm(input.time)
  if (!dateParts || !timeParts) return null

  const desired: ZonedDateTimeParts = {
    year: dateParts.year,
    month: dateParts.month,
    day: dateParts.day,
    hour: timeParts.hour,
    minute: timeParts.minute
  }

  const desiredMs = partsToNaiveUtcMs(desired)
  let guessMs = desiredMs

  for (let i = 0; i < 6; i += 1) {
    const actual = getZonedDateTimeParts(new Date(guessMs), input.timeZone)
    const actualMs = partsToNaiveUtcMs(actual)
    const deltaMs = desiredMs - actualMs

    if (deltaMs === 0) break
    guessMs += deltaMs
  }

  return new Date(guessMs).toISOString()
}
