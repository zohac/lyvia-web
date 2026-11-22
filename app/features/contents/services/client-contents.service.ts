import type {
  ClientContentDetail,
  ListClientContentsParams,
  ListClientContentsResponse
} from '../api/contents.contract'
import { apiFetch } from '../../../services/api/apiFetch'
import {
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
