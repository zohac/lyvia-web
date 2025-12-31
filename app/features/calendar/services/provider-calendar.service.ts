import { apiFetch } from '../../../services/api/apiFetch'
import type {
  CancelProviderAppointmentRequest,
  CancelProviderAppointmentResponse,
  CreateProviderManualAppointmentRequest,
  CreateProviderManualAppointmentResponse,
  ListProviderAppointmentsQuery,
  ListProviderAppointmentsResponse,
  ProviderAppointmentListItem,
  UpdateProviderAppointmentRequest,
  UpdateProviderAppointmentResponse
} from '../api/calendar.contract'

export async function listProviderAppointments(
  input: ListProviderAppointmentsQuery,
  options: { signal?: AbortSignal } = {}
): Promise<ListProviderAppointmentsResponse> {
  const query = new URLSearchParams({
    from: input.from,
    to: input.to
  })
  if (input.type) query.set('type', input.type)
  if (input.status) query.set('status', input.status)

  return await apiFetch<ListProviderAppointmentsResponse>(`/provider/appointments?${query.toString()}`, {
    method: 'GET',
    signal: options.signal
  })
}

export async function createProviderManualAppointment(input: {
  idempotencyKey: string
  body: CreateProviderManualAppointmentRequest
}): Promise<CreateProviderManualAppointmentResponse> {
  return await apiFetch<CreateProviderManualAppointmentResponse>('/provider/appointments', {
    method: 'POST',
    headers: { 'Idempotency-Key': input.idempotencyKey },
    body: input.body
  })
}

export async function updateProviderAppointment(
  appointmentId: ProviderAppointmentListItem['id'],
  body: UpdateProviderAppointmentRequest
): Promise<UpdateProviderAppointmentResponse> {
  return await apiFetch<UpdateProviderAppointmentResponse>(`/provider/appointments/${appointmentId}`, {
    method: 'PATCH',
    body
  })
}

export async function cancelProviderAppointment(input: {
  appointmentId: ProviderAppointmentListItem['id']
  idempotencyKey: string
  body: CancelProviderAppointmentRequest
}): Promise<CancelProviderAppointmentResponse> {
  return await apiFetch<CancelProviderAppointmentResponse>(`/provider/appointments/${input.appointmentId}/cancel`, {
    method: 'POST',
    headers: { 'Idempotency-Key': input.idempotencyKey },
    body: input.body
  })
}
