<script setup lang="ts">
import PublicFooter from '../components/organisms/PublicFooter.vue'
import PublicHeader from '../components/organisms/PublicHeader.vue'

useCommonLayoutHead()

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

const showHeader = computed(() => publicLayout.value.hideHeader !== true)
const hideFooterState = useState('hide-layout-footer', () => false)
const showFooter = computed(() => publicLayout.value.hideFooter !== true && !hideFooterState.value)
const isFullBleed = computed(() => publicLayout.value.fullBleed === true)
</script>

<template>
  <div class="min-h-[100svh] bg-[#f9f8fa] text-[#221d28]">
    <a
      href="#main-content"
      class="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[9999] focus:rounded-lg focus:bg-[#5b4b6e] focus:px-4 focus:py-2 focus:text-white focus:shadow-lg"
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
  </div>
</template>
