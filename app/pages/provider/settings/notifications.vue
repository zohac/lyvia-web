<template>
  <div class="space-y-6">
    <AtomsDsPageHeader title="Notifications">
      <template #subtitle>
        <span class="block max-w-[62ch] text-base text-[color:var(--color-text-secondary)]">
          Gérez vos e-mails.
        </span>
      </template>
    </AtomsDsPageHeader>

    <AtomsDsErrorState
      v-if="errorMessage"
      :message="errorMessage"
      @retry="load()"
    />

    <UCard
      v-else
      class="max-w-2xl bg-[color:var(--color-surface-card)]"
    >
      <div class="flex items-start justify-between gap-6">
        <div class="min-w-0 flex-1">
          <p class="text-sm font-semibold text-[color:var(--color-text-primary)]">
            Nouvel article Keova à valider
          </p>
          <p class="mt-1 text-[13px] text-[color:var(--color-text-secondary)]">
            Vous recevez un e-mail quand Keova publie un article que vos clientes pourraient voir.
          </p>
        </div>
        <USwitch
          :model-value="platformContentPublished"
          :disabled="loading || saving"
          size="lg"
          aria-label="Nouvel article Keova à valider"
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
