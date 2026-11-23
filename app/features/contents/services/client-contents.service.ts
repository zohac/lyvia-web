import type {
  ClientContentDetail,
  ListClientContentsParams,
  ListClientContentsResponse
} from '../api/contents.contract'
import { apiFetch } from '../../../services/api/apiFetch'
import {
  buildDownloadClientDocumentCall,
  buildGetClientContentCall,
  buildListClientContentsCall
} from '../api/client-contents.request'

export async function listAccessibleContents(
  params: ListClientContentsParams = {}
): Promise<ListClientContentsResponse> {
  const call = buildListClientContentsCall(params)
  return await apiFetch<ListClientContentsResponse>(call.path, call.options)
}

export async function getClientContentBySlug(slug: string): Promise<ClientContentDetail> {
  const call = buildGetClientContentCall(slug)
  return await apiFetch<ClientContentDetail>(call.path, call.options)
}

/**
 * Downloads the PDF attached to a readable content. The response is a stream of
 * bytes, not JSON, hence `responseType: 'blob'`; the route is authenticated, so
 * the call goes through `apiFetch` and carries the Bearer header.
 */
export async function getClientContentDocument(slug: string): Promise<Blob> {
  const call = buildDownloadClientDocumentCall(slug)
  return await apiFetch<Blob>(call.path, call.options)
}
