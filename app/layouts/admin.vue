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
      key: 'principal',
      label: '',
      defaultOpen: true,
      items: [
        {
          label: 'Providers',
          to: '/admin/providers',
          icon: 'lucide:users',
          match: 'prefix' as const
        },
        {
          label: 'Clients',
          to: '/admin/clients',
          icon: 'lucide:contact',
          match: 'prefix' as const
        },
        {
          label: 'Outils',
          to: '/admin/tools',
          icon: 'lucide:wrench',
          match: 'prefix' as const
        },
        {
          label: 'SEO',
          to: '/admin/seo',
          icon: 'lucide:globe',
          match: 'exact' as const
        }
      ]
    }
  ]
}
</script>

<template>
  <DashboardShell
    brand-label="Keova"
    brand-to="/admin/dashboard"
    sidebar-label="Admin"
    :navigation="navigation"
  >
    <slot />
  </DashboardShell>
</template>
