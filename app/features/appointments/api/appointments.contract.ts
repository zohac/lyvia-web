/**
 * Appointments contracts (provider/admin).
 *
 * Source of truth:
 * - `repositories/lyvia-api/openapi.yaml`
 * - `repositories/lyvia-api/src/features/appointments/presentation/*`
 */

export type AppointmentStatus = 'scheduled' | 'completed' | 'cancelled'

export type DiscoveryAppointmentClient = {
  firstname: string
  lastname: string
  email: string
  phone: string
  stage: 'lead' | 'active'
}

export type DiscoveryAppointmentListItem = {
  id: string
  scheduledAt: string
  status: AppointmentStatus
  client: DiscoveryAppointmentClient
}

export type ListDiscoveryAppointmentsResponse = {
  timezone: string
  appointments: DiscoveryAppointmentListItem[]
}

export type UpdateAppointmentStatusRequest = {
  status: 'completed' | 'cancelled'
  cancelledByRole?: 'CLIENT' | 'PROVIDER' | 'SYSTEM'
  reason?: string | null
}

export type UpdateAppointmentStatusResponse = {
  updated: true
  status: 'completed' | 'cancelled'
}

export type ConvertDiscoveryToActiveClientRequest = {
  conversionNote?: string
}

export type ConvertDiscoveryToActiveClientResponse = {
  converted: true
  alreadyActive: boolean
}
