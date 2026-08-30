<script setup lang="ts">
import { useCurrentUser } from '../features/auth/useCurrentUser'
import { useBrandColorInjection } from '~/composables/useBrandColorInjection'
import { SUPPORT_NAVIGATION_ITEMS } from '../features/support-session/api/support-session.contract'
import DashboardShell from '../components/templates/DashboardShell.vue'
import SupportSessionBanner from '../components/organisms/SupportSessionBanner.vue'

useCommonLayoutHead()
useBrandColorInjection()

const { user } = useCurrentUser()
const isTestAccount = computed(() => user.value?.isTest === true)

// In support mode: strictly the 6 allowed navigation items without sensitive features or sidebar persistence
const supportNavigation = computed(() => ({
  home: {
    label: 'Ma page coach',
    to: '/provider/coach-page',
    icon: 'lucide:layout',
    match: 'exact' as const
  },
  groups: [
    {
      key: 'support-configuration',
      label: 'Configuration autorisée',
      defaultOpen: true,
      items: SUPPORT_NAVIGATION_ITEMS.map(item => ({
        label: item.label,
        to: item.to,
        icon: item.icon,
        match: item.match
      }))
    }
  ]
}))
</script>

<template>
  <div class="flex min-h-screen flex-col">
    <SupportSessionBanner />
    <DashboardShell
      brand-label="Keova"
      brand-to="/provider/coach-page"
      sidebar-label="Assistance"
      :navigation="supportNavigation"
      :support-mode="true"
    >
      <UAlert
        v-if="isTestAccount"
        color="warning"
        variant="subtle"
        icon="lucide:flask-conical"
        title="Compte de test — Les données de ce compte ne sont pas visibles publiquement"
        class="mb-6"
      />
      <slot />
    </DashboardShell>
  </div>
</template>
