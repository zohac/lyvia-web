import type { ProviderAppointmentListItem } from '../api/calendar.contract'

/**
 * Calendar event styling — Keova "Velvet Wisdom" design system.
 * Mirrors docs/design/Keova_Design_System/ui_kits/b2b (calendar-data + CalendarGrids).
 *
 * TYPE → hue (left accent bar + soft tint + softText), one hue per type:
 *   discovery → sunset · consultation → crepuscule · free_followup → success
 *
 * STATUS → corner dot (and dashed/greyed treatment for cancelled):
 *   planned (hollow violet) · done (success) · paid (gold) · cancelled (error)
 */

type AppointmentType = ProviderAppointmentListItem['type']

export type DisplayStatus = 'planned' | 'done' | 'paid' | 'cancelled'

type TypeConfig = { fill: string, soft: string, softText: string }

const TYPE_CONFIG: Record<AppointmentType, TypeConfig> = {
  discovery: { fill: 'var(--color-sunset-500)', soft: 'var(--color-sunset-100)', softText: 'var(--color-sunset-700)' },
  consultation: { fill: 'var(--color-crepuscule-500)', soft: 'var(--color-crepuscule-100)', softText: 'var(--color-crepuscule-700)' },
  free_followup: { fill: 'var(--color-success-500)', soft: 'var(--color-success-50)', softText: 'var(--color-success-600)' }
}

export function getAppointmentTypeConfig(type: AppointmentType): TypeConfig {
  return TYPE_CONFIG[type] ?? TYPE_CONFIG.consultation
}

/** Soft pill classes for type badges in drawers/modals (rounded-full, not grid chips). */
export function getAppointmentTypePillClass(type: AppointmentType): string {
  if (type === 'consultation') return 'bg-crepuscule-100 text-crepuscule-700'
  if (type === 'free_followup') return 'bg-success-100 text-success-700'
  return 'bg-sunset-100 text-sunset-700'
}

export type StatusConfig = {
  label: string
  dot: string
  chipBg: string
  chipText: string
  chipBorder: string
  hollow: boolean
}

export const STATUS_CONFIG: Record<DisplayStatus, StatusConfig> = {
  planned: {
    label: 'Planifié',
    dot: 'var(--color-crepuscule-500)',
    chipBg: 'var(--color-crepuscule-50)',
    chipText: 'var(--color-crepuscule-700)',
    chipBorder: 'var(--color-crepuscule-200)',
    hollow: true
  },
  done: {
    label: 'Terminé',
    dot: 'var(--color-success-500)',
    chipBg: 'var(--color-success-50)',
    chipText: 'var(--color-success-600)',
    chipBorder: 'var(--color-success-200)',
    hollow: false
  },
  paid: {
    label: 'Payé',
    dot: 'var(--color-gold-500)',
    chipBg: 'var(--color-gold-50)',
    chipText: 'var(--color-gold-700)',
    chipBorder: 'var(--color-gold-200)',
    hollow: false
  },
  cancelled: {
    label: 'Annulé',
    dot: 'var(--color-error-500)',
    chipBg: 'var(--color-error-50)',
    chipText: 'var(--color-error-600)',
    chipBorder: 'var(--color-error-200)',
    hollow: false
  }
}

export const STATUS_LEGEND_ORDER: DisplayStatus[] = ['planned', 'done', 'paid', 'cancelled']

/**
 * Collapse the API model (status + paymentStatus) to a single lifecycle status
 * for display: completed → done, scheduled+paid → paid (prepaid), else planned.
 */
export function getAppointmentDisplayStatus(
  appointment: Pick<ProviderAppointmentListItem, 'status' | 'paymentStatus'>
): DisplayStatus {
  if (appointment.status === 'cancelled') return 'cancelled'
  if (appointment.status === 'completed') return 'done'
  if (appointment.paymentStatus === 'paid') return 'paid'
  return 'planned'
}

type StyleObject = Record<string, string>

/** Month-grid chip: thin left accent bar + very soft tint + softText. */
export function getMonthChipStyle(
  appointment: Pick<ProviderAppointmentListItem, 'type' | 'status'>
): StyleObject {
  const t = getAppointmentTypeConfig(appointment.type)
  const cancelled = appointment.status === 'cancelled'
  return {
    borderLeft: `3px solid ${cancelled ? 'var(--color-neutral-300)' : t.fill}`,
    background: cancelled ? 'transparent' : `color-mix(in oklab, ${t.fill} 13%, #fff)`,
    color: cancelled ? 'var(--color-text-muted)' : t.softText
  }
}

/** Week/day time-grid event: 3px left bar + soft tint + matching hairline borders. */
export function getTimeEventStyle(
  appointment: Pick<ProviderAppointmentListItem, 'type' | 'status' | 'paymentStatus'>
): StyleObject {
  const t = getAppointmentTypeConfig(appointment.type)
  const st = STATUS_CONFIG[getAppointmentDisplayStatus(appointment)]
  const cancelled = appointment.status === 'cancelled'
  const hairline = cancelled
    ? `1px dashed ${st.dot}`
    : `1px solid color-mix(in oklab, ${t.fill} 22%, transparent)`
  return {
    background: cancelled ? 'var(--color-surface-card)' : `color-mix(in oklab, ${t.fill} 14%, #fff)`,
    color: cancelled ? 'var(--color-text-muted)' : t.softText,
    borderTop: hairline,
    borderRight: hairline,
    borderBottom: hairline,
    borderLeft: `3px solid ${cancelled ? st.dot : t.fill}`
  }
}

/** Status corner dot — planned reads as a hollow ring, the rest are solid. */
export function getStatusDotStyle(
  appointment: Pick<ProviderAppointmentListItem, 'status' | 'paymentStatus'>
): StyleObject {
  const status = getAppointmentDisplayStatus(appointment)
  const st = STATUS_CONFIG[status]
  return {
    background: st.dot,
    boxShadow: st.hollow ? `inset 0 0 0 1.5px #fff, 0 0 0 1px ${st.dot}` : 'none'
  }
}

export function getAppointmentNameClass(
  appointment: Pick<ProviderAppointmentListItem, 'status'>
): string {
  return appointment.status === 'cancelled' ? 'line-through' : ''
}
