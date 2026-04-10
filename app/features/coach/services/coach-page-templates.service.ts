import { apiFetch } from '~/services/api/apiFetch'
import type { CoachPageTemplate } from '../api/coach-page-template.contract'

export async function listCoachPageTemplates(): Promise<CoachPageTemplate[]> {
  return apiFetch<CoachPageTemplate[]>('/provider/coach-page-templates')
}
