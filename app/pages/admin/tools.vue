<script setup lang="ts">
import AdminAnalyticsPanel from '../../components/organisms/AdminAnalyticsPanel.vue'
import AdminBusinessLogsPanel from '../../components/organisms/AdminBusinessLogsPanel.vue'
import AdminNotificationLogsPanel from '../../components/organisms/AdminNotificationLogsPanel.vue'
import {
  ADMIN_TOOL_TABS,
  buildAdminToolTabQuery,
  parseAdminToolTab
} from '../../features/admin/domain/admin-tools-tabs'

definePageMeta({
  layout: 'admin',
  middleware: 'auth-admin',
  pageTitle: 'Outils'
})

type TabValue = typeof ADMIN_TOOL_TABS[number]['value']

const tabItems = ADMIN_TOOL_TABS

const route = useRoute()
const router = useRouter()

const activeTab = computed<TabValue>({
  get() {
    return parseAdminToolTab(route.query.tab)
  },
  set(value: TabValue) {
    router.replace({ query: buildAdminToolTabQuery(route.query, value) })
  }
})
</script>

<template>
  <div class="space-y-6">
    <AtomsDsPageHeader
      title="Outils"
      subtitle="Analytics, logs et monitoring de la plateforme."
    />

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

      <template #waitlist>
        <div class="mt-6">
          <AtomsDsEmptyState
            icon="i-lucide-list"
            title="Waitlist"
            description="Cette section sera bientôt disponible pour gérer les leads en attente."
          />
        </div>
      </template>
    </UTabs>
  </div>
</template>
