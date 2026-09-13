<script setup lang="ts">
import { getDomainContext } from '#shared/utils/domain-context'
import {
  resolvePageTitle,
  resolvePageDescription,
  resolvePageOgImage,
  resolvePageCanonical,
  buildPageBreadcrumbs,
  formatPageNavLinks,
  adjustHomeAnchorLinks
} from '#shared/utils/page-seo-helpers'
import { ApiFetchError } from '~/services/api/api-error'
import { apiFetch } from '~/services/api/apiFetch'
import { usePublicTenantHome } from '~/composables/usePublicTenantHome'
import { usePublicPagesMenu } from '~/composables/usePublicPagesMenu'
import { setPublicHeader } from '~/features/public/state/public-header.state'
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
const { data: tenant } = await usePublicTenantHome()
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
  seoTitle?: string | null
  seoDescription?: string | null
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

// SEO, OpenGraph & Canonical
const origin = computed(() => `https://${hostname}`)
const brandName = computed(() => tenant.value?.brand.displayName?.trim() || '')

const seoTitle = computed(() => resolvePageTitle(page.value?.title || '', page.value?.seoTitle, brandName.value))
const seoDescription = computed(() => resolvePageDescription(page.value?.contentBlocks || [], page.value?.seoDescription, brandName.value, page.value?.title))
const ogImage = computed(() => resolvePageOgImage(page.value?.contentBlocks || [], undefined, '/images/keova-logo-white-label.webp', origin.value))
const canonicalUrl = computed(() => resolvePageCanonical({
  hostname,
  pageSlug,
  isWhiteLabel: true,
  platformDomain
}))

useSeoMeta({
  title: () => seoTitle.value,
  description: () => seoDescription.value,
  ogTitle: () => seoTitle.value,
  ogDescription: () => seoDescription.value,
  ogImage: () => ogImage.value,
  ogUrl: () => canonicalUrl.value,
  ogType: 'website',
  ogSiteName: () => brandName.value || undefined,
  twitterCard: 'summary_large_image'
})

usePublicCanonicalHead(canonicalUrl)

// Schema.org
const breadcrumbItems = computed(() => buildPageBreadcrumbs({
  pageTitle: page.value?.title || '',
  pageSlug,
  isWhiteLabel: true,
  origin: `https://${hostname}`,
  brandName: brandName.value || 'Accueil'
}))

useSchemaOrg([
  defineWebPage({
    name: () => page.value?.title || '',
    description: () => seoDescription.value,
    url: () => canonicalUrl.value,
    inLanguage: 'fr-FR',
    datePublished: () => page.value?.publishedAt,
    dateModified: () => page.value?.publishedAt
  }),
  defineBreadcrumb({ itemListElement: breadcrumbItems.value })
])

// Navigation
const { menuPages } = await usePublicPagesMenu()
const homeBaseLinks = [
  { label: 'Accompagnement', href: '#accompagnement' },
  { label: 'Tarifs', href: '#tarifs' },
  { label: 'Témoignages', href: '#temoignages' },
  { label: 'Qui suis-je', href: '#qui-suis-je' }
]
const adjustedHomeLinks = adjustHomeAnchorLinks(homeBaseLinks, false, '/')
const dynamicLinks = formatPageNavLinks(menuPages.value)

setPublicHeader({
  variant: 'white-label',
  layoutStyle: 'dock',
  brandLabel: brandName.value || 'Votre coach',
  brandLogoSrc: '/images/keova-logo-white-label.webp',
  brandTo: '/',
  showBrandIcon: false,
  navLinks: [...adjustedHomeLinks, ...dynamicLinks],
  loginLabel: 'Espace cliente',
  loginTo: '/login',
  ctaLabel: 'Prendre RDV',
  ctaTo: '/onboarding/discovery'
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
