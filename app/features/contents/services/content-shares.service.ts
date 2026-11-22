import type {
  ListContentSharesResponse,
  ShareContentRequest,
  ShareContentResponse,
  UnshareContentResponse
} from '../api/contents.contract'
import { apiFetch } from '../../../services/api/apiFetch'
import {
  buildListContentSharesCall,
  buildShareContentCall,
  buildUnshareContentCall
} from '../api/content-shares.request'

export async function listContentShares(contentId: string): Promise<ListContentSharesResponse> {
  const call = buildListContentSharesCall(contentId)
  return await apiFetch<ListContentSharesResponse>(call.path, call.options)
}

export async function shareContent(
  contentId: string,
  payload: ShareContentRequest
): Promise<ShareContentResponse> {
  const call = buildShareContentCall(contentId, payload)
  return await apiFetch<ShareContentResponse>(call.path, call.options)
}

export async function unshareContent(
  contentId: string,
  clientProfileId: string
): Promise<void> {
  const call = buildUnshareContentCall(contentId, clientProfileId)
  await apiFetch<UnshareContentResponse>(call.path, call.options)
}
