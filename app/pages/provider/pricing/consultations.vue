<script setup lang="ts">
import SystemAlert from '../../../components/atoms/SystemAlert.vue'
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
  durationLabel: string
  amountLabel: string
  isActive: boolean
  sortOrder: number
  orderLabel: string
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
      durationLabel: `${plan.durationMinutes} min`,
      amountLabel: currencyFormatter.format(plan.amountCents / 100),
      isActive: plan.isActive,
      sortOrder: plan.sortOrder,
      orderLabel: `#${plan.sortOrder}`,
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

const updateNotice = computed(() => pricing.updateErrorMessage.value)

function statusPillClasses(isActive: boolean): string {
  if (isActive) {
    return 'border-[rgba(74,124,89,0.35)] bg-[rgba(74,124,89,0.12)] text-[color:var(--color-brand-primary)]'
  }
  return 'border-[rgba(148,139,132,0.35)] bg-[rgba(148,139,132,0.10)] text-[color:var(--color-brand-secondary)]'
}

function orderPillClasses(isActive: boolean): string {
  if (isActive) {
    return 'border-[rgba(178,120,88,0.35)] bg-[rgba(178,120,88,0.10)] text-[color:var(--color-brand-primary)]'
  }
  return 'border-[rgba(178,120,88,0.22)] bg-[rgba(178,120,88,0.06)] text-[color:var(--color-brand-secondary)]'
}

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
      color: 'primary'
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
      color: 'primary'
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
  <section class="grid gap-8">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="font-serif text-3xl italic leading-[var(--leading-tight)] text-[color:var(--color-brand-primary)]">
          Tarifs consultation
        </h1>
        <p class="mt-2 max-w-2xl text-sm text-[color:var(--color-brand-secondary)]">
          Gérez vos tarifs (durée + prix) et leur ordre d’affichage dans le parcours cliente.
        </p>
      </div>

      <div class="flex flex-wrap items-center justify-end gap-3">
        <UButton
          color="neutral"
          variant="ghost"
          class="rounded-full"
          :loading="pricing.pending.value"
          @click="pricing.refresh"
        >
          Rafraîchir
        </UButton>
        <UButton
          color="primary"
          class="rounded-full px-6"
          @click="openCreateModal"
        >
          Créer un tarif
        </UButton>
      </div>
    </div>

    <SystemAlert
      variant="info"
      title="Règle produit"
      description="Pour changer un prix ou une durée, créez un nouveau tarif puis désactivez l’ancien. Les tarifs inactifs n’apparaissent jamais côté cliente."
    />

    <SystemAlert
      v-if="pricing.errorMessage.value"
      variant="error"
      title="Impossible de charger les tarifs"
      :description="pricing.errorMessage.value"
    />

    <SystemAlert
      v-else-if="updateNotice"
      variant="error"
      title="Mise à jour impossible"
      :description="updateNotice"
    />

    <div
      v-else-if="pricing.pending.value"
      class="grid gap-4"
      role="status"
      aria-live="polite"
    >
      <div class="h-24 rounded-blob-a bg-[color:var(--color-surface-highlight)]" />
      <div class="h-24 rounded-blob-b bg-[color:var(--color-surface-highlight)]" />
    </div>

    <div
      v-else-if="displayPlans.length === 0"
      class="rounded-blob-c border border-[rgba(231,229,228,0.85)] bg-white/70 p-6 text-sm text-[color:var(--color-brand-secondary)]"
    >
      Aucun tarif n’a été configuré pour le moment.
    </div>

    <div v-else class="grid gap-3">
      <article
        v-for="plan in displayPlans"
        :key="plan.id"
        :ref="(el) => setPlanRef(plan.id, el)"
        class="grid gap-4 rounded-blob-c border border-[rgba(231,229,228,0.85)] bg-white/75 p-6 shadow-soft"
        :class="plan.id === highlightedPlanId ? 'ring-2 ring-[rgba(178,120,88,0.35)] ring-offset-2 ring-offset-[color:var(--color-surface)]' : ''"
      >
        <div class="grid gap-3">
          <div class="flex flex-wrap items-start justify-between gap-4">
            <div class="flex min-w-0 flex-wrap items-center gap-3">
              <h2 class="text-sm font-semibold text-[color:var(--color-brand-primary)]">
                {{ plan.label }}
              </h2>

              <span
                class="inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em]"
                :class="orderPillClasses(plan.isActive)"
                title="Ordre côté cliente (backend)"
              >
                {{ plan.orderLabel }}
              </span>

              <span
                class="inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em]"
                :class="statusPillClasses(plan.isActive)"
              >
                {{ plan.isActive ? 'Actif' : 'Inactif' }}
              </span>
            </div>

            <div class="flex flex-wrap items-center justify-end gap-2">
              <UButton
                icon="lucide:chevron-up"
                color="neutral"
                variant="ghost"
                class="rounded-full"
                :disabled="!plan.canMoveUp || isPlanBusy(plan)"
                :loading="pricing.isPlanUpdating(plan.id)"
                @click="onMove(plan, 'up')"
              />
              <UButton
                icon="lucide:chevron-down"
                color="neutral"
                variant="ghost"
                class="rounded-full"
                :disabled="!plan.canMoveDown || isPlanBusy(plan)"
                :loading="pricing.isPlanUpdating(plan.id)"
                @click="onMove(plan, 'down')"
              />
              <div class="flex items-center gap-2 rounded-full border border-[rgba(231,229,228,0.85)] bg-white/70 px-3 py-2">
                <USwitch
                  :model-value="plan.isActive"
                  size="lg"
                  :disabled="isPlanBusy(plan)"
                  @update:model-value="(value: boolean) => onToggleActive(plan, value)"
                />
                <span class="text-xs font-semibold text-[color:var(--color-brand-secondary)]">
                  Actif
                </span>
              </div>
            </div>
          </div>

          <p
            v-if="hasFieldErrors(plan.id)"
            class="text-xs font-bold text-[color:var(--color-error)]"
          >
            {{ getFieldError(plan.id, 'label') || getFieldError(plan.id, 'sortOrder') || getFieldError(plan.id, 'isActive') }}
          </p>

          <dl class="grid gap-2 rounded-blob-a bg-[color:var(--color-surface-highlight)] p-4 text-sm text-[color:var(--color-brand-primary)] sm:grid-cols-2">
            <div class="grid gap-1">
              <dt class="text-[10px] font-bold uppercase tracking-[0.22em] text-[color:var(--color-brand-muted)]">
                Durée
              </dt>
              <dd class="font-semibold">
                {{ plan.durationLabel }}
              </dd>
            </div>
            <div class="grid gap-1">
              <dt class="text-[10px] font-bold uppercase tracking-[0.22em] text-[color:var(--color-brand-muted)]">
                Prix
              </dt>
              <dd class="font-semibold">
                {{ plan.amountLabel }}
              </dd>
            </div>
          </dl>
        </div>
      </article>
    </div>

    <ProviderCreateConsultationPricePlanModal
      :open="isCreateModalOpen"
      :suggested-sort-order="suggestedSortOrder"
      :loading="pricing.createPending.value"
      :error="pricing.createErrorMessage.value"
      :field-errors="pricing.createFieldErrors.value"
      @update:open="updateCreateModalOpen"
      @submit="onCreatePlan"
    />
  </section>
</template>
