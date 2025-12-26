<script setup lang="ts">
import { usePublicHeaderState } from '../features/public/state/public-header.state'

useHead({
  meta: [{ name: 'viewport', content: 'width=device-width, initial-scale=1' }],
  link: [{ rel: 'icon', href: '/favicon.ico' }],
  htmlAttrs: { lang: 'fr' }
})

const route = useRoute()
const headerState = usePublicHeaderState()
const currentYear = new Date().getFullYear()

type PublicLayoutMeta = {
  hideHeader?: boolean
  hideFooter?: boolean
  fullBleed?: boolean
}

const publicLayout = computed<PublicLayoutMeta>(() => {
  const value = route.meta.publicLayout
  if (!value || typeof value !== 'object') return {}
  return value as PublicLayoutMeta
})

const showHeader = computed(() => publicLayout.value.hideHeader !== true)
const showFooter = computed(() => publicLayout.value.hideFooter !== true)
const isFullBleed = computed(() => publicLayout.value.fullBleed === true)

const showNavLinks = computed(() => headerState.value.variant === 'marketing' && headerState.value.navLinks.length > 0)
const showMarketingLogoInline = computed(() => headerState.value.variant === 'marketing' && headerState.value.showBrandIcon)

const footerLine = computed(() => {
  if (headerState.value.variant === 'coach') return 'Propulsé par Kaora'
  if (headerState.value.variant === 'marketing') return 'Fait avec soin pour les pros du soin.'
  return null
})
</script>

<template>
  <div class="min-h-[100svh] bg-[color:var(--color-surface-page)] text-[color:var(--color-brand-primary)]">
    <header
      v-if="showHeader"
      class="sticky top-0 z-40 border-b border-[color:var(--color-brand-subtle)]"
    >
      <div class="glass-panel">
        <div class="mx-auto flex h-20 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
          <NuxtLink
            :to="headerState.brandTo"
            class="inline-flex items-center gap-3 transition-base"
            aria-label="Accueil"
          >
            <Icon
              v-if="showMarketingLogoInline"
              name="lucide:sparkles"
              size="18"
              class="text-[color:var(--color-brand-accent)]"
              aria-hidden="true"
            />
            <div
              v-else-if="headerState.showBrandIcon"
              class="grid h-10 w-10 place-items-center rounded-full bg-[rgba(255,255,255,0.9)] shadow-[var(--shadow-card)]"
            >
              <Icon
                name="lucide:sparkles"
                size="18"
                class="text-[color:var(--color-brand-accent)]"
                aria-hidden="true"
              />
            </div>
            <span class="font-serif text-2xl italic tracking-tight">
              {{ headerState.brandLabel }}
            </span>
          </NuxtLink>

          <nav
            v-if="showNavLinks"
            class="hidden items-center gap-8 text-sm font-semibold text-[color:var(--color-brand-muted)] md:flex"
            aria-label="Navigation"
          >
            <a
              v-for="link in headerState.navLinks"
              :key="link.href"
              :href="link.href"
              class="hover:text-[color:var(--color-brand-primary)] transition-base"
            >
              {{ link.label }}
            </a>
          </nav>

          <div class="flex items-center gap-3">
            <NuxtLink
              :to="headerState.loginTo"
              class="hidden rounded-full px-4 py-2 text-sm font-semibold text-[color:var(--color-brand-muted)] hover:text-[color:var(--color-brand-primary)] md:inline-flex transition-base"
            >
              {{ headerState.loginLabel }}
            </NuxtLink>

            <NuxtLink
              :to="headerState.ctaTo"
              class="inline-flex h-12 items-center justify-center rounded-full bg-[color:var(--color-accent-main)] px-7 text-[15px] font-bold text-[color:var(--color-accent-contrast)] shadow-[var(--shadow-floating)] transition-base hover:brightness-110 active:scale-[0.99]"
            >
              {{ headerState.ctaLabel }}
            </NuxtLink>
          </div>
        </div>
      </div>
    </header>

    <main
      v-if="!isFullBleed"
      class="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6"
    >
      <slot />
    </main>
    <slot v-else />

    <footer
      v-if="showFooter"
      class="border-t border-[color:var(--color-brand-subtle)]"
    >
      <div class="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-10 text-center text-sm text-[color:var(--color-brand-muted)] sm:px-6">
        <p class="font-semibold uppercase tracking-widest">
          © {{ currentYear }} {{ headerState.variant === 'white-label' ? headerState.brandLabel : 'Kaora' }}
        </p>
        <p v-if="footerLine">
          {{ footerLine }}
        </p>
        <NuxtLink
          :to="headerState.loginTo"
          class="font-semibold hover:underline"
        >
          {{ headerState.loginLabel }}
        </NuxtLink>
      </div>
    </footer>
  </div>
</template>
