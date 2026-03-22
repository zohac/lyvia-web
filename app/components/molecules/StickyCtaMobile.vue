<script setup lang="ts">
const props = defineProps<{
  ctaLabel: string
  ctaTo: string
  heroCtaSelector?: string
  finalCtaSelector?: string
}>()

const isVisible = ref(false)

onMounted(() => {
  const heroEl = document.querySelector(props.heroCtaSelector ?? '[data-hero-cta]')
  const finalEl = document.querySelector(props.finalCtaSelector ?? '[data-final-cta]')

  if (!heroEl) return

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.target === heroEl) {
          // Show sticky when hero CTA leaves viewport
          isVisible.value = !entry.isIntersecting
        }
        if (entry.target === finalEl) {
          // Hide sticky when final CTA is visible
          if (entry.isIntersecting) isVisible.value = false
        }
      }
    },
    { threshold: 0 }
  )

  observer.observe(heroEl)
  if (finalEl) observer.observe(finalEl)

  onUnmounted(() => observer.disconnect())
})
</script>

<template>
  <Transition name="sticky-cta">
    <div
      v-if="isVisible"
      class="fixed inset-x-0 bottom-0 z-40 border-t border-[#ebe7ef] bg-white/95 px-4 py-3 backdrop-blur-sm md:hidden"
    >
      <ULink
        :to="ctaTo"
        class="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#d4956a] to-[#e89560] px-6 py-3.5 text-sm font-semibold text-white shadow-lg"
      >
        {{ ctaLabel }}
        <span class="transition-transform duration-300">→</span>
      </ULink>
    </div>
  </Transition>
</template>

<style scoped>
.sticky-cta-enter-active {
  transition: transform 300ms ease-out, opacity 200ms ease-out;
}

.sticky-cta-leave-active {
  transition: transform 200ms ease-in, opacity 150ms ease-in;
}

.sticky-cta-enter-from {
  transform: translateY(100%);
  opacity: 0;
}

.sticky-cta-leave-to {
  transform: translateY(100%);
  opacity: 0;
}
</style>
