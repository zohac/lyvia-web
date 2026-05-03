<script setup lang="ts">
import {
  isDestructiveButtonDisabled,
  resolveHardDeleteModalState,
  type ClientDeletionImpact
} from '~/features/admin/clients/admin-client-hard-delete-helpers'

export type { ClientDeletionImpact }

const props = defineProps<{
  open: boolean
  clientName: string
  loading: boolean
  impact: ClientDeletionImpact | null
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'confirm': []
  'go-deactivate': []
}>()

const irreversibleAcknowledged = ref(false)

const uiState = computed(() =>
  resolveHardDeleteModalState(props.impact, irreversibleAcknowledged.value)
)

const destructiveDisabled = computed(() =>
  isDestructiveButtonDisabled(uiState.value)
)

watch(
  () => props.open,
  (v) => {
    if (!v) irreversibleAcknowledged.value = false
  }
)

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
        <div class="flex h-10 w-10 items-center justify-center rounded-full bg-[color:var(--color-error-100)]">
          <UIcon
            name="lucide:trash-2"
            size="20"
            class="text-[color:var(--color-error-600)]"
          />
        </div>
        <div>
          <h3 class="text-lg font-semibold text-[color:var(--color-brand-primary)]">
            {{ uiState.headerTitle }}
          </h3>
          <p class="text-sm text-[color:var(--color-brand-muted)]">
            {{ clientName }}
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

      <!-- Blocked: cannot delete -->
      <div
        v-else-if="uiState.mode === 'blocked'"
        class="space-y-4"
      >
        <UAlert
          color="error"
          variant="soft"
          icon="i-lucide-shield-alert"
          title="Suppression bloquée"
          :description="uiState.blockMessage ?? ''"
        />

        <div class="grid gap-3">
          <div class="flex items-center gap-3 rounded-xl border border-[color:var(--color-border-subtle)] bg-[color:var(--color-crepuscule-50)]/50 px-4 py-3">
            <UIcon
              name="lucide:wallet"
              size="18"
              class="text-[color:var(--color-brand-muted)]"
            />
            <span class="text-sm">
              <strong>{{ impact.paymentsCount }}</strong> paiement(s)
            </span>
          </div>

          <div class="flex items-center gap-3 rounded-xl border border-[color:var(--color-border-subtle)] bg-[color:var(--color-crepuscule-50)]/50 px-4 py-3">
            <UIcon
              name="lucide:repeat"
              size="18"
              class="text-[color:var(--color-brand-muted)]"
            />
            <span class="text-sm">
              <strong>{{ impact.subscriptionsCount }}</strong> abonnement(s) actif(s)
            </span>
          </div>
        </div>
      </div>

      <!-- Allowed: can delete -->
      <div
        v-else
        class="space-y-4"
      >
        <UAlert
          color="warning"
          variant="soft"
          icon="i-lucide-alert-triangle"
          title="Cette action est irréversible. Toutes les données associées seront supprimées :"
        >
          <template #description>
            <ul class="mt-2 list-inside list-disc space-y-1 text-sm">
              <li>{{ impact.appointmentsCount }} rendez-vous</li>
              <li>Compte utilisateur et profil</li>
              <li>Sessions et tokens d'accès</li>
              <li>Logs de notifications associés</li>
            </ul>
          </template>
        </UAlert>

        <label class="flex cursor-pointer items-start gap-3 rounded-xl border border-[color:var(--color-border-subtle)] bg-white p-4">
          <UCheckbox
            v-model="irreversibleAcknowledged"
            class="mt-0.5"
          />
          <span class="text-sm text-[color:var(--color-brand-secondary)]">
            Je comprends que cette action est irréversible
          </span>
        </label>
      </div>
    </template>

    <template #footer>
      <div class="flex flex-wrap justify-end gap-3">
        <UButton
          variant="outline"
          color="neutral"
          :disabled="loading"
          @click="updateOpen(false)"
        >
          Annuler
        </UButton>

        <!-- Blocked mode: route the admin to the real deactivate flow. -->
        <UButton
          v-if="uiState.mode === 'blocked'"
          data-test="hard-delete-go-deactivate"
          variant="solid"
          color="primary"
          @click="emit('go-deactivate')"
        >
          Désactiver à la place
        </UButton>

        <!-- Destructive button is ALWAYS rendered (even in blocked mode it
             stays visible but disabled, so the admin understands the locked
             door rather than seeing the button vanish). -->
        <UButton
          data-test="hard-delete-confirm"
          color="error"
          variant="solid"
          :loading="uiState.mode !== 'blocked' && loading"
          :disabled="destructiveDisabled"
          @click="destructiveDisabled ? undefined : emit('confirm')"
        >
          Supprimer définitivement
        </UButton>
      </div>
    </template>
  </UModal>
</template>
