<script setup lang="ts">
import { getDomainContext } from '#shared/utils/domain-context'
import { ApiFetchError } from '~/services/api/api-error'
import { apiFetch } from '~/services/api/apiFetch'
import { usePublicTenantHome } from '~/composables/usePublicTenantHome'
import PageBlockRenderer, { type ContentBlock } from '~/components/molecules/PageBlockRenderer.vue'

definePageMeta({
  layout: 'public',
  publicLayout: {
    fullBleed: false
  }
})

const route = useRoute()
const requestUrl = useRequestURL()
const hostname = requestUrl.hostname.toLowerCase()

const runtimeConfig = useRuntimeConfig()
const platformDomain = (runtimeConfig.public.platformDomain as string)?.toLowerCase() || 'keova.fr'
const platformDomainB2B = (runtimeConfig.public.platformDomainB2B as string)?.toLowerCase() || ''

const ctx = getDomainContext(hostname, platformDomain, platformDomainB2B || undefined)

// On platform domain, root catch-all throws 404 (platform pages are in V3 or /coach/:slug/:pageSlug)
if (!ctx.isWhiteLabel) {
  throw createError({ statusCode: 404, statusMessage: 'Page introuvable', fatal: true })
}

// In V1, dynamic page slugs are strictly single segment
const slugParam = route.params.slug
const slugArray = Array.isArray(slugParam) ? slugParam : [slugParam]

if (slugArray.length !== 1 || !slugArray[0] || typeof slugArray[0] !== 'string' || !slugArray[0].trim()) {
  throw createError({ statusCode: 404, statusMessage: 'Page introuvable', fatal: true })
}

const pageSlug = slugArray[0].trim()

// Load tenant branding & profile context
await usePublicTenantHome()
useBrandColorInjection()

export interface PublicPageResponse {
  slug: string
  title: string
  contentBlocks: ContentBlock[]
  includeInMenu: boolean
  menuLabel: string | null
  sortOrder: number
  publishedAt: string
  version: number
}

interface ErrorWithStatus {
  statusCode?: number
  apiError?: {
    statusCode?: number
    code?: string
  }
  cause?: unknown
}

function isNotFoundError(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false
  const e = err as ErrorWithStatus
  if (e.statusCode === 404) return true
  if (e.apiError?.statusCode === 404 || e.apiError?.code === 'PAGE_NOT_FOUND' || e.apiError?.code === 'TENANT_NOT_FOUND') return true
  if (e.cause && isNotFoundError(e.cause)) return true
  return false
}

const { data: page, error } = await useAsyncData<PublicPageResponse>(
  `public-page:${pageSlug}`,
  async () => {
    try {
      return await apiFetch<PublicPageResponse>(`/public/pages/${encodeURIComponent(pageSlug)}`, {
        method: 'GET'
      })
    } catch (err: unknown) {
      if (err instanceof ApiFetchError && (err.apiError?.statusCode === 404 || err.apiError?.code === 'PAGE_NOT_FOUND' || err.apiError?.code === 'TENANT_NOT_FOUND')) {
        throw createError({ statusCode: 404, statusMessage: 'Page introuvable', fatal: true })
      }
      throw err
    }
  }
)

if (error.value) {
  if (isNotFoundError(error.value)) {
    throw createError({ statusCode: 404, statusMessage: 'Page introuvable', fatal: true })
  }
  throw error.value
}

if (!page.value) {
  throw createError({ statusCode: 404, statusMessage: 'Page introuvable', fatal: true })
}

useHead({
  title: page.value.title
})
</script>

<template>
  <div
    v-if="page"
    class="w-full max-w-4xl mx-auto py-8 sm:py-12 px-4 sm:px-6"
  >
    <header class="mb-8 sm:mb-12 text-center sm:text-left">
      <h1 class="font-heading text-3xl sm:text-4xl lg:text-5xl font-semibold text-text-primary tracking-tight">
        {{ page.title }}
      </h1>
    </header>

    <PageBlockRenderer :blocks="page.contentBlocks" />
  </div>
</template>
