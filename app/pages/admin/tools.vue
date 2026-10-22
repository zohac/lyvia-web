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

/**
 * Sur téléphone, les quatre onglets ne tiennent pas dans la largeur : ils
 * deviennent une bande défilante (voir `:ui` ci-dessous) plutôt que des
 * libellés tronqués à « A. » et « Bu... ». Le revers d'une bande défilante est
 * qu'un onglet ouvert par URL (`?tab=waitlist`) peut être hors écran au
 * chargement — on le recentre donc au montage, à chaque changement d'onglet et
 * à chaque changement de largeur (rotation, redimensionnement), sinon une
 * rotation laissait l'onglet actif hors écran. `block: 'nearest'` évite de
 * faire sauter la page verticalement.
 */
const tabsRoot = ref<HTMLElement | null>(null)

function centerActiveTab(): void {
  const active = tabsRoot.value?.querySelector<HTMLElement>('[role="tab"][aria-selected="true"]')
  active?.scrollIntoView({ inline: 'center', block: 'nearest' })
}

onMounted(() => {
  centerActiveTab()
  window.addEventListener('resize', centerActiveTab)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', centerActiveTab)
})

watch(activeTab, () => {
  nextTick(centerActiveTab)
})
</script>

<template>
  <div class="space-y-6">
    <AtomsDsPageHeader
      title="Outils"
      subtitle="Analytics, logs et monitoring de la plateforme."
    />

    <div ref="tabsRoot">
      <UTabs
        :model-value="activeTab"
        :items="tabItems"
        variant="link"
        :unmount-on-hide="false"
        :ui="{ list: 'max-w-full overflow-x-auto no-scrollbar', trigger: 'shrink-0' }"
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
            <OrganismsAdminWaitlistPanel />
          </div>
        </template>
      </UTabs>
    </div>
  </div>
</template>
