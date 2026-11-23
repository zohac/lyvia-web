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
