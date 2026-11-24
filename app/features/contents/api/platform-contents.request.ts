export interface ListPlatformContentsCall {
  path: string
  options: {
    method: 'GET'
    withAuth: true
    query: { limit?: number, cursor?: string }
  }
}

export interface ApprovePlatformContentCall {
  path: string
  options: {
    method: 'POST'
    withAuth: true
  }
}

export interface WithdrawPlatformApprovalCall {
  path: string
  options: {
    method: 'DELETE'
    withAuth: true
  }
}

/**
 * `GET /provider/platform-content/:id/document` streams the PDF attached to a
 * platform article (diffusion-14). Authenticated like the practitioner's own
 * document route, so it is called through `apiFetch` with the Bearer header and
 * resolved as a blob — never as a bare `href`, which would answer 401.
 */
export interface DownloadPlatformContentDocumentCall {
  path: string
  options: {
    method: 'GET'
    withAuth: true
    responseType: 'blob'
  }
}

export function buildListPlatformContentsCall(params: { limit?: number, cursor?: string } = {}): ListPlatformContentsCall {
  const query: { limit?: number, cursor?: string } = {}
  if (typeof params.limit === 'number') query.limit = params.limit
  if (params.cursor) query.cursor = params.cursor
  return {
    path: '/provider/platform-content',
    options: { method: 'GET', withAuth: true, query }
  }
}

export function buildApprovePlatformContentCall(id: string): ApprovePlatformContentCall {
  return {
    path: `/provider/platform-content/${id}/approve`,
    options: { method: 'POST', withAuth: true }
  }
}

export function buildWithdrawPlatformApprovalCall(id: string): WithdrawPlatformApprovalCall {
  return {
    path: `/provider/platform-content/${id}/approve`,
    options: { method: 'DELETE', withAuth: true }
  }
}

export function buildDownloadPlatformContentDocumentCall(id: string): DownloadPlatformContentDocumentCall {
  return {
    path: `/provider/platform-content/${encodeURIComponent(id)}/document`,
    options: { method: 'GET', withAuth: true, responseType: 'blob' }
  }
}
