import { defineEventHandler, getRequestURL, sendRedirect } from 'h3'

export default defineEventHandler(async (event) => {
  const path = getRequestURL(event).pathname
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
    return sendRedirect(event, `/coach/${result.newSlug}${rest}`, 301)
  } catch {
    // 404 = no redirect needed, continue to page
  }
})
