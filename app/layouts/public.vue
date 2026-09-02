<script setup lang="ts">
import '~/assets/css/main.css'

import PublicFooter from '../components/organisms/PublicFooter.vue'
import PublicHeader from '../components/organisms/PublicHeader.vue'
import { useBrandColorInjection } from '~/composables/useBrandColorInjection'

useCommonLayoutHead()
await usePublicHeaderInit()
useBrandColorInjection()

const route = useRoute()

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

const hideHeaderState = useState('hide-layout-header', () => false)
const showHeader = computed(() => publicLayout.value.hideHeader !== true && !hideHeaderState.value)
const hideFooterState = useState('hide-layout-footer', () => false)
const showFooter = computed(() => publicLayout.value.hideFooter !== true && !hideFooterState.value)
const isFullBleed = computed(() => publicLayout.value.fullBleed === true)
</script>

<template>
  <div class="min-h-[100svh] bg-[color:var(--color-surface-page)] text-[color:var(--color-text-primary)]">
    <a
      href="#main-content"
      class="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[9999] focus:rounded-lg focus:bg-[color:var(--color-brand-primary)] focus:px-4 focus:py-2 focus:text-white focus:shadow-lg"
    >
      Aller au contenu
    </a>
    <PublicHeader v-if="showHeader" />

    <main
      v-if="!isFullBleed"
      id="main-content"
      class="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6"
    >
      <slot />
    </main>
    <main
      v-else
      id="main-content"
    >
      <slot />
    </main>

    <PublicFooter v-if="showFooter" />
    <ClientOnly>
      <LazyOrganismsCookieConsentBanner />
    </ClientOnly>
  </div>
</template>
