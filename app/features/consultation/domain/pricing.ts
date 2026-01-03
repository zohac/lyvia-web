import type { ConsultationPricePlan } from '../api/consultation.contract'

export function sortConsultationPricePlans(plans: ConsultationPricePlan[]): ConsultationPricePlan[] {
  return plans.slice().sort((left, right) => {
    if (left.sortOrder !== right.sortOrder) return left.sortOrder - right.sortOrder
    if (left.durationMinutes !== right.durationMinutes) return left.durationMinutes - right.durationMinutes
    return left.amountCents - right.amountCents
  })
}

export function getActiveConsultationPricePlans(plans: ConsultationPricePlan[]): ConsultationPricePlan[] {
  return sortConsultationPricePlans(plans.filter(plan => plan.isActive))
}
