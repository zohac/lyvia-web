<script setup lang="ts">
import { usePublicHeaderState } from '../features/public/state/public-header.state'
import PublicFooter from '../components/organisms/PublicFooter.vue'
import PublicHeader from '../components/organisms/PublicHeader.vue'

useHead({
  meta: [{ name: 'viewport', content: 'width=device-width, initial-scale=1' }],
  link: [{ rel: 'icon', href: '/favicon.ico' }],
  htmlAttrs: { lang: 'fr' }
})

const route = useRoute()
const headerState = usePublicHeaderState()

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

const isDockHeader = computed(() => headerState.value.layoutStyle === 'dock')
</script>

<template>
  <div class="min-h-[100svh] bg-[color:var(--color-surface-page)] text-[color:var(--color-brand-primary)]">
    <PublicHeader v-if="showHeader" />

    <main
      v-if="!isFullBleed"
      class="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6"
      :class="isDockHeader ? 'pt-28' : undefined"
    >
      <slot />
    </main>
    <div
      v-else
      :class="isDockHeader ? 'pt-28' : undefined"
    >
      <slot />
    </div>

    <PublicFooter v-if="showFooter" />
  </div>
</template>
