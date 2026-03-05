<script setup lang="ts">
useCommonLayoutHead()

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
        },
        {
          label: 'SEO',
          to: '/admin/seo',
          icon: 'lucide:globe',
          match: 'exact' as const
        }
      ]
    },
    {
      key: 'outils',
      label: 'Outils',
      defaultOpen: true,
      items: [
        {
          label: 'Business Logs',
          to: '/admin/logs',
          icon: 'lucide:scroll-text',
          match: 'exact' as const
        },
        {
          label: 'Notifications',
          to: '/admin/notification-logs',
          icon: 'lucide:bell',
          match: 'exact' as const
        },
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
