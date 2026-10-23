<script setup lang="ts">
import type { CredentialItem } from '~/features/seo/api/public-provider-profile.contract'
import { formatCredentialMeta } from '~/features/coach/domain/credential-meta'

const props = defineProps<{
  credentials: CredentialItem[]
}>()

const prefersReducedMotion = ref(false)
onMounted(() => {
  if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    prefersReducedMotion.value = mq.matches
    const handler = (e: MediaQueryListEvent) => {
      prefersReducedMotion.value = e.matches
    }
    mq.addEventListener('change', handler)
    onBeforeUnmount(() => mq.removeEventListener('change', handler))
  }
})

const total = computed(() => props.credentials.length)
const currentIndex = ref(0)
const ariaLiveText = computed(() => `${currentIndex.value + 1} sur ${total.value}`)

const prevProps = { 'aria-label': 'Certification précédente' } as Record<string, unknown>
const nextProps = { 'aria-label': 'Certification suivante' } as Record<string, unknown>

watch(total, (t) => {
  if (currentIndex.value > Math.max(0, t - 1)) {
    currentIndex.value = Math.max(0, t - 1)
  }
})

function onCarouselSelect(index: number) {
  currentIndex.value = index
}
</script>

<template>
  <div
    class="cert-slider"
    :aria-label="`Certifications, ${total} au total`"
  >
    <UCarousel
      :items="credentials"
      :arrows="true"
      :dots="true"
      :loop="false"
      :drag-free="false"
      :watch-focus="true"
      contain-scroll="trimSnaps"
      :duration="prefersReducedMotion ? 0 : 25"
      :prev="prevProps"
      :next="nextProps"
      class="w-full"
      @select="onCarouselSelect"
    >
      <template #default="{ item }">
        <div class="px-2">
          <span
            class="inline-flex items-center gap-1.5 rounded-lg border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface-card)] px-3 py-1.5 text-xs text-[color:var(--color-brand-secondary)]"
          >
            <img
              v-if="item.logoUrl"
              :src="item.logoUrl"
              :alt="item.institution ? item.institution + ' — ' + item.title : item.title"
              class="h-4 w-auto max-w-[6rem] object-contain"
            >
            <UIcon
              v-if="item.verified"
              name="i-lucide-badge-check"
              class="size-3.5 text-[color:var(--color-brand-accent)]"
            />
            {{ item.title }}<template v-if="formatCredentialMeta(item)"> · {{ formatCredentialMeta(item) }}</template>
          </span>
        </div>
      </template>
    </UCarousel>
    <p
      class="mt-2 text-xs text-[color:var(--color-brand-secondary)]"
      aria-live="polite"
    >
      {{ ariaLiveText }}
    </p>
  </div>
</template>

<style scoped>
.cert-slider :deep([data-slot="prev"]),
.cert-slider :deep([data-slot="next"]) {
  outline: 2px solid var(--color-brand-primary);
  outline-offset: 3px;
}
@media (prefers-reduced-motion: reduce) {
  .cert-slider *,
  .cert-slider *::before,
  .cert-slider *::after {
    transition: none !important;
    animation: none !important;
  }
}
</style>
