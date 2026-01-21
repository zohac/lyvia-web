<script setup lang="ts">
import ProviderCreateConsultationPricePlanModal from '../../../components/organisms/ProviderCreateConsultationPricePlanModal.vue'
import { useProviderConsultationPricing } from '../../../features/pricing/useProviderConsultationPricing'
import type { ComponentPublicInstance } from 'vue'

definePageMeta({
  layout: 'provider',
  middleware: 'auth-provider',
  pageTitle: 'Tarifs consultation'
})

const pricing = await useProviderConsultationPricing()
const toast = useToast()

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
  isActive: boolean
  sortOrder: number
  index: number
  canMoveUp: boolean
  canMoveDown: boolean
  prevId: string | null
  nextId: string | null
}

const displayPlans = computed<DisplayPlan[]>(() => {
  return pricing.plans.value.map((plan, index, array) => {
    const prev = array[index - 1] ?? null
    const next = array[index + 1] ?? null
    return {
      id: plan.id,
      label: plan.label,
      durationMinutes: plan.durationMinutes,
      durationLabel: `${plan.durationMinutes} min`,
      amountCents: plan.amountCents,
      amountLabel: currencyFormatter.format(plan.amountCents / 100),
      isActive: plan.isActive,
      sortOrder: plan.sortOrder,
      index,
      canMoveUp: Boolean(prev),
      canMoveDown: Boolean(next),
      prevId: prev?.id ?? null,
      nextId: next?.id ?? null
    }
  })
})

const suggestedSortOrder = computed(() => {
  if (pricing.plans.value.length === 0) return 0
  const maxSortOrder = Math.max(...pricing.plans.value.map(plan => plan.sortOrder))
  return Number.isFinite(maxSortOrder) ? maxSortOrder + 1 : 0
})

const isCreateModalOpen = ref(false)
const highlightedPlanId = ref<string | null>(null)
const planRefs = new Map<string, HTMLElement>()

function setPlanRef(planId: string, value: Element | ComponentPublicInstance | null) {
  if (value instanceof HTMLElement) {
    planRefs.set(planId, value)
    return
  }
  planRefs.delete(planId)
}

function openCreateModal() {
  pricing.clearCreateError()
  isCreateModalOpen.value = true
}

function updateCreateModalOpen(value: boolean) {
  if (pricing.createPending.value) return
  isCreateModalOpen.value = value
}

async function onCreatePlan(payload: { body: { label: string, durationMinutes: number, amountCents: number, sortOrder?: number } }) {
  const planId = await pricing.createPlan(payload.body)
  if (!planId) return

  isCreateModalOpen.value = false
  toast.add({
    title: 'Tarif créé',
    description: 'Le nouveau tarif est disponible dans la liste.',
    color: 'primary'
  })

  highlightedPlanId.value = planId
  await nextTick()

  const el = planRefs.get(planId)
  el?.scrollIntoView({ behavior: 'smooth', block: 'center' })

  window.setTimeout(() => {
    if (highlightedPlanId.value === planId) highlightedPlanId.value = null
  }, 2500)
}

function hasFieldErrors(planId: string): boolean {
  const errors = pricing.updateFieldErrors.value[planId]
  return Boolean(errors && Object.keys(errors).length > 0)
}

function getFieldError(planId: string, field: string): string | null {
  const errors = pricing.updateFieldErrors.value[planId]
  if (!errors) return null
  return errors[field] ?? null
}

function isPlanBusy(plan: DisplayPlan): boolean {
  if (pricing.isPlanUpdating(plan.id)) return true
  if (plan.prevId && pricing.isPlanUpdating(plan.prevId)) return true
  if (plan.nextId && pricing.isPlanUpdating(plan.nextId)) return true
  return false
}

async function onToggleActive(plan: DisplayPlan, nextActive: boolean) {
  const ok = await pricing.togglePlanActive(plan.id, nextActive)
  if (!ok) {
    toast.add({
      title: 'Action impossible',
      description: pricing.updateErrorMessage.value ?? 'Impossible de mettre à jour le tarif.',
      color: 'error'
    })
    return
  }

  toast.add({
    title: nextActive ? 'Tarif activé' : 'Tarif désactivé',
    description: nextActive ? 'Il est de nouveau disponible côté cliente.' : 'Il ne sera plus proposé côté cliente.',
    color: 'primary'
  })
}

async function onMove(plan: DisplayPlan, direction: 'up' | 'down') {
  const neighborId = direction === 'up' ? plan.prevId : plan.nextId
  if (!neighborId) return

  const ok = await pricing.swapPlanSortOrder(plan.id, neighborId)
  if (!ok) {
    toast.add({
      title: 'Action impossible',
      description: pricing.updateErrorMessage.value ?? 'Impossible de réordonner les tarifs.',
      color: 'error'
    })
    return
  }

  toast.add({
    title: 'Ordre mis à jour',
    description: 'Le parcours cliente suivra le nouvel ordre.',
    color: 'primary'
  })

  highlightedPlanId.value = plan.id
  await nextTick()
  const el = planRefs.get(plan.id)
  el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  window.setTimeout(() => {
    if (highlightedPlanId.value === plan.id) highlightedPlanId.value = null
  }, 2000)
}
</script>

<template>
  <div class="space-y-8">
    <!-- Page header -->
    <header class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 class="text-2xl font-semibold text-stone-900 sm:text-3xl">
          Tarifs consultation
        </h1>
        <p class="mt-1 text-stone-500">
          Gérez vos tarifs (durée + prix) et leur ordre d'affichage dans le parcours cliente.
        </p>
      </div>
      <div class="flex items-center gap-3">
        <UButton
          variant="outline"
          color="neutral"
          :loading="pricing.pending.value"
          @click="pricing.refresh"
        >
          <UIcon
            name="lucide:refresh-cw"
            class="mr-2 h-4 w-4"
          />
          Actualiser
        </UButton>
        <UButton
          color="primary"
          @click="openCreateModal"
        >
          <UIcon
            name="lucide:plus"
            class="mr-2 h-4 w-4"
          />
          Créer un tarif
        </UButton>
      </div>
    </header>

    <!-- Info alert -->
    <UAlert
      color="info"
      variant="soft"
      title="Règle produit"
      description="Pour changer un prix ou une durée, créez un nouveau tarif puis désactivez l'ancien. Les tarifs inactifs n'apparaissent jamais côté cliente."
      icon="i-lucide-info"
    />

    <!-- Error alerts -->
    <UAlert
      v-if="pricing.errorMessage.value"
      color="error"
      variant="soft"
      title="Impossible de charger les tarifs"
      :description="pricing.errorMessage.value"
      icon="i-lucide-alert-circle"
    />

    <UAlert
      v-else-if="pricing.updateErrorMessage.value"
      color="error"
      variant="soft"
      title="Mise à jour impossible"
      :description="pricing.updateErrorMessage.value"
      icon="i-lucide-alert-circle"
    />

    <!-- Loading skeleton -->
    <div
      v-else-if="pricing.pending.value"
      class="space-y-4"
    >
      <USkeleton
        v-for="i in 2"
        :key="i"
        class="h-32 w-full"
      />
    </div>

    <!-- Empty state -->
    <UCard
      v-else-if="displayPlans.length === 0"
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
            Aucun tarif configuré
          </p>
          <p class="mt-1 text-sm text-stone-500">
            Créez votre premier tarif pour commencer à recevoir des consultations.
          </p>
        </div>
        <UButton
          color="primary"
          @click="openCreateModal"
        >
          <UIcon
            name="lucide:plus"
            class="mr-2 h-4 w-4"
          />
          Créer un tarif
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
        :ref="(el) => setPlanRef(plan.id, el)"
        class="bg-white transition-all"
        :class="plan.id === highlightedPlanId ? 'ring-2 ring-crepuscule-400 ring-offset-2' : ''"
      >
        <div class="space-y-4">
          <!-- Plan header -->
          <div class="flex flex-wrap items-start justify-between gap-4">
            <div class="flex min-w-0 flex-wrap items-center gap-3">
              <h2 class="font-semibold text-stone-900">
                {{ plan.label }}
              </h2>

              <UBadge
                color="primary"
                variant="soft"
                size="sm"
              >
                #{{ plan.sortOrder }}
              </UBadge>

              <UBadge
                :color="plan.isActive ? 'success' : 'neutral'"
                variant="soft"
                size="sm"
              >
                <UIcon
                  :name="plan.isActive ? 'lucide:check-circle' : 'lucide:circle-off'"
                  class="mr-1 h-3 w-3"
                />
                {{ plan.isActive ? 'Actif' : 'Inactif' }}
              </UBadge>
            </div>

            <!-- Actions -->
            <div class="flex items-center gap-2">
              <UTooltip text="Monter">
                <UButton
                  icon="lucide:chevron-up"
                  color="neutral"
                  variant="ghost"
                  size="sm"
                  :disabled="!plan.canMoveUp || isPlanBusy(plan)"
                  :loading="pricing.isPlanUpdating(plan.id) && plan.canMoveUp"
                  @click="onMove(plan, 'up')"
                />
              </UTooltip>
              <UTooltip text="Descendre">
                <UButton
                  icon="lucide:chevron-down"
                  color="neutral"
                  variant="ghost"
                  size="sm"
                  :disabled="!plan.canMoveDown || isPlanBusy(plan)"
                  :loading="pricing.isPlanUpdating(plan.id) && plan.canMoveDown"
                  @click="onMove(plan, 'down')"
                />
              </UTooltip>

              <div class="ml-2 flex items-center gap-2 rounded-lg border border-stone-200 bg-stone-50 px-3 py-2">
                <USwitch
                  :model-value="plan.isActive"
                  size="sm"
                  :disabled="isPlanBusy(plan)"
                  @update:model-value="(value: boolean) => onToggleActive(plan, value)"
                />
                <span class="text-xs font-medium text-stone-600">
                  Actif
                </span>
              </div>
            </div>
          </div>

          <!-- Field errors -->
          <UAlert
            v-if="hasFieldErrors(plan.id)"
            color="error"
            variant="soft"
            :description="getFieldError(plan.id, 'label') || getFieldError(plan.id, 'sortOrder') || getFieldError(plan.id, 'isActive') || 'Erreur de validation'"
            icon="i-lucide-alert-circle"
          />

          <!-- Plan details -->
          <div class="grid gap-4 rounded-lg bg-stone-50 p-4 sm:grid-cols-2">
            <div>
              <p class="text-xs font-medium uppercase tracking-wider text-stone-500">
                Durée
              </p>
              <p class="mt-1 text-lg font-semibold text-stone-900">
                {{ plan.durationLabel }}
              </p>
            </div>
            <div>
              <p class="text-xs font-medium uppercase tracking-wider text-stone-500">
                Prix
              </p>
              <p class="mt-1 text-lg font-semibold text-stone-900">
                {{ plan.amountLabel }}
              </p>
            </div>
          </div>
        </div>
      </UCard>
    </div>

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
  </div>
</template>
