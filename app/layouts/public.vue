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
const showFooter = computed(() => publicLayout.value.hideFooter !== true)
const isFullBleed = computed(() => publicLayout.value.fullBleed === true)
</script>

<template>
  <div class="min-h-[100svh] bg-[#f9f8fa] text-[#221d28]">
    <PublicHeader v-if="showHeader" />

    <main
      v-if="!isFullBleed"
      class="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6"
    >
      <slot />
    </main>
    <div v-else>
      <slot />
    </div>

    <PublicFooter v-if="showFooter" />
  </div>
</template>
