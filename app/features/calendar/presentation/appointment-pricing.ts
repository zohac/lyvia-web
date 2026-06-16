import type { ProviderAppointmentListItem } from '../api/calendar.contract'
import type { ConsultationPricePlan } from '../../consultation/api/consultation.contract'

export type ConsultationPricePlanById = Record<string, ConsultationPricePlan>

export type ConsultationPricingDisplay = {
  label: string | null
  durationMinutes: number
  amountCents: number | null
  isActive: boolean | null
}

export function getConsultationPricePlan(
  appointment: Pick<ProviderAppointmentListItem, 'type' | 'pricePlanId'>,
  pricePlanById: ConsultationPricePlanById
): ConsultationPricePlan | null {
  if (appointment.type !== 'consultation') return null
  const planId = appointment.pricePlanId
  if (!planId) return null
  return pricePlanById[planId] ?? null
}

export function getConsultationPricingDisplay(
  appointment: Pick<ProviderAppointmentListItem, 'type' | 'pricePlanId' | 'durationMinutes'>,
  pricePlanById: ConsultationPricePlanById
): ConsultationPricingDisplay | null {
  if (appointment.type !== 'consultation') return null

  const plan = getConsultationPricePlan(appointment, pricePlanById)
  if (!plan) {
    return {
      label: null,
      durationMinutes: appointment.durationMinutes,
      amountCents: null,
      isActive: null
    }
  }

  return {
    label: plan.label,
    durationMinutes: plan.durationMinutes,
    amountCents: plan.amountCents,
    isActive: plan.isActive
  }
}

export function formatConsultationChipLabel(
  appointment: Pick<ProviderAppointmentListItem, 'type' | 'durationMinutes' | 'pricePlanId'>,
  pricePlanById: ConsultationPricePlanById
): string {
  if (appointment.type === 'discovery') return 'Découverte'
  if (appointment.type === 'free_followup') return 'Suivi offert'

  const plan = getConsultationPricePlan(appointment, pricePlanById)
  if (plan?.label) return plan.label

  return `Consultation — ${appointment.durationMinutes} min`
}

export function formatConsultationDrawerSummary(
  appointment: Pick<ProviderAppointmentListItem, 'type' | 'durationMinutes' | 'pricePlanId'>,
  pricePlanById: ConsultationPricePlanById
): { title: string, subtitle: string | null } | null {
  if (appointment.type !== 'consultation') return null

  const plan = getConsultationPricePlan(appointment, pricePlanById)
  if (plan) {
    return {
      title: plan.label,
      subtitle: `${plan.durationMinutes} min`
    }
  }

  return {
    title: 'Tarif indisponible',
    subtitle: `${appointment.durationMinutes} min`
  }
}

export function formatCurrency(amountCents: number, currency: 'EUR' = 'EUR'): string {
  const formatter = new Intl.NumberFormat('fr-FR', { style: 'currency', currency })
  return formatter.format(amountCents / 100)
}
