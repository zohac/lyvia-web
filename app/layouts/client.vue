<script setup lang="ts">
useHead({
  meta: [{ name: 'viewport', content: 'width=device-width, initial-scale=1' }],
  link: [{ rel: 'icon', href: '/favicon.ico' }],
  htmlAttrs: { lang: 'fr' }
})

const navigation = [
  {
    label: 'Tableau de bord',
    to: '/client/dashboard',
    icon: 'lucide:home',
    match: 'exact'
  },
  {
    label: 'Rendez-vous',
    to: '/client/consultation',
    icon: 'lucide:calendar',
    match: 'prefix'
  },
  {
    label: 'Ressources',
    to: '/client/content',
    icon: 'lucide:book-open',
    match: 'prefix'
  },
  {
    label: 'Paiements',
    to: '/client/payments',
    icon: 'lucide:receipt',
    match: 'prefix'
  },
  {
    label: 'Paramètres',
    to: '/client/settings',
    icon: 'lucide:settings',
    match: 'prefix'
  }
] as const
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
