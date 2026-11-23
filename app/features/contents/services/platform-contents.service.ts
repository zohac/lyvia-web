import type {
  ListPlatformContentsResponse,
  PlatformContentApprovalResponse,
  PlatformContentItem
} from '../api/contents.contract'
import { apiFetch } from '../../../services/api/apiFetch'
import {
  buildApprovePlatformContentCall,
  buildListPlatformContentsCall,
  buildWithdrawPlatformApprovalCall
} from '../api/platform-contents.request'

export async function listPlatformContents(params: { limit?: number, cursor?: string } = {}): Promise<ListPlatformContentsResponse> {
  const call = buildListPlatformContentsCall(params)
  return await apiFetch<ListPlatformContentsResponse>(call.path, call.options)
}

export async function approvePlatformContent(id: string): Promise<PlatformContentApprovalResponse> {
  const call = buildApprovePlatformContentCall(id)
  return await apiFetch<PlatformContentApprovalResponse>(call.path, call.options)
}

export async function withdrawPlatformApproval(id: string): Promise<PlatformContentApprovalResponse> {
  const call = buildWithdrawPlatformApprovalCall(id)
  return await apiFetch<PlatformContentApprovalResponse>(call.path, call.options)
}

export type { PlatformContentItem }
