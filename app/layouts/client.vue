<script setup lang="ts">
useHead({
  meta: [{ name: 'viewport', content: 'width=device-width, initial-scale=1' }],
  link: [{ rel: 'icon', href: '/favicon.ico' }],
  htmlAttrs: { lang: 'fr' }
})

const navigation = {
  home: {
    label: 'Tableau de bord',
    to: '/client/dashboard',
    icon: 'lucide:home',
    match: 'exact' as const
  },
  groups: [
    {
      key: 'accompagnement',
      label: 'Accompagnement',
      defaultOpen: true,
      items: [
        {
          label: 'Rendez-vous',
          to: '/client/consultation',
          icon: 'lucide:calendar',
          match: 'prefix' as const
        },
        {
          label: 'Ressources',
          to: '/client/content',
          icon: 'lucide:book-open',
          match: 'prefix' as const
        }
      ]
    },
    {
      key: 'compte',
      label: 'Compte',
      defaultOpen: false,
      items: [
        {
          label: 'Paiements',
          to: '/client/payments',
          icon: 'lucide:receipt',
          match: 'prefix' as const
        },
        {
          label: 'Paramètres',
          to: '/client/settings',
          icon: 'lucide:settings',
          match: 'prefix' as const
        }
      ]
    }
  ]
}
</script>

<template>
  <DashboardShell
    brand-label="Kaora"
    brand-to="/client/dashboard"
    sidebar-label="Client"
    :navigation="navigation"
  >
    <slot />
  </DashboardShell>
</template>
