<script setup lang="ts">
import { useProviderStripeStatus } from '../features/stripe/useProviderStripeStatus'
import { useProviderRequestsBadge } from '../features/provider-requests/useProviderRequestsBadge'

useHead({
  meta: [{ name: 'viewport', content: 'width=device-width, initial-scale=1' }],
  link: [{ rel: 'icon', href: '/favicon.ico' }],
  htmlAttrs: { lang: 'fr' }
})

const stripeStatus = useProviderStripeStatus()
const requestsBadge = useProviderRequestsBadge()

// Fetch pending requests count on mount
onMounted(() => {
  requestsBadge.refresh()
})

const navigation = computed(() => ({
  // Item principal toujours visible
  home: {
    label: 'Vue d\'ensemble',
    to: '/provider/dashboard',
    icon: 'lucide:layout-dashboard',
    match: 'exact' as const
  },
  // Groupes collapsibles
  groups: [
    {
      key: 'pilotage',
      label: 'Pilotage',
      defaultOpen: true,
      items: [
        {
          label: 'Calendrier',
          to: '/provider/calendar',
          icon: 'lucide:calendar',
          match: 'prefix' as const
        },
        {
          label: 'Appels discovery',
          to: '/provider/discovery',
          icon: 'lucide:phone-call',
          match: 'prefix' as const
        },
        {
          label: 'Mes clientes',
          to: '/provider/clients',
          icon: 'lucide:users',
          match: 'prefix' as const
        },
        {
          label: 'Finance',
          to: '/provider/finance',
          icon: 'lucide:wallet',
          match: 'prefix' as const
        },
        {
          label: 'Demandes',
          to: '/provider/requests',
          icon: 'lucide:inbox',
          match: 'prefix' as const,
          badge: requestsBadge.pendingCount.value > 0 ? requestsBadge.pendingCount.value : null
        }
      ]
    },
    {
      key: 'configuration',
      label: 'Configuration',
      defaultOpen: false,
      items: [
        {
          label: 'Disponibilités',
          to: '/provider/availability',
          icon: 'lucide:calendar-clock',
          match: 'prefix' as const
        },
        {
          label: 'Tarifs',
          to: '/provider/pricing/consultations',
          icon: 'lucide:tags',
          match: 'prefix' as const
        },
        {
          label: 'Contenus',
          to: '/provider/content',
          icon: 'lucide:file-text',
          match: 'prefix' as const
        },
        {
          label: 'Paramètres',
          to: '/provider/settings/payments',
          icon: 'lucide:settings',
          match: 'prefix' as const
        }
      ]
    }
  ]
}))
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
