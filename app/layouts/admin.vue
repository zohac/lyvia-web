<script setup lang="ts">
import { ADMIN_NAVIGATION } from '../features/navigation/domain/admin-navigation'

useCommonLayoutHead()
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
