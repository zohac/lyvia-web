<script setup lang="ts">
useHead({
  meta: [{ name: 'viewport', content: 'width=device-width, initial-scale=1' }],
  link: [{ rel: 'icon', href: '/favicon.ico' }],
  htmlAttrs: { lang: 'fr' }
})

const navigation = {
  home: {
    label: 'Dashboard',
    to: '/admin/dashboard',
    icon: 'lucide:layout-dashboard',
    match: 'exact' as const
  },
  groups: [
    {
      key: 'gestion',
      label: 'Gestion',
      defaultOpen: true,
      items: [
        {
          label: 'Providers',
          to: '/admin/providers',
          icon: 'lucide:users',
          match: 'prefix' as const
        }
      ]
    },
    {
      key: 'outils',
      label: 'Outils',
      defaultOpen: false,
      items: [
        {
          label: 'Design System',
          to: '/admin/design-system',
          icon: 'lucide:file-sliders',
          match: 'exact' as const
        }
      ]
    }
  ]
}
</script>

<template>
  <DashboardShell
    brand-label="Kaora"
    brand-to="/admin/dashboard"
    sidebar-label="Admin"
    :navigation="navigation"
  >
    <slot />
  </DashboardShell>
</template>
