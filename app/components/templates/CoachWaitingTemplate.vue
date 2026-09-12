<script setup lang="ts">
import type { PublicTenantResponse } from '~/features/onboarding/api/onboarding.contract'

const props = defineProps<{
  tenant?: PublicTenantResponse | null
  coachName?: string
}>()

const resolvedCoachName = computed(() => {
  if (props.coachName) return props.coachName
  if (props.tenant?.brand?.displayName) return props.tenant.brand.displayName
  return 'votre coach'
})

const legalEmail = computed(() => props.tenant?.legalInfo?.email || null)
const companyName = computed(() => props.tenant?.legalInfo?.companyName || null)
const currentYear = new Date().getFullYear()
</script>

<template>
  <div class="relative flex min-h-[85vh] flex-col items-center justify-between px-6 py-16 text-center">
    <div class="my-auto mx-auto max-w-lg">
      <!-- Icon with soft warm pulse glow -->
      <div class="relative mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-3xl bg-[color:var(--color-crepuscule-100)] shadow-sm">
        <div class="absolute inset-0 rounded-3xl bg-[color:var(--color-crepuscule-200)]/40 animate-pulse" />
        <UIcon
          name="lucide:sparkles"
          size="44"
          class="relative text-[color:var(--color-crepuscule-700)]"
        />
      </div>

      <!-- Main Headline -->
      <h1 class="font-serif text-3xl sm:text-4xl italic text-[color:var(--color-brand-primary)] leading-tight">
        Le site de {{ resolvedCoachName }} est en cours de préparation
      </h1>

      <!-- Informative Subtitle -->
      <p class="mt-5 text-lg text-[color:var(--color-brand-secondary)] font-normal leading-relaxed">
        Nous finalisons les derniers détails pour vous accueillir très prochainement dans les meilleures conditions.
      </p>

      <!-- Contact options if email provided -->
      <div
        v-if="legalEmail"
        class="mt-10 inline-flex flex-col sm:flex-row items-center justify-center gap-3 rounded-2xl border border-[color:var(--color-border-subtle)] bg-[color:var(--color-crepuscule-50)]/60 px-6 py-4 backdrop-blur-xs"
      >
        <div class="flex items-center gap-2 text-sm text-[color:var(--color-brand-secondary)]">
          <UIcon
            name="lucide:mail"
            size="18"
            class="text-[color:var(--color-crepuscule-600)]"
          />
          <span>Une question en attendant ?</span>
        </div>
        <a
          :href="`mailto:${legalEmail}`"
          class="text-sm font-medium text-[color:var(--color-crepuscule-800)] hover:underline hover:text-[color:var(--color-crepuscule-900)] transition-colors"
        >
          {{ legalEmail }}
        </a>
      </div>
    </div>

    <!-- Minimal Legal Footer -->
    <footer class="mt-12 text-xs text-[color:var(--color-brand-muted)]">
      <p v-if="companyName">
        © {{ currentYear }} {{ companyName }}. Tous droits réservés.
      </p>
      <p v-else>
        © {{ currentYear }} {{ resolvedCoachName }}. Tous droits réservés.
      </p>
    </footer>
  </div>
</template>
