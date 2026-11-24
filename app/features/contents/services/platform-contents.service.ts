import type {
  ListPlatformContentsResponse,
  PlatformContentApprovalResponse,
  PlatformContentItem
} from '../api/contents.contract'
import { apiFetch } from '../../../services/api/apiFetch'
import {
  buildApprovePlatformContentCall,
  buildDownloadPlatformContentDocumentCall,
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

/**
 * Downloads the PDF attached to a platform article (diffusion-14). The response
 * is a stream of bytes, not JSON, hence `responseType: 'blob'`; the route is
 * authenticated, so the call goes through `apiFetch` and carries the Bearer
 * header — never a bare `href`.
 */
export async function getPlatformContentDocument(id: string): Promise<Blob> {
  const call = buildDownloadPlatformContentDocumentCall(id)
  return await apiFetch<Blob>(call.path, call.options)
}

export type { PlatformContentItem }
