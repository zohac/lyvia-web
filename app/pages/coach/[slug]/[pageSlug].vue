<script setup lang="ts">
import { getDomainContext } from '#shared/utils/domain-context'
import { ApiFetchError } from '~/services/api/api-error'
import { apiFetch } from '~/services/api/apiFetch'
import PageBlockRenderer, { type ContentBlock } from '~/components/molecules/PageBlockRenderer.vue'
import type { PublicTenantResponse } from '~/features/onboarding/api/onboarding.contract'

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

// Dedicated platform coach route is strictly for platform domains
if (ctx.isWhiteLabel) {
  throw createError({ statusCode: 404, statusMessage: 'Page introuvable', fatal: true })
}

const providerSlug = computed(() => String(route.params.slug ?? '').trim())
const pageSlug = computed(() => String(route.params.pageSlug ?? '').trim())

if (!providerSlug.value || !pageSlug.value) {
  throw createError({ statusCode: 404, statusMessage: 'Page introuvable', fatal: true })
}

// Load tenant profile on platform
const { data: tenant } = await useAsyncData<PublicTenantResponse | null>(
  `public-tenant:${providerSlug.value}`,
  async () => {
    try {
      return await apiFetch<PublicTenantResponse>('/public/tenant', {
        method: 'GET',
        query: { slug: providerSlug.value }
      })
    } catch (err: unknown) {
      if (err instanceof ApiFetchError && (err.apiError?.statusCode === 404 || err.apiError?.code === 'TENANT_NOT_FOUND')) {
        throw createError({ statusCode: 404, statusMessage: 'Coach introuvable', fatal: true })
      }
      return null
    }
  }
)

if (!tenant.value) {
  throw createError({ statusCode: 404, statusMessage: 'Coach introuvable', fatal: true })
}

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
  `public-page:${providerSlug.value}:${pageSlug.value}`,
  async () => {
    try {
      return await apiFetch<PublicPageResponse>(`/public/pages/${encodeURIComponent(pageSlug.value)}`, {
        method: 'GET',
        query: {
          providerSlug: providerSlug.value
        }
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
