import type {
  AdminContentIdResponse,
  AdminContentItem,
  CreateAdminContentRequest,
  CreateAdminContentResponse,
  ListAdminContentsParams,
  ListAdminContentsResponse,
  PublishAdminContentResponse,
  UnpublishAdminContentResponse,
  UpdateAdminContentRequest,
  UpdateAdminContentResponse
} from '../api/admin-contents.contract'
import { apiFetch } from '../../../services/api/apiFetch'
import {
  buildCreateAdminContentCall,
  buildDeleteAdminContentCall,
  buildGetAdminContentCall,
  buildListAdminContentsCall,
  buildPublishAdminContentCall,
  buildUnpublishAdminContentCall,
  buildUpdateAdminContentCall
} from '../api/admin-contents.request'

export { ADMIN_CONTENT_UPLOAD_ENDPOINT } from '../api/admin-contents.contract'

/**
 * Same discipline as the provider content service: each builder's `options`
 * object is forwarded whole. Re-listing its fields here would create a second,
 * hand-maintained list where a new option is silently dropped on the wire.
 */
export async function listAdminContents(
  params: ListAdminContentsParams = {}
): Promise<ListAdminContentsResponse> {
  const call = buildListAdminContentsCall(params)
  return await apiFetch<ListAdminContentsResponse>(call.path, call.options)
}

export async function getAdminContent(id: string): Promise<AdminContentItem> {
  const call = buildGetAdminContentCall(id)
  return await apiFetch<AdminContentItem>(call.path, call.options)
}

export async function createAdminContent(
  payload: CreateAdminContentRequest
): Promise<CreateAdminContentResponse> {
  const call = buildCreateAdminContentCall(payload)
  return await apiFetch<CreateAdminContentResponse>(call.path, call.options)
}

export async function updateAdminContent(
  id: string,
  payload: UpdateAdminContentRequest
): Promise<UpdateAdminContentResponse> {
  const call = buildUpdateAdminContentCall(id, payload)
  return await apiFetch<UpdateAdminContentResponse>(call.path, call.options)
}

export async function publishAdminContent(
  id: string
): Promise<PublishAdminContentResponse> {
  const call = buildPublishAdminContentCall(id)
  return await apiFetch<PublishAdminContentResponse>(call.path, call.options)
}

export async function unpublishAdminContent(
  id: string
): Promise<UnpublishAdminContentResponse> {
  const call = buildUnpublishAdminContentCall(id)
  return await apiFetch<UnpublishAdminContentResponse>(call.path, call.options)
}

export async function deleteAdminContent(id: string): Promise<AdminContentIdResponse> {
  const call = buildDeleteAdminContentCall(id)
  return await apiFetch<AdminContentIdResponse>(call.path, call.options)
}
