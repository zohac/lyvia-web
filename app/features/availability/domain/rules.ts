import type { AvailabilityAppointmentType, AvailabilityRule } from '../api/availability.contract'
import { normalizeRuleTime } from './time'

export type GroupedAvailabilityRules = Array<{
  weekday: number
  groups: Array<{
    type: AvailabilityAppointmentType
    rules: AvailabilityRule[]
  }>
}>

export function buildRuleKey(rule: Pick<AvailabilityRule, 'weekday' | 'startTime' | 'endTime'>): string {
  return `${rule.weekday}|${normalizeRuleTime(rule.startTime)}|${normalizeRuleTime(rule.endTime)}`
}

export function dedupeRulesByKey(rules: AvailabilityRule[]): AvailabilityRule[] {
  const seen = new Set<string>()
  const output: AvailabilityRule[] = []

  for (const rule of rules) {
    const key = buildRuleKey(rule)
    if (seen.has(key)) continue
    seen.add(key)
    output.push(rule)
  }

  return output
}

export function groupRulesByWeekdayAndType(
  rules: AvailabilityRule[],
  order: AvailabilityAppointmentType[] = ['consultation', 'discovery']
): GroupedAvailabilityRules {
  const byDay = new Map<number, AvailabilityRule[]>()
  for (const rule of rules) {
    const current = byDay.get(rule.weekday) ?? []
    current.push(rule)
    byDay.set(rule.weekday, current)
  }

  const sortedDays = [...byDay.entries()].sort((a, b) => a[0] - b[0])

  return sortedDays.map(([weekday, dayRules]) => {
    const byType = new Map<AvailabilityAppointmentType, AvailabilityRule[]>()
    for (const rule of dayRules) {
      const current = byType.get(rule.appointmentType) ?? []
      current.push(rule)
      byType.set(rule.appointmentType, current)
    }

    const groups = order
      .filter(type => (byType.get(type)?.length ?? 0) > 0)
      .map(type => ({
        type,
        rules: (byType.get(type) ?? [])
          .slice()
          .sort((a, b) => normalizeRuleTime(a.startTime).localeCompare(normalizeRuleTime(b.startTime)))
      }))

    return { weekday, groups }
  })
}
