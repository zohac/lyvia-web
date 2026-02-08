<script setup lang="ts">
import { useProviderAccount } from '../../features/account/useProviderAccount'
import { useProviderConsultationPricing } from '../../features/pricing/useProviderConsultationPricing'
import ProviderCreateConsultationPricePlanModal from '../../components/organisms/ProviderCreateConsultationPricePlanModal.vue'
import ProviderEditConsultationPricePlanModal from '../../components/organisms/ProviderEditConsultationPricePlanModal.vue'

definePageMeta({
  layout: 'provider',
  middleware: 'auth-provider',
  pageTitle: 'Créneaux & Tarifs'
})

const toast = useToast()

// ──────────────────────────────────────────────
// Parallel initial fetches (RFU-6)
// ──────────────────────────────────────────────
const providerAccount = useProviderAccount()
const [, pricing] = await Promise.all([
  providerAccount.fetchAccount(),
  useProviderConsultationPricing()
])

// ──────────────────────────────────────────────
// Section 1 — Discovery config
// ──────────────────────────────────────────────
const durationOptions = Array.from({ length: 12 }, (_, i) => ({
  label: `${(i + 1) * 5} min`,
  value: (i + 1) * 5
}))

const discoveryBufferOptions = Array.from({ length: 13 }, (_, i) => ({
  label: i === 0 ? 'Pas de pause' : `${i * 5} min`,
  value: i * 5
}))

const discoveryDuration = ref(providerAccount.account.value?.defaultDiscoveryDurationMinutes ?? 15)
const discoveryBuffer = ref(providerAccount.account.value?.discoveryBufferAfterMinutes ?? 15)

const savedDiscoveryValues = ref({
  duration: discoveryDuration.value,
  buffer: discoveryBuffer.value
})

// Sync refs when account data changes (e.g. after retry) (RFU-2)
watch(
  () => providerAccount.account.value,
  (account) => {
    if (!account) return
    discoveryDuration.value = account.defaultDiscoveryDurationMinutes
    discoveryBuffer.value = account.discoveryBufferAfterMinutes
    savedDiscoveryValues.value = {
      duration: account.defaultDiscoveryDurationMinutes,
      buffer: account.discoveryBufferAfterMinutes
    }
  }
)

const isDiscoveryDirty = computed(() =>
  discoveryDuration.value !== savedDiscoveryValues.value.duration
  || discoveryBuffer.value !== savedDiscoveryValues.value.buffer
)

const discoverySummary = computed(() => {
  const total = discoveryDuration.value + discoveryBuffer.value
  if (discoveryBuffer.value === 0) {
    return `Chaque créneau réserve ${total} min (pas de pause entre les appels)`
  }
  return `Chaque créneau réserve ${total} min (${discoveryDuration.value} min d'appel + ${discoveryBuffer.value} min de pause)`
})

const discoverySaving = ref(false)

async function saveDiscovery() {
  if (discoverySaving.value) return

  discoverySaving.value = true
  const ok = await providerAccount.updateAccount({
    defaultDiscoveryDurationMinutes: discoveryDuration.value,
    discoveryBufferAfterMinutes: discoveryBuffer.value
  })
  discoverySaving.value = false

  if (ok) {
    savedDiscoveryValues.value = {
      duration: discoveryDuration.value,
      buffer: discoveryBuffer.value
    }
    toast.add({
      title: 'Configuration découverte enregistrée',
      color: 'success'
    })
  } else {
    toast.add({
      title: 'Erreur',
      description: providerAccount.error.value ?? 'Impossible de sauvegarder.',
      color: 'error'
    })
  }
}

// ──────────────────────────────────────────────
// Section 2 — Consultation price plans
// ──────────────────────────────────────────────
const currencyFormatter = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR'
})

type DisplayPlan = {
  id: string
  label: string
  durationMinutes: number
  durationLabel: string
  amountCents: number
  amountLabel: string
  bufferAfterMinutes: number
  bufferLabel: string
  totalMinutes: number
  isActive: boolean
  sortOrder: number
}

const displayPlans = computed<DisplayPlan[]>(() => {
  return pricing.plans.value.map((plan) => {
    const buffer = plan.bufferAfterMinutes ?? 0
    return {
      id: plan.id,
      label: plan.label,
      durationMinutes: plan.durationMinutes,
      durationLabel: `${plan.durationMinutes} min`,
      amountCents: plan.amountCents,
      amountLabel: currencyFormatter.format(plan.amountCents / 100),
      bufferAfterMinutes: buffer,
      bufferLabel: buffer > 0 ? `Pause après : ${buffer} min` : 'Pas de pause',
      totalMinutes: plan.durationMinutes + buffer,
      isActive: plan.isActive,
      sortOrder: plan.sortOrder
    }
  })
})

const suggestedSortOrder = computed(() => {
  if (pricing.plans.value.length === 0) return 0
  const maxSortOrder = Math.max(...pricing.plans.value.map(plan => plan.sortOrder))
  return Number.isFinite(maxSortOrder) ? maxSortOrder + 1 : 0
})

// Create modal
const isCreateModalOpen = ref(false)

function openCreateModal() {
  pricing.clearCreateError()
  isCreateModalOpen.value = true
}

function updateCreateModalOpen(value: boolean) {
  if (pricing.createPending.value) return
  isCreateModalOpen.value = value
}

async function onCreatePlan(payload: { body: { label: string, durationMinutes: number, amountCents: number, sortOrder?: number, bufferAfterMinutes?: number } }) {
  const planId = await pricing.createPlan(payload.body)
  if (!planId) return

  isCreateModalOpen.value = false
  toast.add({
    title: 'Plan tarifaire créé',
    description: 'Le nouveau plan est disponible dans la liste.',
    color: 'success'
  })
}

// Edit modal
const isEditModalOpen = ref(false)
const editingPlan = ref<DisplayPlan | null>(null)

function openEditModal(plan: DisplayPlan) {
  editingPlan.value = plan
  pricing.clearUpdateError()
  isEditModalOpen.value = true
}

function updateEditModalOpen(value: boolean) {
  if (pricing.isPlanUpdating(editingPlan.value?.id ?? '')) return
  isEditModalOpen.value = value
  if (!value) editingPlan.value = null
}

async function onEditPlan(payload: { body: { bufferAfterMinutes?: number } }) {
  if (!editingPlan.value) return

  const planId = editingPlan.value.id
  const ok = await pricing.patchPlan(planId, payload.body)
  if (!ok) {
    toast.add({
      title: 'Erreur',
      description: pricing.updateErrorMessage.value ?? 'Impossible de mettre à jour le plan.',
      color: 'error'
    })
    return
  }

  await pricing.refresh()
  isEditModalOpen.value = false
  editingPlan.value = null
  toast.add({
    title: 'Plan tarifaire modifié',
    color: 'success'
  })
}

async function onToggleActive(plan: DisplayPlan, nextActive: boolean) {
  const ok = await pricing.togglePlanActive(plan.id, nextActive)
  if (!ok) {
    toast.add({
      title: 'Action impossible',
      description: pricing.updateErrorMessage.value ?? 'Impossible de mettre à jour le plan.',
      color: 'error'
    })
    return
  }

  toast.add({
    title: nextActive ? 'Plan activé' : 'Plan désactivé',
    description: nextActive ? 'Il est de nouveau disponible côté cliente.' : 'Il ne sera plus proposé côté cliente.',
    color: 'primary'
  })
}

// ──────────────────────────────────────────────
// Global loading state + retry
// ──────────────────────────────────────────────
const isLoading = computed(() => providerAccount.loading.value || pricing.pending.value)
const loadError = computed(() => providerAccount.error.value || pricing.errorMessage.value)

async function retryLoad() {
  await Promise.all([
    providerAccount.fetchAccount(),
    pricing.refresh()
  ])
}
</script>

<template>
  <div class="mx-auto max-w-3xl space-y-10">
    <!-- Page header -->
    <header>
      <h1 class="text-2xl font-semibold text-stone-900 sm:text-3xl">
        Créneaux & Tarifs
      </h1>
      <p class="mt-1 text-stone-500">
        Configurez les durées et pauses entre vos rendez-vous.
      </p>
    </header>

    <!-- Global error + retry -->
    <div
      v-if="loadError"
      class="space-y-4"
    >
      <UAlert
        color="error"
        variant="soft"
        title="Impossible de charger la configuration"
        :description="loadError"
        icon="i-lucide-alert-circle"
      />
      <div class="flex justify-center">
        <UButton
          color="neutral"
          variant="soft"
          :loading="isLoading"
          @click="retryLoad"
        >
          Réessayer
        </UButton>
      </div>
    </div>

    <!-- Loading skeleton -->
    <div
      v-else-if="isLoading"
      class="space-y-8"
    >
      <USkeleton class="h-64 w-full rounded-lg" />
      <USkeleton class="h-48 w-full rounded-lg" />
    </div>

    <template v-else>
      <!-- ═══════════════════════════════════════════ -->
      <!-- Section 1 — Appel Découverte               -->
      <!-- ═══════════════════════════════════════════ -->
      <section class="space-y-5">
        <h2 class="text-xl font-semibold text-stone-900">
          Appel Découverte
        </h2>

        <div class="space-y-4">
          <UFormField label="Durée de l'appel">
            <USelect
              v-model="discoveryDuration"
              :items="durationOptions"
              value-key="value"
              class="w-full sm:w-64"
            />
          </UFormField>

          <UFormField label="Pause après l'appel">
            <USelect
              v-model="discoveryBuffer"
              :items="discoveryBufferOptions"
              value-key="value"
              class="w-full sm:w-64"
            />
          </UFormField>
        </div>

        <!-- Dynamic summary -->
        <UAlert
          color="info"
          variant="soft"
          :description="discoverySummary"
          icon="i-lucide-info"
        />

        <!-- Non-retroactivity warning -->
        <UAlert
          v-if="isDiscoveryDirty"
          color="warning"
          variant="soft"
          description="Ce changement s'appliquera aux prochains créneaux proposés. Vos rendez-vous déjà planifiés ne sont pas affectés."
          icon="i-lucide-alert-triangle"
        />

        <!-- Save button -->
        <div class="flex justify-end">
          <UButton
            color="primary"
            :loading="discoverySaving"
            :disabled="!isDiscoveryDirty"
            @click="saveDiscovery"
          >
            Enregistrer
          </UButton>
        </div>
      </section>

      <!-- Divider -->
      <hr class="border-stone-200">

      <!-- ═══════════════════════════════════════════ -->
      <!-- Section 2 — Consultations                  -->
      <!-- ═══════════════════════════════════════════ -->
      <section class="space-y-5">
        <h2 class="text-xl font-semibold text-stone-900">
          Consultations
        </h2>

        <!-- Empty state -->
        <UCard
          v-if="displayPlans.length === 0"
          class="bg-white"
        >
          <div class="flex flex-col items-center justify-center gap-4 py-12 text-center">
            <div class="flex h-16 w-16 items-center justify-center rounded-full bg-stone-100">
              <UIcon
                name="lucide:tag"
                class="h-8 w-8 text-stone-400"
              />
            </div>
            <div>
              <p class="font-medium text-stone-900">
                Aucun plan tarifaire configuré
              </p>
              <p class="mt-1 text-sm text-stone-500">
                Créez votre premier plan pour commencer à recevoir des consultations.
              </p>
            </div>
            <UButton
              color="primary"
              @click="openCreateModal"
            >
              Créer mon premier plan
            </UButton>
          </div>
        </UCard>

        <!-- Plans list -->
        <div
          v-else
          class="space-y-4"
        >
          <UCard
            v-for="plan in displayPlans"
            :key="plan.id"
            class="bg-white"
          >
            <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div class="min-w-0">
                <div class="flex flex-wrap items-center gap-2">
                  <h3 class="font-semibold text-stone-900">
                    {{ plan.label }}
                  </h3>
                  <UBadge
                    :color="plan.isActive ? 'success' : 'neutral'"
                    variant="soft"
                    size="sm"
                  >
                    {{ plan.isActive ? 'Actif' : 'Inactif' }}
                  </UBadge>
                </div>
                <p class="mt-1 text-sm text-stone-500">
                  {{ plan.bufferLabel }} · Créneau réservé : {{ plan.totalMinutes }} min
                </p>
              </div>

              <div class="flex items-center gap-3">
                <span class="text-base font-bold text-stone-900">
                  {{ plan.amountLabel }}
                </span>

                <div class="flex items-center gap-2">
                  <UButton
                    color="neutral"
                    variant="soft"
                    size="sm"
                    @click="openEditModal(plan)"
                  >
                    Modifier
                  </UButton>

                  <USwitch
                    :model-value="plan.isActive"
                    size="sm"
                    :disabled="pricing.isPlanUpdating(plan.id)"
                    @update:model-value="(value: boolean) => onToggleActive(plan, value)"
                  />
                </div>
              </div>
            </div>
          </UCard>
        </div>

        <!-- Add plan button -->
        <div class="flex justify-center">
          <UButton
            color="neutral"
            variant="soft"
            @click="openCreateModal"
          >
            <UIcon
              name="lucide:plus"
              class="mr-2 h-4 w-4"
            />
            Ajouter un plan tarifaire
          </UButton>
        </div>
      </section>
    </template>

    <!-- Create modal -->
    <ProviderCreateConsultationPricePlanModal
      :open="isCreateModalOpen"
      :suggested-sort-order="suggestedSortOrder"
      :loading="pricing.createPending.value"
      :error="pricing.createErrorMessage.value"
      :field-errors="pricing.createFieldErrors.value"
      @update:open="updateCreateModalOpen"
      @submit="onCreatePlan"
    />

    <!-- Edit modal -->
    <ProviderEditConsultationPricePlanModal
      v-if="editingPlan"
      :open="isEditModalOpen"
      :plan="editingPlan"
      :loading="pricing.isPlanUpdating(editingPlan.id)"
      :error="pricing.updateErrorMessage.value"
      @update:open="updateEditModalOpen"
      @submit="onEditPlan"
    />
  </div>
</template>
