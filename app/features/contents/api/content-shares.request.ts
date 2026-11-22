import type {
  ShareContentRequest
} from './contents.contract'

export interface ListContentSharesCall {
  path: string
  options: {
    method: 'GET'
    withAuth: true
  }
}

export interface ShareContentCall {
  path: string
  options: {
    method: 'POST'
    withAuth: true
    body: ShareContentRequest
  }
}

export interface UnshareContentCall {
  path: string
  options: {
    method: 'DELETE'
    withAuth: true
  }
}

export function buildListContentSharesCall(contentId: string): ListContentSharesCall {
  return {
    path: `/provider/content/${contentId}/shares`,
    options: { method: 'GET', withAuth: true }
  }
}

export function buildShareContentCall(
  contentId: string,
  payload: ShareContentRequest
): ShareContentCall {
  return {
    path: `/provider/content/${contentId}/share`,
    options: { method: 'POST', withAuth: true, body: payload }
  }
}

export function buildUnshareContentCall(
  contentId: string,
  clientProfileId: string
): UnshareContentCall {
  return {
    path: `/provider/content/${contentId}/share/${clientProfileId}`,
    options: { method: 'DELETE', withAuth: true }
  }
}
