import type { AvailabilityAppointmentType, AvailabilityRule, CreateAvailabilityRuleInput } from '../api/availability.contract'
import { buildRuleKey } from './rules'
import { normalizeRuleTime } from './time'

export type CopyRulePayload = {
  key: string
  body: CreateAvailabilityRuleInput
}

export type CopyRulesPlan = {
  sourceType: AvailabilityAppointmentType
  targetType: AvailabilityAppointmentType
  sourceCount: number
  targetCount: number
  duplicatesCount: number
}

type DurationByType = Record<AvailabilityAppointmentType, number>

export function buildCopyRulesPlan(
  allRules: AvailabilityRule[],
  sourceType: AvailabilityAppointmentType,
  targetType: AvailabilityAppointmentType
): CopyRulesPlan {
  const sourceRules = allRules.filter(rule => rule.appointmentType === sourceType)
  const targetRules = allRules.filter(rule => rule.appointmentType === targetType)

  const targetKeys = new Set(targetRules.map(buildRuleKey))
  const duplicates = sourceRules.filter(rule => targetKeys.has(buildRuleKey(rule)))

  return {
    sourceType,
    targetType,
    sourceCount: sourceRules.length,
    targetCount: targetRules.length,
    duplicatesCount: duplicates.length
  }
}

export function buildCopyRulePayloads(options: {
  allRules: AvailabilityRule[]
  sourceType: AvailabilityAppointmentType
  targetType: AvailabilityAppointmentType
  adaptDurations: boolean
  recommendedDurations: DurationByType
}): CopyRulePayload[] {
  const { allRules, sourceType, targetType, adaptDurations, recommendedDurations } = options

  const sourceRules = allRules.filter(rule => rule.appointmentType === sourceType)

  const uniquePayloads = new Map<string, CreateAvailabilityRuleInput>()

  for (const rule of sourceRules) {
    const startTime = normalizeRuleTime(rule.startTime)
    const endTime = normalizeRuleTime(rule.endTime)
    const key = `${rule.weekday}|${startTime}|${endTime}`

    if (uniquePayloads.has(key)) continue

    uniquePayloads.set(key, {
      appointmentType: targetType,
      weekday: rule.weekday,
      startTime,
      endTime,
      slotDurationMinutes: adaptDurations ? recommendedDurations[targetType] : rule.slotDurationMinutes,
      isActive: rule.isActive
    })
  }

  return Array.from(uniquePayloads.entries()).map(([key, body]) => ({ key, body }))
}
