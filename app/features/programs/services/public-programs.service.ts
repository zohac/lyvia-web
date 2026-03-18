import { apiFetch } from '../../../services/api/apiFetch'
import type { PublicProgramListItem } from '../api/programs.contract'

export async function listPublicPrograms(): Promise<PublicProgramListItem[]> {
  const response = await apiFetch<{ programs: PublicProgramListItem[] }>('/public/programs', {
    method: 'GET',
    withAuth: false
  })
  return response.programs
}
