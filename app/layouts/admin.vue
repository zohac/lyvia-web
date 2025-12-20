<script setup lang="ts">
useHead({
  meta: [{ name: 'viewport', content: 'width=device-width, initial-scale=1' }],
  link: [{ rel: 'icon', href: '/favicon.ico' }],
  htmlAttrs: { lang: 'fr' }
})

const navigation = [
  {
    label: 'Dashboard',
    to: '/admin/dashboard',
    icon: 'lucide:layout-dashboard',
    match: 'exact'
  }
] as const
</script>

<template>
  <DashboardShell
    brand-label="Lyvia"
    brand-to="/admin/dashboard"
    sidebar-label="Admin"
    :navigation="navigation"
  >
    <slot />
  </DashboardShell>
</template>
