<script setup lang="ts">
defineProps<{
  open: boolean
  providerName: string
  loading: boolean
  impact: {
    activeClientsCount: number
    scheduledAppointmentsCount: number
    pendingPaymentsCount: number
    canDeactivate: boolean
  } | null
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'confirm': []
}>()

function updateOpen(value: boolean) {
  emit('update:open', value)
}
</script>

<template>
  <UModal
    :open="open"
    :dismissible="!loading"
    @update:open="updateOpen"
  >
    <template #header>
      <div class="flex items-center gap-3">
        <div class="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
          <UIcon
            name="lucide:alert-triangle"
            size="20"
            class="text-red-600"
          />
        </div>
        <div>
          <h3 class="text-lg font-semibold text-[color:var(--color-brand-primary)]">
            Désactiver {{ providerName }}
          </h3>
          <p class="text-sm text-[color:var(--color-brand-muted)]">
            Cette action est réversible
          </p>
        </div>
      </div>
    </template>

    <template #body>
      <!-- Loading impact -->
      <div
        v-if="!impact"
        class="flex items-center justify-center py-8"
      >
        <UIcon
          name="lucide:loader-2"
          size="24"
          class="animate-spin text-[color:var(--color-brand-muted)]"
        />
      </div>

      <!-- Impact data -->
      <div
        v-else
        class="space-y-4"
      >
        <p class="text-sm text-[color:var(--color-brand-secondary)]">
          La désactivation de ce provider aura les conséquences suivantes :
        </p>

        <div class="grid gap-3">
          <div class="flex items-center gap-3 rounded-xl border border-[color:var(--color-border-subtle)] bg-[color:var(--color-crepuscule-50)]/50 px-4 py-3">
            <UIcon
              name="lucide:users"
              size="18"
              class="text-[color:var(--color-brand-muted)]"
            />
            <span class="text-sm">
              <strong>{{ impact.activeClientsCount }}</strong> client{{ impact.activeClientsCount > 1 ? 's' : '' }} actif{{ impact.activeClientsCount > 1 ? 's' : '' }}
            </span>
          </div>

          <div class="flex items-center gap-3 rounded-xl border border-[color:var(--color-border-subtle)] bg-[color:var(--color-crepuscule-50)]/50 px-4 py-3">
            <UIcon
              name="lucide:calendar"
              size="18"
              class="text-[color:var(--color-brand-muted)]"
            />
            <span class="text-sm">
              <strong>{{ impact.scheduledAppointmentsCount }}</strong> rendez-vous planifié{{ impact.scheduledAppointmentsCount > 1 ? 's' : '' }}
            </span>
          </div>

          <div class="flex items-center gap-3 rounded-xl border border-[color:var(--color-border-subtle)] bg-[color:var(--color-crepuscule-50)]/50 px-4 py-3">
            <UIcon
              name="lucide:wallet"
              size="18"
              class="text-[color:var(--color-brand-muted)]"
            />
            <span class="text-sm">
              <strong>{{ impact.pendingPaymentsCount }}</strong> paiement{{ impact.pendingPaymentsCount > 1 ? 's' : '' }} en attente
            </span>
          </div>
        </div>

        <UAlert
          v-if="impact.scheduledAppointmentsCount > 0 || impact.pendingPaymentsCount > 0"
          color="warning"
          variant="soft"
          icon="i-lucide-info"
          title="Attention"
          description="Les rendez-vous planifiés et paiements en attente ne seront pas automatiquement annulés. Gérez-les avant ou après la désactivation."
        />
      </div>
    </template>

    <template #footer>
      <div class="flex justify-end gap-3">
        <UButton
          variant="outline"
          color="neutral"
          :disabled="loading"
          @click="updateOpen(false)"
        >
          Annuler
        </UButton>
        <UButton
          color="error"
          :loading="loading"
          :disabled="!impact"
          @click="emit('confirm')"
        >
          Confirmer la désactivation
        </UButton>
      </div>
    </template>
  </UModal>
</template>
