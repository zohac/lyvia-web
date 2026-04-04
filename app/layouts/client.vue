<script setup lang="ts">
import { useBrandColorInjection } from '~/composables/useBrandColorInjection'

useCommonLayoutHead()
useBrandColorInjection()

const navigation = {
  home: {
    label: 'Accueil',
    to: '/client/dashboard',
    icon: 'lucide:home',
    match: 'exact' as const
  },
  groups: [
    {
      key: 'principal',
      label: '',
      defaultOpen: true,
      items: [
        {
          label: 'Mes rendez-vous',
          to: '/client/consultation',
          icon: 'lucide:calendar',
          match: 'prefix' as const
        },
        {
          label: 'Mon compte',
          to: '/client/account',
          icon: 'lucide:user',
          match: 'prefix' as const
        }
      ]
    }
  ]
}
</script>

<template>
  <DashboardShell
    brand-label="Keova"
    brand-to="/client/dashboard"
    sidebar-label="Client"
    :navigation="navigation"
  >
    <slot />
  </DashboardShell>
</template>
