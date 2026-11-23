import type {
  CreateAdminContentRequest,
  ListAdminContentsParams,
  UpdateAdminContentRequest
} from './admin-contents.contract'

export interface ListAdminContentsCall {
  path: string
  options: {
    method: 'GET'
    withAuth: true
    query: ListAdminContentsParams
  }
}

export interface GetAdminContentCall {
  path: string
  options: {
    method: 'GET'
    withAuth: true
  }
}

export interface CreateAdminContentCall {
  path: string
  options: {
    method: 'POST'
    withAuth: true
    body: CreateAdminContentRequest
  }
}

export interface UpdateAdminContentCall {
  path: string
  options: {
    method: 'PATCH'
    withAuth: true
    body: UpdateAdminContentRequest
  }
}

export interface PublishAdminContentCall {
  path: string
  options: {
    method: 'POST'
    withAuth: true
  }
}

export interface UnpublishAdminContentCall {
  path: string
  options: {
    method: 'POST'
    withAuth: true
  }
}

export interface DeleteAdminContentCall {
  path: string
  options: {
    method: 'DELETE'
    withAuth: true
  }
}

/** Only the parameters the admin list endpoint actually declares are forwarded. */
function cleanParams(params: ListAdminContentsParams): ListAdminContentsParams {
  const out: ListAdminContentsParams = {}
  if (params.status) out.status = params.status
  if (typeof params.limit === 'number') out.limit = params.limit
  if (params.cursor) out.cursor = params.cursor
  return out
}

export function buildListAdminContentsCall(params: ListAdminContentsParams = {}): ListAdminContentsCall {
  return {
    path: '/admin/content',
    options: { method: 'GET', withAuth: true, query: cleanParams(params) }
  }
}

export function buildGetAdminContentCall(id: string): GetAdminContentCall {
  return {
    path: `/admin/content/${id}`,
    options: { method: 'GET', withAuth: true }
  }
}

export function buildCreateAdminContentCall(payload: CreateAdminContentRequest): CreateAdminContentCall {
  return {
    path: '/admin/content',
    options: { method: 'POST', withAuth: true, body: payload }
  }
}

export function buildUpdateAdminContentCall(
  id: string,
  payload: UpdateAdminContentRequest
): UpdateAdminContentCall {
  return {
    path: `/admin/content/${id}`,
    options: { method: 'PATCH', withAuth: true, body: payload }
  }
}

export function buildPublishAdminContentCall(id: string): PublishAdminContentCall {
  return {
    path: `/admin/content/${id}/publish`,
    options: { method: 'POST', withAuth: true }
  }
}

export function buildUnpublishAdminContentCall(id: string): UnpublishAdminContentCall {
  return {
    path: `/admin/content/${id}/unpublish`,
    options: { method: 'POST', withAuth: true }
  }
}

export function buildDeleteAdminContentCall(id: string): DeleteAdminContentCall {
  return {
    path: `/admin/content/${id}`,
    options: { method: 'DELETE', withAuth: true }
  }
}
