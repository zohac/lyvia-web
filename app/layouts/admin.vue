<script setup lang="ts">
import '~/assets/css/dashboard.css'

import { ADMIN_NAVIGATION } from '../features/navigation/domain/admin-navigation'
import DashboardShell from '../components/templates/DashboardShell.vue'

useCommonLayoutHead({ noindex: true })
</script>

<template>
  <DashboardShell
    brand-label="Keova"
    brand-to="/admin/dashboard"
    sidebar-label="Admin"
    :navigation="ADMIN_NAVIGATION"
  >
    <slot />
  </DashboardShell>
</template>
