<script setup lang="ts">
/**
 * Y2.6 AC-7: Announcement bar for lead magnet.
 * Dismissible (sessionStorage), scrolls to #lead-capture on click.
 */
const props = defineProps<{
  slug: string
  leadMagnetTitle: string
}>()

const storageKey = computed(() => `announcement_bar_closed_${props.slug}`)
const isClosed = ref(true) // start hidden, check client-side

onMounted(() => {
  isClosed.value = sessionStorage.getItem(storageKey.value) === 'true'
})

function dismiss() {
  isClosed.value = true
  sessionStorage.setItem(storageKey.value, 'true')
}

function scrollToCapture() {
  const el = document.getElementById('lead-capture')
  if (el) {
    el.scrollIntoView({ behavior: 'smooth' })
  }
}
</script>

<template>
  <div
    v-if="!isClosed"
    class="relative z-40 bg-[#5b4b6e] px-4 py-2.5 text-center text-sm text-white"
  >
    <button
      class="inline-flex items-center gap-2 transition-opacity hover:opacity-80"
      @click="scrollToCapture"
    >
      <UIcon
        name="i-lucide-gift"
        class="size-4 text-[#f0b48f]"
      />
      <span>
        Nouveau : téléchargez mon guide gratuit sur la ménopause →
      </span>
    </button>

    <button
      class="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-white/60 transition-colors hover:text-white"
      aria-label="Fermer"
      @click="dismiss"
    >
      <UIcon
        name="i-lucide-x"
        class="size-4"
      />
    </button>
  </div>
</template>
