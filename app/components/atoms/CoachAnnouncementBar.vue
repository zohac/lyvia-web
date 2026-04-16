<script setup lang="ts">
/**
 * Y2.6 AC-7: Lead magnet announcement — slide-in notification.
 * Appears after scrolling past 30% of the page. Dismissible (sessionStorage).
 * Positioned bottom-left to avoid conflict with floating dock nav.
 */
const props = defineProps<{
  slug: string
  leadMagnetTitle: string
}>()

const storageKey = computed(() => `announcement_closed_${props.slug}`)
const isVisible = ref(false)

onMounted(() => {
  // Already dismissed this session
  if (sessionStorage.getItem(storageKey.value) === 'true') return

  const onScroll = () => {
    const scrollPercent = window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)
    if (scrollPercent > 0.3) {
      isVisible.value = true
      window.removeEventListener('scroll', onScroll)
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true })

  onUnmounted(() => {
    window.removeEventListener('scroll', onScroll)
  })
})

function dismiss() {
  isVisible.value = false
  sessionStorage.setItem(storageKey.value, 'true')
}

function scrollToCapture() {
  dismiss()
  const el = document.getElementById('lead-capture')
  if (el) {
    el.scrollIntoView({ behavior: 'smooth' })
  }
}
</script>

<template>
  <Transition
    enter-active-class="transition-all duration-500 ease-out"
    enter-from-class="translate-y-4 opacity-0"
    enter-to-class="translate-y-0 opacity-100"
    leave-active-class="transition-all duration-300 ease-in"
    leave-from-class="translate-y-0 opacity-100"
    leave-to-class="translate-y-4 opacity-0"
  >
    <div
      v-if="isVisible"
      class="fixed bottom-6 left-6 z-50 max-w-sm rounded-2xl border border-white/10 bg-[var(--color-crepuscule-950)]/95 p-5 shadow-2xl shadow-[var(--color-crepuscule-950)]/30 backdrop-blur-md"
    >
      <button
        class="absolute right-3 top-3 rounded p-1 text-white/40 transition-colors hover:text-white"
        aria-label="Fermer"
        @click="dismiss"
      >
        <UIcon
          name="i-lucide-x"
          class="size-4"
        />
      </button>

      <div class="flex items-start gap-3.5">
        <div class="grid size-10 shrink-0 place-items-center rounded-xl bg-[var(--color-brand-accent)]/15">
          <UIcon
            name="i-lucide-book-open"
            class="size-5 text-[var(--color-brand-accent)]"
          />
        </div>
        <div class="pr-4">
          <p class="text-sm font-semibold text-white">
            Guide gratuit
          </p>
          <p class="mt-1 text-xs leading-relaxed text-[var(--color-crepuscule-300)]">
            {{ leadMagnetTitle }}
          </p>
          <button
            class="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-[var(--color-brand-accent)] transition-colors hover:text-[var(--color-sunset-300)]"
            @click="scrollToCapture"
          >
            Télécharger
            <UIcon
              name="i-lucide-arrow-down"
              class="size-3.5"
            />
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>
