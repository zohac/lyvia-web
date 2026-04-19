<script setup lang="ts">
import { setPublicHeader } from '~/features/public/state/public-header.state'
import { resolveB2CNavLinks } from '~/features/public/navigation/b2c-nav'
import { getDomainContext } from '#shared/utils/domain-context'
import { usePublicCanonicalHead } from '~/composables/usePublicCanonicalHead'
import {
  buildArticleSchema,
  buildArticleBreadcrumb,
  categoryBadgeClass,
  categoryLabelText,
  formatDateFr
} from '~/features/seo/articles-schema-helpers'

definePageMeta({
  layout: 'public',
  publicLayout: { fullBleed: true }
})

// Gate B2C — /articles/* uniquement sur keova.fr (convention A12/A14)
const requestUrl = useRequestURL()
const runtimeConfig = useRuntimeConfig()
const platformDomain = (runtimeConfig.public.platformDomain as string)?.toLowerCase() || 'keova.fr'
const platformDomainB2B = (runtimeConfig.public.platformDomainB2B as string)?.toLowerCase() || ''

const ctx = getDomainContext(requestUrl.hostname, platformDomain, platformDomainB2B || undefined)

if (!ctx.isB2C) {
  throw createError({ statusCode: 404, statusMessage: 'Not Found' })
}

const route = useRoute()
const slugParam = route.params.slug
const slug = Array.isArray(slugParam) ? slugParam.join('/') : String(slugParam ?? '')

if (!slug) {
  throw createError({ statusCode: 404, statusMessage: 'Not Found' })
}

const origin = `https://${ctx.hostname}`
const articlePath = `/articles/${slug}`

const { data: article } = await useAsyncData(`article-${slug}`, async () => {
  return await queryCollection('articles')
    .where('path', '=', articlePath)
    .first()
})

if (!article.value) {
  throw createError({ statusCode: 404, statusMessage: 'Article introuvable' })
}

const doc = article.value
const canonicalHref = `${origin}${articlePath}`

// Defaults alignés avec content.config.ts (defaults Zod ignorés par l'inférence TS)
const authorName = doc.author ?? 'Sophie Jouan'
const authorRole = doc.authorRole ?? 'Spécialiste accompagnement ménopause'
const authorPhoto = doc.authorPhoto ?? '/sophie_jouan.jpeg'
const authorUrl = doc.authorUrl ?? '/coach/sophie-jouan'
const relatedCoachSlug = doc.relatedCoachSlug ?? 'sophie-jouan'
const articleTags: readonly string[] = doc.tags ?? []
const articleSources: readonly { label: string, url: string }[] = doc.sources ?? []

const articleSchema = buildArticleSchema(origin, {
  slug,
  title: doc.title,
  description: doc.description,
  imageUrl: doc.image,
  category: doc.category,
  publishedAt: doc.publishedAt,
  updatedAt: doc.updatedAt,
  readingTime: doc.readingTime,
  tags: articleTags,
  author: {
    name: authorName,
    role: authorRole,
    photoUrl: authorPhoto,
    profileUrl: authorUrl
  },
  sources: articleSources
})

useSeoMeta({
  title: doc.title,
  description: doc.description,
  ogTitle: doc.title,
  ogDescription: doc.description,
  ogImage: /^https?:\/\//i.test(doc.image) ? doc.image : `${origin}${doc.image}`,
  ogUrl: canonicalHref,
  ogType: 'article',
  articleAuthor: [authorName],
  articlePublishedTime: doc.publishedAt,
  articleModifiedTime: doc.updatedAt ?? doc.publishedAt,
  articleSection: doc.category,
  twitterCard: 'summary_large_image'
})

// article:tag meta tags — injectés manuellement car unhead spread casse Rollup
if (articleTags.length > 0) {
  useHead({
    meta: articleTags.map(tag => ({ property: 'article:tag', content: tag }))
  })
}

usePublicCanonicalHead(canonicalHref)

useSchemaOrg([
  articleSchema,
  defineBreadcrumb({
    itemListElement: buildArticleBreadcrumb(origin, doc.title, slug)
  })
])

setPublicHeader({
  variant: 'marketing',
  layoutStyle: 'dock',
  brandLabel: 'Keova',
  brandTo: '/',
  showBrandIcon: true,
  navLinks: resolveB2CNavLinks({ homeAnchorsAbsolute: true }),
  loginLabel: 'Se connecter',
  loginTo: '/login',
  ctaLabel: 'Trouver une spécialiste',
  ctaTo: '/#specialistes'
})

const categoryBadge = categoryBadgeClass(doc.category)
const categoryLabel = categoryLabelText(doc.category)
const formattedDate = formatDateFr(doc.publishedAt)

// Freshness signal (Google + YMYL trust) : afficher "Mis à jour" si updatedAt > publishedAt
const hasUpdate = !!doc.updatedAt && doc.updatedAt !== doc.publishedAt
const formattedUpdateDate = hasUpdate ? formatDateFr(doc.updatedAt!) : null

const discoveryCtaTo = `/coach/${relatedCoachSlug}/onboarding/discovery`
</script>

<template>
  <main class="min-h-screen bg-[var(--color-surface-page)]">
    <!-- Clearance dock + respiration éditoriale. Container 3xl optimal pour lecture YMYL santé. -->
    <article class="mx-auto w-full max-w-3xl px-4 pt-32 pb-24 sm:px-6 sm:pt-40 sm:pb-32">
      <!-- Breadcrumb -->
      <nav
        aria-label="Fil d'ariane"
        class="mb-8 text-xs text-[var(--color-text-muted)]"
      >
        <ol class="flex items-center gap-2 flex-wrap">
          <li>
            <NuxtLink
              to="/"
              class="uppercase tracking-[0.14em] transition-colors hover:text-[var(--color-brand-primary)]"
            >
              Accueil
            </NuxtLink>
          </li>
          <li
            aria-hidden="true"
            class="text-[var(--color-text-muted)]/60"
          >
            /
          </li>
          <li>
            <NuxtLink
              to="/articles"
              class="uppercase tracking-[0.14em] transition-colors hover:text-[var(--color-brand-primary)]"
            >
              Articles
            </NuxtLink>
          </li>
          <li
            aria-hidden="true"
            class="text-[var(--color-text-muted)]/60"
          >
            /
          </li>
          <li
            class="truncate text-[var(--color-text-primary)]"
            aria-current="page"
          >
            {{ doc.title }}
          </li>
        </ol>
      </nav>

      <!-- Header article -->
      <header class="mb-10">
        <!-- Meta row (catégorie + date + lecture + mise à jour) -->
        <div class="mb-6 flex flex-wrap items-center gap-3 text-xs">
          <span
            class="inline-flex items-center rounded-full px-3 py-1 font-medium uppercase tracking-wider"
            :class="categoryBadge"
          >
            {{ categoryLabel }}
          </span>
          <time
            class="text-[var(--color-text-muted)]"
            :datetime="doc.publishedAt"
          >
            {{ formattedDate }}
          </time>
          <span
            aria-hidden="true"
            class="size-1 rounded-full bg-[var(--color-text-muted)]/40"
          />
          <span class="text-[var(--color-text-muted)]">{{ doc.readingTime }} min de lecture</span>
          <template v-if="hasUpdate">
            <span
              aria-hidden="true"
              class="size-1 rounded-full bg-[var(--color-text-muted)]/40"
            />
            <time
              class="text-[var(--color-text-muted)]"
              :datetime="doc.updatedAt"
            >
              Mis à jour le {{ formattedUpdateDate }}
            </time>
          </template>
        </div>

        <!-- Title : serif large, line-height tight, tracking serré -->
        <h1 class="mb-5 font-(family-name:--font-family-heading) text-[2.25rem] leading-[1.1] text-[var(--color-text-primary)] sm:text-[2.75rem] lg:text-[3.25rem]">
          {{ doc.title }}
        </h1>

        <!-- Lead : sans-serif, plus léger, plus grand que body -->
        <p class="text-lg leading-relaxed text-[var(--color-text-muted)] sm:text-xl">
          {{ doc.description }}
        </p>

        <!-- Auteur -->
        <div class="mt-8 flex items-center gap-4 border-t border-[var(--color-border-subtle)] pt-6">
          <NuxtImg
            :src="authorPhoto"
            :alt="authorName"
            width="56"
            height="56"
            loading="lazy"
            class="size-14 rounded-full object-cover ring-2 ring-[var(--color-crepuscule-100)] ring-offset-2 ring-offset-[var(--color-surface-page)]"
          />
          <div>
            <p class="text-sm font-semibold text-[var(--color-text-primary)]">
              <NuxtLink
                :to="authorUrl"
                class="transition-colors hover:text-[var(--color-brand-primary)]"
              >
                {{ authorName }}
              </NuxtLink>
            </p>
            <p class="text-xs text-[var(--color-text-muted)]">
              {{ authorRole }}
            </p>
          </div>
        </div>
      </header>

      <!-- Cover image — bleed mobile, rounded desktop -->
      <figure class="mb-12 -mx-4 sm:mx-0">
        <NuxtImg
          :src="doc.image"
          :alt="doc.title"
          width="1200"
          height="900"
          sizes="sm:100vw md:768px"
          loading="eager"
          class="aspect-[4/3] w-full object-cover sm:rounded-3xl"
        />
      </figure>

      <!-- Corps markdown -->
      <div
        class="prose prose-stone prose-lg max-w-none mb-16
        prose-headings:font-(family-name:--font-family-heading) prose-headings:tracking-tight
        prose-h2:text-3xl prose-h2:mt-14 prose-h2:mb-5 prose-h2:leading-tight
        prose-h3:text-xl prose-h3:mt-10 prose-h3:mb-3
        prose-p:text-[17px] prose-p:leading-[1.75] prose-p:text-[var(--color-text-primary)]
        prose-strong:text-[var(--color-text-primary)] prose-strong:font-semibold
        prose-a:text-[var(--color-brand-primary)] prose-a:font-medium prose-a:no-underline hover:prose-a:underline
        prose-ul:my-5 prose-li:my-1.5 prose-li:text-[17px] prose-li:leading-[1.75]
        prose-blockquote:border-l-[var(--color-crepuscule-300)] prose-blockquote:bg-[var(--color-crepuscule-50)]/40 prose-blockquote:rounded-r-lg prose-blockquote:py-1 prose-blockquote:px-5 prose-blockquote:italic"
      >
        <ContentRenderer :value="doc" />
      </div>

      <!-- Sources (E-E-A-T) -->
      <section
        v-if="doc.sources && doc.sources.length > 0"
        class="mb-12 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-muted)] p-6 sm:p-8"
      >
        <h2 class="mb-4 flex items-center gap-2 font-(family-name:--font-family-heading) text-lg text-[var(--color-text-primary)]">
          <UIcon
            name="i-lucide-book-marked"
            class="size-5 text-[var(--color-crepuscule-700)]"
          />
          Sources citées
        </h2>
        <ul class="space-y-2.5 text-sm">
          <li
            v-for="src in doc.sources"
            :key="src.url"
            class="flex items-start gap-2"
          >
            <span
              aria-hidden="true"
              class="mt-2 size-1 shrink-0 rounded-full bg-[var(--color-crepuscule-400)]"
            />
            <a
              :href="src.url"
              target="_blank"
              rel="noopener noreferrer"
              class="text-[var(--color-brand-primary)] underline-offset-4 hover:underline break-words"
            >
              {{ src.label }}
            </a>
          </li>
        </ul>
      </section>

      <!-- Disclaimer médical obligatoire (FR-Y9) -->
      <AtomsMedicalDisclaimer />

      <!-- CTA final — carte chaleureuse -->
      <aside class="mt-12 overflow-hidden rounded-3xl bg-gradient-to-br from-[var(--color-crepuscule-50)] via-[var(--color-crepuscule-50)] to-[var(--color-sunset-50)] p-8 sm:p-10">
        <div class="flex flex-col gap-5">
          <div class="flex items-start gap-4">
            <NuxtImg
              :src="authorPhoto"
              :alt="authorName"
              width="64"
              height="64"
              loading="lazy"
              class="size-16 rounded-full object-cover ring-2 ring-white"
            />
            <div class="flex-1">
              <p class="text-[11px] font-medium uppercase tracking-[0.2em] text-[var(--color-crepuscule-700)]">
                Un accompagnement dédié
              </p>
              <h2 class="mt-1 font-(family-name:--font-family-heading) text-2xl leading-tight text-[var(--color-text-primary)] sm:text-3xl">
                Envie d'en parler avec {{ authorName.split(' ')[0] }}&nbsp;?
              </h2>
            </div>
          </div>
          <p class="text-[var(--color-text-muted)] sm:text-lg sm:leading-relaxed">
            Un appel découverte gratuit de 15 minutes, sans engagement, pour faire le point sur votre parcours et voir si un accompagnement pourrait vous aider.
          </p>
          <div>
            <UButton
              :to="discoveryCtaTo"
              color="primary"
              size="lg"
              trailing-icon="i-lucide-arrow-right"
              class="font-semibold"
            >
              Réserver mon appel gratuit
            </UButton>
          </div>
        </div>
      </aside>

      <!-- Retour à la liste -->
      <div class="mt-12 text-center">
        <NuxtLink
          to="/articles"
          class="inline-flex items-center gap-2 text-sm font-medium text-[var(--color-brand-primary)] hover:text-[var(--color-crepuscule-800)]"
        >
          <UIcon
            name="i-lucide-arrow-left"
            class="size-4"
          />
          <span>Tous les articles</span>
        </NuxtLink>
      </div>
    </article>
  </main>
</template>
