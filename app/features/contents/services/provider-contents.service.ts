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

export async function listMyContents(params: ListContentsParams = {}): Promise<ListContentsResponse> {
  const call = buildListContentsCall(params)
  return await apiFetch<ListContentsResponse>(call.path, {
    method: call.options.method,
    withAuth: call.options.withAuth,
    query: call.options.query
  })
}

export async function getMyContent(id: string): Promise<ContentItem> {
  const call = buildGetContentCall(id)
  return await apiFetch<ContentItem>(call.path, {
    method: call.options.method,
    withAuth: call.options.withAuth
  })
}

export async function createContent(payload: CreateContentRequest): Promise<CreateContentResponse> {
  const call = buildCreateContentCall(payload)
  return await apiFetch<CreateContentResponse>(call.path, {
    method: call.options.method,
    withAuth: call.options.withAuth,
    body: call.options.body
  })
}

export async function updateContent(
  id: string,
  payload: UpdateContentRequest
): Promise<UpdateContentResponse> {
  const call = buildUpdateContentCall(id, payload)
  return await apiFetch<UpdateContentResponse>(call.path, {
    method: call.options.method,
    withAuth: call.options.withAuth,
    body: call.options.body
  })
}

export async function publishContent(id: string): Promise<ContentIdResponse> {
  const call = buildPublishContentCall(id)
  return await apiFetch<ContentIdResponse>(call.path, {
    method: call.options.method,
    withAuth: call.options.withAuth
  })
}

export async function unpublishContent(id: string): Promise<ContentIdResponse> {
  const call = buildUnpublishContentCall(id)
  return await apiFetch<ContentIdResponse>(call.path, {
    method: call.options.method,
    withAuth: call.options.withAuth
  })
}

export async function deleteContent(id: string): Promise<ContentIdResponse> {
  const call = buildDeleteContentCall(id)
  return await apiFetch<ContentIdResponse>(call.path, {
    method: call.options.method,
    withAuth: call.options.withAuth
  })
}
