import type {
  CreateContentRequest,
  ListContentsParams,
  UpdateContentRequest
} from './contents.contract'

export interface ListContentsCall {
  path: string
  options: {
    method: 'GET'
    withAuth: true
    query: ListContentsParams
  }
}

export interface GetContentCall {
  path: string
  options: {
    method: 'GET'
    withAuth: true
  }
}

export interface CreateContentCall {
  path: string
  options: {
    method: 'POST'
    withAuth: true
    body: CreateContentRequest
  }
}

export interface UpdateContentCall {
  path: string
  options: {
    method: 'PATCH'
    withAuth: true
    body: UpdateContentRequest
  }
}

export interface PublishContentCall {
  path: string
  options: {
    method: 'POST'
    withAuth: true
  }
}

export interface UnpublishContentCall {
  path: string
  options: {
    method: 'POST'
    withAuth: true
  }
}

export interface DeleteContentCall {
  path: string
  options: {
    method: 'DELETE'
    withAuth: true
  }
}

function cleanParams(params: ListContentsParams): ListContentsParams {
  const out: ListContentsParams = {}
  if (params.type) out.type = params.type
  if (params.status) out.status = params.status
  if (params.q) out.q = params.q
  if (typeof params.limit === 'number') out.limit = params.limit
  if (params.cursor) out.cursor = params.cursor
  return out
}

export function buildListContentsCall(params: ListContentsParams = {}): ListContentsCall {
  return {
    path: '/provider/content',
    options: { method: 'GET', withAuth: true, query: cleanParams(params) }
  }
}

export function buildGetContentCall(id: string): GetContentCall {
  return {
    path: `/provider/content/${id}`,
    options: { method: 'GET', withAuth: true }
  }
}

export function buildCreateContentCall(payload: CreateContentRequest): CreateContentCall {
  return {
    path: '/provider/content',
    options: { method: 'POST', withAuth: true, body: payload }
  }
}

export function buildUpdateContentCall(
  id: string,
  payload: UpdateContentRequest
): UpdateContentCall {
  return {
    path: `/provider/content/${id}`,
    options: { method: 'PATCH', withAuth: true, body: payload }
  }
}

export function buildPublishContentCall(id: string): PublishContentCall {
  return {
    path: `/provider/content/${id}/publish`,
    options: { method: 'POST', withAuth: true }
  }
}

export function buildUnpublishContentCall(id: string): UnpublishContentCall {
  return {
    path: `/provider/content/${id}/unpublish`,
    options: { method: 'POST', withAuth: true }
  }
}

export function buildDeleteContentCall(id: string): DeleteContentCall {
  return {
    path: `/provider/content/${id}`,
    options: { method: 'DELETE', withAuth: true }
  }
}
