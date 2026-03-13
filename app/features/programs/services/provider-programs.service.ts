import { apiFetch } from '../../../services/api/apiFetch'
import type {
  CreateProgramRequest,
  ProgramListResponse,
  ProgramResponse
} from '../api/programs.contract'

export async function listMyPrograms(): Promise<ProgramListResponse> {
  return await apiFetch<ProgramListResponse>('/provider/programs', {
    method: 'GET',
    withAuth: true
  })
}

export async function getMyProgram(id: string): Promise<ProgramResponse> {
  return await apiFetch<ProgramResponse>(`/provider/programs/${id}`, {
    method: 'GET',
    withAuth: true
  })
}

export async function createProgram(payload: CreateProgramRequest): Promise<ProgramResponse> {
  return await apiFetch<ProgramResponse>('/provider/programs', {
    method: 'POST',
    withAuth: true,
    body: payload
  })
}

export async function activateProgram(id: string): Promise<ProgramResponse> {
  return await apiFetch<ProgramResponse>(`/provider/programs/${id}/activate`, {
    method: 'POST',
    withAuth: true
  })
}

export async function deactivateProgram(id: string): Promise<ProgramResponse> {
  return await apiFetch<ProgramResponse>(`/provider/programs/${id}/deactivate`, {
    method: 'POST',
    withAuth: true
  })
}
