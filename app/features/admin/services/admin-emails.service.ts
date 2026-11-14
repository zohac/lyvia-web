import { apiFetch } from '~/services/api/apiFetch'
import type {
  AdminEmailsActivity,
  EmailCatalogueEntry,
  SendAdminTestEmailInput,
  SendAdminTestEmailResult
} from '../api/admin-emails.contract'

export async function listAdminEmailCatalogue(): Promise<EmailCatalogueEntry[]> {
  return apiFetch<EmailCatalogueEntry[]>('/admin/emails', { method: 'GET' })
}

export async function getAdminEmailsActivity(): Promise<AdminEmailsActivity> {
  return apiFetch<AdminEmailsActivity>('/admin/emails/activity', { method: 'GET' })
}

export async function sendAdminTestEmail(
  input: SendAdminTestEmailInput
): Promise<SendAdminTestEmailResult> {
  return apiFetch<SendAdminTestEmailResult>('/admin/emails/test', {
    method: 'POST',
    body: input
  })
}
