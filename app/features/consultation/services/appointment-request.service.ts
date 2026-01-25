/**
 * Service for client appointment request API calls (US-2, US-3).
 *
 * Provides functions to submit cancellation and reschedule requests.
 *
 * @see appointment-request.contract.ts
 */

import { apiFetch } from '../../../services/api/apiFetch'
import type {
  RequestCancellationBody,
  RequestRescheduleBody,
  AppointmentRequestResponse
} from '../api/appointment-request.contract'

/**
 * Submit a cancellation request for an appointment.
 *
 * @param appointmentId - UUID of the appointment
 * @param body - Request payload with reason and optional details
 * @returns Promise resolving to the created request
 * @throws API errors (see AppointmentRequestErrorCode)
 */
export async function requestCancellation(
  appointmentId: string,
  body: RequestCancellationBody
): Promise<AppointmentRequestResponse> {
  return apiFetch<AppointmentRequestResponse>(
    `/client/appointments/${appointmentId}/request-cancellation`,
    {
      method: 'POST',
      body
    }
  )
}

/**
 * Submit a reschedule request for an appointment.
 *
 * @param appointmentId - UUID of the appointment
 * @param body - Request payload with reason and optional details
 * @returns Promise resolving to the created request
 * @throws API errors (see AppointmentRequestErrorCode)
 */
export async function requestReschedule(
  appointmentId: string,
  body: RequestRescheduleBody
): Promise<AppointmentRequestResponse> {
  return apiFetch<AppointmentRequestResponse>(
    `/client/appointments/${appointmentId}/request-reschedule`,
    {
      method: 'POST',
      body
    }
  )
}
