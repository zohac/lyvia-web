import { apiFetch } from '../../../services/api/apiFetch'
import type { PublicProgramListItem } from '../api/programs.contract'

export async function listPublicPrograms(slug?: string): Promise<PublicProgramListItem[]> {
  const response = await apiFetch<{ programs: PublicProgramListItem[] }>('/public/programs', {
    method: 'GET',
    withAuth: false,
    ...(slug ? { query: { slug } } : {})
  })
  return response.programs
}
