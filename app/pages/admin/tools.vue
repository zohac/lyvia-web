<script setup lang="ts">
import AdminAnalyticsPanel from '../../components/organisms/AdminAnalyticsPanel.vue'
import AdminBusinessLogsPanel from '../../components/organisms/AdminBusinessLogsPanel.vue'
import AdminNotificationLogsPanel from '../../components/organisms/AdminNotificationLogsPanel.vue'

definePageMeta({
  layout: 'admin',
  middleware: 'auth-admin',
  pageTitle: 'Outils'
})

type TabValue = 'analytics' | 'logs' | 'notifications'

const tabItems = [
  { label: 'Analytics', value: 'analytics' as const, icon: 'i-lucide-bar-chart-3', slot: 'analytics' as const },
  { label: 'Business Logs', value: 'logs' as const, icon: 'i-lucide-scroll-text', slot: 'logs' as const },
  { label: 'Notifications', value: 'notifications' as const, icon: 'i-lucide-bell', slot: 'notifications' as const }
]

const route = useRoute()
const router = useRouter()

const validTabs: TabValue[] = ['analytics', 'logs', 'notifications']
const activeTab = computed<TabValue>({
  get() {
    const tab = route.query.tab as string
    return validTabs.includes(tab as TabValue) ? (tab as TabValue) : 'analytics'
  },
  set(value: TabValue) {
    router.replace({ query: { ...route.query, tab: value === 'analytics' ? undefined : value } })
  }
})
</script>

<template>
  <div class="space-y-6">
    <h1 class="font-heading text-2xl font-bold text-[color:var(--color-text-primary)]">
      Outils
    </h1>

    <UTabs
      :model-value="activeTab"
      :items="tabItems"
      variant="link"
      :unmount-on-hide="false"
      class="w-full"
      @update:model-value="activeTab = $event as TabValue"
    >
      <template #analytics>
        <div class="mt-6">
          <AdminAnalyticsPanel />
        </div>
      </template>

      <template #logs>
        <div class="mt-6">
          <AdminBusinessLogsPanel />
        </div>
      </template>

      <template #notifications>
        <div class="mt-6">
          <AdminNotificationLogsPanel />
        </div>
      </template>
    </UTabs>
  </div>
</template>
