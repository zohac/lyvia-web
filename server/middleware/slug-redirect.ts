import { defineEventHandler, getRequestURL, sendRedirect } from 'h3'

export default defineEventHandler(async (event) => {
  const url = getRequestURL(event)
  const path = url.pathname
  if (!path.startsWith('/coach/')) return

  const slug = path.split('/')[2]
  if (!slug) return

  const config = useRuntimeConfig()
  const apiBase = (config.apiBase as string) || 'http://localhost:3001'

  try {
    const result = await $fetch<{ newSlug: string }>(
      `${apiBase}/public/slug-redirect/${encodeURIComponent(slug)}`
    )
    const rest = path.slice(`/coach/${slug}`.length)
    return sendRedirect(event, `/coach/${result.newSlug}${rest}${url.search}`, 301)
  } catch (err: unknown) {
    if (
      err
      && typeof err === 'object'
      && 'statusCode' in err
      && (err as { statusCode: number }).statusCode === 404
    ) {
      return
    }
    console.warn('[slug-redirect] API error:', err)
  }
})
