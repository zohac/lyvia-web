<template>
  <div class="space-y-6">
    <AtomsDsPageHeader
      title="Notifications"
      subtitle="Gérez vos e-mails."
    />

    <AtomsDsErrorState
      v-if="errorMessage"
      :message="errorMessage"
      @retry="load()"
    />

    <UCard
      v-else
      class="bg-[color:var(--color-surface-card)]"
    >
      <div class="flex items-start justify-between gap-4">
        <div class="flex-1 min-w-0">
          <p class="font-semibold text-[color:var(--color-text-primary)]">
            Nouvel article Keova à valider
          </p>
          <p class="mt-1 text-sm text-[color:var(--color-text-muted)]">
            Vous recevez un e-mail quand Keova publie un article que vos clientes pourraient voir.
          </p>
        </div>
        <USwitch
          :model-value="platformContentPublished"
          :disabled="loading || saving"
          @update:model-value="toggle"
        />
      </div>
    </UCard>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import AtomsDsPageHeader from '../../../components/atoms/DsPageHeader.vue'
import AtomsDsErrorState from '../../../components/atoms/DsErrorState.vue'
import { createNotificationPreferences } from '../../../features/notifications/createNotificationPreferences'
import {
  getNotificationPreferences,
  updateNotificationPreferences
} from '../../../features/notifications/services/notification-preferences.service'

const toast = useToast()

const prefs = createNotificationPreferences({
  get: getNotificationPreferences,
  update: updateNotificationPreferences,
  notify: notice => toast.add(notice)
})

const { loading, saving, errorMessage, platformContentPublished, load, toggle } = prefs

onMounted(() => {
  void load()
})

definePageMeta({
  layout: 'provider',
  middleware: 'auth-provider',
  pageTitle: 'Notifications'
})
</script>
