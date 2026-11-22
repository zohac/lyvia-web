import type {
  ListClientContentsParams
} from './contents.contract'

export interface ListClientContentsCall {
  path: string
  options: {
    method: 'GET'
    withAuth: true
    query: ListClientContentsParams
  }
}

export interface GetClientContentCall {
  path: string
  options: {
    method: 'GET'
    withAuth: true
  }
}

function cleanParams(params: ListClientContentsParams): ListClientContentsParams {
  const out: ListClientContentsParams = {}
  if (params.type) out.type = params.type
  if (params.q) out.q = params.q
  if (typeof params.limit === 'number') out.limit = params.limit
  if (params.cursor) out.cursor = params.cursor
  return out
}

export function buildListClientContentsCall(params: ListClientContentsParams = {}): ListClientContentsCall {
  return {
    path: '/content',
    options: { method: 'GET', withAuth: true, query: cleanParams(params) }
  }
}

export function buildGetClientContentCall(slug: string): GetClientContentCall {
  return {
    path: `/content/${encodeURIComponent(slug)}`,
    options: { method: 'GET', withAuth: true }
  }
}
