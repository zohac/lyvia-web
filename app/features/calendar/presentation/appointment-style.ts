import type { ProviderAppointmentListItem } from '../api/calendar.contract'

export function getAppointmentAccentClass(appointment: Pick<ProviderAppointmentListItem, 'type'>): string {
  if (appointment.type === 'consultation') return 'bg-[color:var(--color-brand-primary)] text-white'
  return 'bg-[color:var(--color-accent-main)] text-[color:var(--color-accent-contrast)]'
}

export function getAppointmentMetaClass(
  appointment: Pick<ProviderAppointmentListItem, 'status' | 'paymentStatus'>
): string {
  const classes: string[] = []

  if (appointment.status === 'cancelled') {
    classes.push('opacity-60')
  } else if (appointment.status === 'completed') {
    classes.push('opacity-85')
  }

  if (appointment.paymentStatus === 'paid') {
    classes.push('ring-2 ring-[color:var(--color-warning)]')
  }

  return classes.join(' ')
}

export function getAppointmentNameClass(appointment: Pick<ProviderAppointmentListItem, 'status'>): string {
  if (appointment.status === 'cancelled') return 'line-through'
  return ''
}
