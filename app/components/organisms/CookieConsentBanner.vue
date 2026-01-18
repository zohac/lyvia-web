<script setup lang="ts">
const COOKIE_NAME = 'cookieConsent'
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365 // 12 months in seconds

const consent = useCookie<'acknowledged' | null>(COOKIE_NAME, {
  maxAge: COOKIE_MAX_AGE,
  sameSite: 'lax',
  secure: true
})

const showBanner = ref(false)

// Only show banner client-side after hydration if no consent is stored
onMounted(() => {
  if (!consent.value) {
    showBanner.value = true
  }
})

function acknowledge() {
  consent.value = 'acknowledged'
  showBanner.value = false
}
</script>

<template>
  <Transition
    enter-active-class="transition-all duration-300 ease-out"
    enter-from-class="translate-y-full opacity-0"
    enter-to-class="translate-y-0 opacity-100"
    leave-active-class="transition-all duration-200 ease-in"
    leave-from-class="translate-y-0 opacity-100"
    leave-to-class="translate-y-full opacity-0"
  >
    <div
      v-if="showBanner"
      class="fixed inset-x-0 bottom-0 z-50 p-4"
    >
      <div class="mx-auto max-w-xl rounded-[var(--radius-lg)] border border-[color:var(--color-brand-subtle)] bg-[color:var(--color-surface-card)] p-5 shadow-lg">
        <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
          <div class="flex-1">
            <p class="text-sm leading-relaxed text-[color:var(--color-brand-primary)]">
              Ce site utilise uniquement des cookies essentiels au fonctionnement du service (connexion, rendez-vous).
            </p>
            <NuxtLink
              to="/legal/confidentialite"
              class="mt-2 inline-block text-xs text-[color:var(--color-brand-muted)] underline hover:text-[color:var(--color-brand-secondary)]"
            >
              En savoir plus
            </NuxtLink>
          </div>

          <UButton
            color="primary"
            size="md"
            class="w-full justify-center sm:w-auto sm:shrink-0"
            @click="acknowledge"
          >
            Compris
          </UButton>
        </div>
      </div>
    </div>
  </Transition>
</template>
