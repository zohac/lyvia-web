<script setup lang="ts">
import { useProviderStripeStatus } from '../features/stripe/useProviderStripeStatus'

useHead({
  meta: [{ name: 'viewport', content: 'width=device-width, initial-scale=1' }],
  link: [{ rel: 'icon', href: '/favicon.ico' }],
  htmlAttrs: { lang: 'fr' }
})

const stripeStatus = useProviderStripeStatus()

const navigation = [
  {
    label: 'Vue d\'ensemble',
    to: '/provider/dashboard',
    icon: 'lucide:home',
    match: 'exact'
  },
  {
    label: 'Calendrier',
    to: '/provider/calendar',
    icon: 'lucide:calendar',
    match: 'prefix'
  },
  {
    label: 'Disponibilités',
    to: '/provider/availability',
    icon: 'lucide:calendar-clock',
    match: 'prefix'
  },
  {
    label: 'Appels discovery',
    to: '/provider/discovery',
    icon: 'lucide:phone-call',
    match: 'prefix'
  },
  {
    label: 'Mes clientes',
    to: '/provider/clients',
    icon: 'lucide:users',
    match: 'prefix'
  },
  {
    label: 'Contenus',
    to: '/provider/content',
    icon: 'lucide:feather',
    match: 'prefix'
  },
  {
    label: 'Finance',
    to: '/provider/finance',
    icon: 'lucide:landmark',
    match: 'prefix'
  },
  {
    label: 'Tarifs consultation',
    to: '/provider/pricing/consultations',
    icon: 'lucide:tags',
    match: 'prefix'
  },
  {
    label: 'Paramètres',
    to: '/provider/settings/payments',
    icon: 'lucide:sliders-horizontal',
    match: 'prefix'
  }
] as const
</script>

<template>
  <DashboardShell
    brand-label="Kaora"
    brand-to="/provider/dashboard"
    sidebar-label="Coach"
    :navigation="navigation"
  >
    <div
      v-if="stripeStatus.isBlocked.value"
      class="mb-6 flex items-center justify-center gap-3 rounded-blob-b bg-gradient-to-r from-red-600 to-red-500 px-4 py-3 text-sm font-medium text-white shadow-floating"
      role="alert"
    >
      <UIcon
        name="lucide:alert-triangle"
        size="18"
        class="flex-shrink-0"
        aria-hidden="true"
      />
      <span>{{ stripeStatus.blockMessage.value }}</span>
      <NuxtLink
        to="/provider/finance"
        class="ml-1 inline-flex items-center gap-1 rounded-full bg-white/20 px-3 py-1 text-xs font-bold uppercase tracking-wide transition-colors hover:bg-white/30"
      >
        Résoudre
        <UIcon
          name="lucide:arrow-right"
          size="14"
          aria-hidden="true"
        />
      </NuxtLink>
    </div>
    <slot />
  </DashboardShell>
</template>
