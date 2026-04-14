<script setup lang="ts">
import { useBrandColorInjection } from '~/composables/useBrandColorInjection'
import { CLIENT_NAVIGATION } from '../features/navigation/domain/client-navigation'
import DashboardShell from '../components/templates/DashboardShell.vue'

useCommonLayoutHead()
useBrandColorInjection()
</script>

<template>
  <DashboardShell
    brand-label="Keova"
    brand-to="/client/dashboard"
    sidebar-label="Client"
    :navigation="CLIENT_NAVIGATION"
  >
    <slot />
  </DashboardShell>
</template>
