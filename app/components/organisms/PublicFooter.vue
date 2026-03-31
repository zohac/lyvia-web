<script setup lang="ts">
import { usePublicHeaderState } from '../../features/public/state/public-header.state'
import LegalFooterLinks from '../atoms/LegalFooterLinks.vue'

const headerState = usePublicHeaderState()
const currentYear = new Date().getFullYear()

const isWhiteLabel = computed(() => headerState.value.variant === 'white-label')

const footerLine = computed(() => {
  if (headerState.value.variant === 'coach') return 'Propulsé par Keova'
  if (headerState.value.variant === 'marketing') return 'Fait avec soin pour les pros du soin.'
  return null
})

// White-label: fetch coach profile data for footer enrichment (city, region)
const { data: coachProfile } = isWhiteLabel.value
  ? useNuxtData<{
      city?: string | null
      region?: string | null
      displayName?: string
    }>(`public-provider-profile:${useRoute().params.slug || ''}`)
  : { data: ref(null) }

// Fallback: also try tenant data for displayName
const { data: tenant } = useNuxtData<{
  brand: { displayName: string }
}>('public-tenant-home')

const whiteLabelName = computed(() =>
  headerState.value.brandLabel || tenant.value?.brand.displayName || 'Coach'
)

const whiteLabelLocation = computed(() => {
  const city = coachProfile.value?.city
  const region = coachProfile.value?.region
  if (city && region) return `${city} · ${region}`
  return city || region || null
})
</script>

<template>
  <footer class="border-t border-[color:var(--color-brand-subtle)]">
    <div class="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-10 text-center text-sm text-[color:var(--color-brand-muted)] sm:px-6">
      <p class="font-semibold uppercase tracking-widest">
        © {{ currentYear }} {{ isWhiteLabel ? whiteLabelName : 'Keova' }}
      </p>

      <!-- White-label V3 footer -->
      <template v-if="isWhiteLabel">
        <p>
          {{ whiteLabelName }} — Accompagnement périménopause et ménopause
        </p>
        <p v-if="whiteLabelLocation">
          {{ whiteLabelLocation }}
        </p>
        <p>
          Accompagnements 100% en visio · Toute la France
        </p>
      </template>

      <!-- Platform footer -->
      <template v-else-if="footerLine">
        <p>{{ footerLine }}</p>
        <p class="text-xs">
          Dernière mise à jour : mars 2026
        </p>
      </template>

      <ULink
        :to="headerState.loginTo"
        class="inline-flex min-h-[44px] items-center font-semibold hover:underline"
      >
        {{ headerState.loginLabel }}
      </ULink>

      <LegalFooterLinks class="mt-2" />
    </div>
  </footer>
</template>
