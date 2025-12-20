<script setup lang="ts">
useHead({
  meta: [{ name: 'viewport', content: 'width=device-width, initial-scale=1' }],
  link: [{ rel: 'icon', href: '/favicon.ico' }],
  htmlAttrs: { lang: 'fr' }
})

const navigation = [
  {
    label: "Vue d'ensemble",
    to: '/provider/dashboard',
    icon: 'lucide:home',
    match: 'exact'
  },
  {
    label: 'Agenda',
    to: '/provider/availability',
    icon: 'lucide:calendar-clock',
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
    to: '/provider/payments',
    icon: 'lucide:landmark',
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
    brand-label="Lyvia"
    brand-to="/provider/dashboard"
    sidebar-label="Coach"
    :navigation="navigation"
  >
    <slot />
  </DashboardShell>
</template>
