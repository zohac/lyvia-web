import type {
  ContentIdResponse,
  ContentItem,
  CreateContentRequest,
  CreateContentResponse,
  ListContentsParams,
  ListContentsResponse,
  UpdateContentRequest,
  UpdateContentResponse
} from '../api/contents.contract'
import { apiFetch } from '../../../services/api/apiFetch'
import {
  buildCreateContentCall,
  buildDeleteContentCall,
  buildGetContentCall,
  buildListContentsCall,
  buildPublishContentCall,
  buildUnpublishContentCall,
  buildUpdateContentCall
} from '../api/provider-contents.request'

/**
 * Every call forwards its builder's `options` object whole. Re-listing the
 * fields here (`method: call.options.method, withAuth: …, body: …`) would make
 * this file a second, hand-maintained list: an option added to a builder would
 * be silently dropped on the way out, with a green compile.
 */
export async function listMyContents(params: ListContentsParams = {}): Promise<ListContentsResponse> {
  const call = buildListContentsCall(params)
  return await apiFetch<ListContentsResponse>(call.path, call.options)
}

export async function getMyContent(id: string): Promise<ContentItem> {
  const call = buildGetContentCall(id)
  return await apiFetch<ContentItem>(call.path, call.options)
}

export async function createContent(payload: CreateContentRequest): Promise<CreateContentResponse> {
  const call = buildCreateContentCall(payload)
  return await apiFetch<CreateContentResponse>(call.path, call.options)
}

export async function updateContent(
  id: string,
  payload: UpdateContentRequest
): Promise<UpdateContentResponse> {
  const call = buildUpdateContentCall(id, payload)
  return await apiFetch<UpdateContentResponse>(call.path, call.options)
}

export async function publishContent(id: string): Promise<ContentIdResponse> {
  const call = buildPublishContentCall(id)
  return await apiFetch<ContentIdResponse>(call.path, call.options)
}

export async function unpublishContent(id: string): Promise<ContentIdResponse> {
  const call = buildUnpublishContentCall(id)
  return await apiFetch<ContentIdResponse>(call.path, call.options)
}

export async function deleteContent(id: string): Promise<ContentIdResponse> {
  const call = buildDeleteContentCall(id)
  return await apiFetch<ContentIdResponse>(call.path, call.options)
}
