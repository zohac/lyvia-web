import type { ProviderAppointmentListItem } from '../api/calendar.contract'

export function getAppointmentAccentClass(appointment: Pick<ProviderAppointmentListItem, 'type'>): string {
  if (appointment.type === 'consultation') return 'bg-crepuscule-500 text-white'
  return 'bg-amber-500 text-amber-900'
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
    classes.push('ring-2 ring-amber-400')
  }

  return classes.join(' ')
}

export function getAppointmentNameClass(appointment: Pick<ProviderAppointmentListItem, 'status'>): string {
  if (appointment.status === 'cancelled') return 'line-through'
  return ''
}
