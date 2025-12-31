export type CalendarViewMode = 'month' | 'week' | 'day'

export type CalendarRange = {
  from: string
  to: string
  view: CalendarViewMode
  anchorKey: string
}

type ZonedParts = {
  year: number
  month: number
  day: number
  hour: number
  minute: number
  second: number
}

export type CalendarWeekDay = {
  key: string
  date: Date
  label: string
}

export type CalendarMonthCell = {
  key: string
  date: Date
  dayNumber: number
  inMonth: boolean
}

function getZonedParts(date: Date, timeZone: string): ZonedParts {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    hourCycle: 'h23',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  })

  const parts = formatter.formatToParts(date)
  const map: Record<string, string> = {}
  for (const part of parts) {
    if (part.type !== 'literal') map[part.type] = part.value
  }

  return {
    year: Number(map.year),
    month: Number(map.month),
    day: Number(map.day),
    hour: map.hour === '24' ? 0 : Number(map.hour),
    minute: Number(map.minute),
    second: Number(map.second)
  }
}

function getTimeZoneOffsetMs(date: Date, timeZone: string): number {
  const zoned = getZonedParts(date, timeZone)
  const asUtc = Date.UTC(zoned.year, zoned.month - 1, zoned.day, zoned.hour, zoned.minute, zoned.second)
  return asUtc - date.getTime()
}

function toUtcTimestampFromZonedParts(parts: Omit<ZonedParts, 'second'> & { second?: number }, timeZone: string): number {
  const second = parts.second ?? 0
  let utcGuess = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, second)

  for (let i = 0; i < 3; i++) {
    const guessDate = new Date(utcGuess)
    const offset = getTimeZoneOffsetMs(guessDate, timeZone)
    const next = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, second) - offset
    if (Math.abs(next - utcGuess) < 1) break
    utcGuess = next
  }

  return utcGuess
}

function toUtcIsoFromZonedParts(parts: Omit<ZonedParts, 'second'> & { second?: number }, timeZone: string): string {
  return new Date(toUtcTimestampFromZonedParts(parts, timeZone)).toISOString()
}

function toUtcDateFromZonedParts(parts: Omit<ZonedParts, 'second'> & { second?: number }, timeZone: string): Date {
  return new Date(toUtcTimestampFromZonedParts(parts, timeZone))
}

function getIsoWeekday(date: Date, timeZone: string): number {
  const value = new Intl.DateTimeFormat('en-US', { timeZone, weekday: 'short' }).format(date)
  const map: Record<string, number> = {
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
    Sun: 7
  }
  return map[value] ?? 1
}

function shiftLocalDate(
  ymd: { year: number, month: number, day: number },
  timeZone: string,
  deltaDays: number
): { year: number, month: number, day: number } {
  const anchorUtc = toUtcTimestampFromZonedParts({ ...ymd, hour: 12, minute: 0, second: 0 }, timeZone)
  const shifted = new Date(anchorUtc + deltaDays * 24 * 60 * 60 * 1000)
  const parts = getZonedParts(shifted, timeZone)
  return { year: parts.year, month: parts.month, day: parts.day }
}

function getStartOfMonth(date: Date, timeZone: string): { year: number, month: number, day: number } {
  const parts = getZonedParts(date, timeZone)
  return { year: parts.year, month: parts.month, day: 1 }
}

function getStartOfDay(date: Date, timeZone: string): { year: number, month: number, day: number } {
  const parts = getZonedParts(date, timeZone)
  return { year: parts.year, month: parts.month, day: parts.day }
}

function getNextMonth(startOfMonth: { year: number, month: number, day: number }): { year: number, month: number, day: number } {
  const month = startOfMonth.month + 1
  if (month <= 12) return { year: startOfMonth.year, month, day: 1 }
  return { year: startOfMonth.year + 1, month: 1, day: 1 }
}

function pad2(value: number): string {
  return String(value).padStart(2, '0')
}

function getStartOfWeekYmd(anchorDate: Date, timeZone: string): { year: number, month: number, day: number } {
  const start = getStartOfDay(anchorDate, timeZone)
  const weekday = getIsoWeekday(anchorDate, timeZone)
  return shiftLocalDate(start, timeZone, -(weekday - 1))
}

export function buildWeekDays(anchorDate: Date, timeZone: string): CalendarWeekDay[] {
  const start = getStartOfWeekYmd(anchorDate, timeZone)
  const labelFormatter = new Intl.DateTimeFormat('fr-FR', {
    timeZone,
    weekday: 'short',
    day: '2-digit',
    month: 'short'
  })

  const days: CalendarWeekDay[] = []
  for (let i = 0; i < 7; i++) {
    const ymd = shiftLocalDate(start, timeZone, i)
    const date = toUtcDateFromZonedParts({ ...ymd, hour: 12, minute: 0 }, timeZone)
    const key = `${ymd.year}-${pad2(ymd.month)}-${pad2(ymd.day)}`
    days.push({ key, date, label: labelFormatter.format(date) })
  }

  return days
}

export function buildDay(anchorDate: Date, timeZone: string): CalendarWeekDay {
  const ymd = getStartOfDay(anchorDate, timeZone)
  const date = toUtcDateFromZonedParts({ ...ymd, hour: 12, minute: 0 }, timeZone)
  const key = `${ymd.year}-${pad2(ymd.month)}-${pad2(ymd.day)}`
  const labelFormatter = new Intl.DateTimeFormat('fr-FR', {
    timeZone,
    weekday: 'long',
    day: '2-digit',
    month: 'short'
  })

  return { key, date, label: labelFormatter.format(date) }
}

export function buildMonthGrid(anchorDate: Date, timeZone: string): CalendarMonthCell[] {
  const startOfMonth = getStartOfMonth(anchorDate, timeZone)
  const month = startOfMonth.month
  const startOfMonthDate = toUtcDateFromZonedParts({ ...startOfMonth, hour: 12, minute: 0 }, timeZone)
  const startOfGrid = getStartOfWeekYmd(startOfMonthDate, timeZone)

  const cells: CalendarMonthCell[] = []
  for (let i = 0; i < 42; i++) {
    const ymd = shiftLocalDate(startOfGrid, timeZone, i)
    const date = toUtcDateFromZonedParts({ ...ymd, hour: 12, minute: 0 }, timeZone)
    const key = `${ymd.year}-${pad2(ymd.month)}-${pad2(ymd.day)}`
    cells.push({
      key,
      date,
      dayNumber: ymd.day,
      inMonth: ymd.month === month
    })
  }

  return cells
}

export function shiftAnchorDate(anchorDate: Date, input: { view: CalendarViewMode, direction: -1 | 1, timeZone: string }): Date {
  const { view, direction, timeZone } = input
  const parts = getZonedParts(anchorDate, timeZone)
  const ymd = { year: parts.year, month: parts.month, day: parts.day }

  if (view === 'day') {
    const shifted = shiftLocalDate(ymd, timeZone, direction)
    return toUtcDateFromZonedParts({ ...shifted, hour: 12, minute: 0 }, timeZone)
  }

  if (view === 'week') {
    const shifted = shiftLocalDate(ymd, timeZone, direction * 7)
    return toUtcDateFromZonedParts({ ...shifted, hour: 12, minute: 0 }, timeZone)
  }

  const monthDelta = direction
  let year = ymd.year
  let month = ymd.month + monthDelta
  if (month <= 0) {
    year -= 1
    month += 12
  }
  if (month >= 13) {
    year += 1
    month -= 12
  }

  return toUtcDateFromZonedParts({ year, month, day: 1, hour: 12, minute: 0 }, timeZone)
}

export function buildCalendarRange(input: { anchorDate: Date, view: CalendarViewMode, timeZone: string }): CalendarRange {
  const { anchorDate, view, timeZone } = input

  if (view === 'day') {
    const start = getStartOfDay(anchorDate, timeZone)
    const next = shiftLocalDate(start, timeZone, 1)
    return {
      view,
      anchorKey: `${start.year}-${pad2(start.month)}-${pad2(start.day)}`,
      from: toUtcIsoFromZonedParts({ ...start, hour: 0, minute: 0 }, timeZone),
      to: toUtcIsoFromZonedParts({ ...next, hour: 0, minute: 0 }, timeZone)
    }
  }

  if (view === 'week') {
    const start = getStartOfWeekYmd(anchorDate, timeZone)
    const next = shiftLocalDate(start, timeZone, 7)
    return {
      view,
      anchorKey: `${start.year}-${pad2(start.month)}-${pad2(start.day)}`,
      from: toUtcIsoFromZonedParts({ ...start, hour: 0, minute: 0 }, timeZone),
      to: toUtcIsoFromZonedParts({ ...next, hour: 0, minute: 0 }, timeZone)
    }
  }

  const start = getStartOfMonth(anchorDate, timeZone)
  const nextMonth = getNextMonth(start)
  return {
    view,
    anchorKey: `${start.year}-${pad2(start.month)}`,
    from: toUtcIsoFromZonedParts({ ...start, hour: 0, minute: 0 }, timeZone),
    to: toUtcIsoFromZonedParts({ ...nextMonth, hour: 0, minute: 0 }, timeZone)
  }
}
