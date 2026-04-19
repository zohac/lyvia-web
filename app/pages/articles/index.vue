<script setup lang="ts">
import { setPublicHeader } from '~/features/public/state/public-header.state'
import { resolveB2CNavLinks } from '~/features/public/navigation/b2c-nav'
import { getDomainContext } from '#shared/utils/domain-context'
import { usePublicCanonicalHead } from '~/composables/usePublicCanonicalHead'
import {
  buildArticleIndexBreadcrumb,
  categoryBadgeClass,
  categoryLabelText,
  formatDateFr
} from '~/features/seo/articles-schema-helpers'

definePageMeta({
  layout: 'public',
  publicLayout: { fullBleed: true }
})

// Gate B2C — /articles uniquement sur keova.fr (convention A12/A14)
const requestUrl = useRequestURL()
const runtimeConfig = useRuntimeConfig()
const platformDomain = (runtimeConfig.public.platformDomain as string)?.toLowerCase() || 'keova.fr'
const platformDomainB2B = (runtimeConfig.public.platformDomainB2B as string)?.toLowerCase() || ''

const ctx = getDomainContext(requestUrl.hostname, platformDomain, platformDomainB2B || undefined)

if (!ctx.isB2C) {
  throw createError({ statusCode: 404, statusMessage: 'Not Found' })
}

const origin = `https://${ctx.hostname}`
const canonicalHref = `${origin}/articles`

const { data: articles } = await useAsyncData('articles-index', async () => {
  const list = await queryCollection('articles')
    .order('publishedAt', 'DESC')
    .all()
  return list
})

useSeoMeta({
  title: 'Articles ménopause — comprendre, agir, retrouver l\'équilibre',
  description: 'Bouffées de chaleur, sommeil, humeur, poids : nos articles décryptent ce qui change à la ménopause et ce qui aide vraiment au quotidien.',
  ogTitle: 'Articles ménopause — comprendre, agir, retrouver l\'équilibre',
  ogDescription: 'Bouffées de chaleur, sommeil, humeur, poids : nos articles décryptent ce qui change à la ménopause et ce qui aide vraiment au quotidien.',
  ogImage: `${origin}/images/og-default-b2c.png`,
  ogUrl: canonicalHref,
  ogType: 'website',
  twitterCard: 'summary_large_image'
})

usePublicCanonicalHead(canonicalHref)

useSchemaOrg([
  defineBreadcrumb({
    itemListElement: buildArticleIndexBreadcrumb(origin)
  })
])

// Header marketing B2C — même nav que la homepage, ancres préfixées `/#`
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
</script>

<template>
  <main class="min-h-screen bg-[var(--color-surface-page)]">
    <!-- Hero header — clearance dock (fixed top-6, ~104px) + respiration éditoriale -->
    <section class="mx-auto w-full max-w-6xl px-4 pt-32 pb-12 sm:px-6 sm:pt-40 sm:pb-16">
      <!-- Breadcrumb léger -->
      <nav
        aria-label="Fil d'ariane"
        class="mb-8 text-xs text-[var(--color-text-muted)]"
      >
        <ol class="flex items-center gap-2">
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
          <li
            class="uppercase tracking-[0.14em] text-[var(--color-text-primary)]"
            aria-current="page"
          >
            Articles
          </li>
        </ol>
      </nav>

      <!-- Title block — éditorial, gauche alignée -->
      <div class="max-w-3xl">
        <p class="mb-4 text-[11px] font-medium uppercase tracking-[0.2em] text-[var(--color-crepuscule-700)]">
          Le journal Keova
        </p>
        <h1 class="font-(family-name:--font-family-heading) text-4xl leading-[1.1] text-[var(--color-text-primary)] sm:text-5xl lg:text-[3.5rem]">
          Comprendre la ménopause,<br>
          <span class="italic text-[var(--color-brand-primary)]">retrouver l'équilibre.</span>
        </h1>
        <p class="mt-6 text-lg leading-relaxed text-[var(--color-text-muted)] sm:text-xl">
          Ici, on prend le temps de creuser un sujet à la fois. Bouffées qui réveillent à 3h du matin, humeur qui fait des allers-retours, énergie qui s'effondre après le déjeuner&nbsp;: on explique ce qui se passe vraiment, et ce qui peut aider.
        </p>
      </div>

      <!-- Séparateur éditorial -->
      <div class="mt-12 h-px w-full bg-gradient-to-r from-[var(--color-crepuscule-200)] via-[var(--color-crepuscule-200)] to-transparent sm:mt-16" />
    </section>

    <!-- Liste articles -->
    <section class="mx-auto w-full max-w-6xl px-4 pb-24 sm:px-6 sm:pb-32">
      <div
        v-if="articles && articles.length > 0"
        class="grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3 lg:gap-x-10 lg:gap-y-16"
      >
        <article
          v-for="article in articles"
          :key="article.path"
          class="group flex flex-col"
        >
          <!-- Image -->
          <NuxtLink
            :to="article.path"
            class="relative mb-5 block overflow-hidden rounded-2xl"
          >
            <div class="aspect-[4/3] w-full overflow-hidden">
              <NuxtImg
                :src="article.image"
                :alt="article.title"
                width="720"
                height="540"
                loading="lazy"
                class="h-full w-full object-cover transition-transform duration-[600ms] ease-out group-hover:scale-[1.04]"
              />
            </div>
            <!-- Catégorie badge sur l'image -->
            <span
              class="absolute left-4 top-4 inline-flex items-center rounded-full px-3 py-1 text-[11px] font-medium uppercase tracking-wider shadow-sm backdrop-blur-md"
              :class="categoryBadgeClass(article.category)"
            >
              {{ categoryLabelText(article.category) }}
            </span>
          </NuxtLink>

          <!-- Meta -->
          <div class="mb-3 flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
            <time :datetime="article.publishedAt">
              {{ formatDateFr(article.publishedAt) }}
            </time>
            <span
              aria-hidden="true"
              class="size-1 rounded-full bg-[var(--color-text-muted)]/40"
            />
            <span>{{ article.readingTime }} min de lecture</span>
          </div>

          <!-- Title -->
          <h2 class="mb-3 font-(family-name:--font-family-heading) text-2xl leading-tight text-[var(--color-text-primary)]">
            <NuxtLink
              :to="article.path"
              class="transition-colors group-hover:text-[var(--color-brand-primary)]"
            >
              {{ article.title }}
            </NuxtLink>
          </h2>

          <!-- Summary -->
          <p class="line-clamp-3 text-[15px] leading-relaxed text-[var(--color-text-muted)]">
            {{ article.description }}
          </p>

          <!-- Read more -->
          <NuxtLink
            :to="article.path"
            class="mt-5 inline-flex items-center gap-2 text-sm font-medium text-[var(--color-brand-primary)] hover:text-[var(--color-crepuscule-800)]"
          >
            <span>Lire l'article</span>
            <UIcon
              name="i-lucide-arrow-right"
              class="size-4 transition-transform duration-300 group-hover:translate-x-1"
            />
          </NuxtLink>
        </article>
      </div>

      <!-- Empty state -->
      <div
        v-else
        class="mx-auto max-w-md py-20 text-center"
      >
        <div class="mx-auto mb-4 inline-flex size-12 items-center justify-center rounded-full bg-[var(--color-crepuscule-50)]">
          <UIcon
            name="i-lucide-book-open"
            class="size-6 text-[var(--color-crepuscule-700)]"
          />
        </div>
        <p class="text-[var(--color-text-muted)]">
          Le premier article arrive bientôt.
        </p>
      </div>
    </section>
  </main>
</template>
