<script setup lang="ts">
import SystemAlert from '../../components/atoms/SystemAlert.vue'
import ConfirmActionModal from '../../components/molecules/ConfirmActionModal.vue'
import ProviderAvailabilitySlotsPreview from '../../components/organisms/ProviderAvailabilitySlotsPreview.vue'
import { useProviderAvailability } from '../../features/availability/useProviderAvailability'

definePageMeta({
  layout: 'provider',
  middleware: 'auth-provider',
  pageTitle: 'Disponibilités'
})

const {
  errorMessage,
  actionErrorMessage,
  noticeMessage,
  pending,
  refresh,
  sortedBlocks,
  hasRules,
  hasBlocks,
  groupedRules,
  upcomingBlocks,
  weekdayLabel,
  appointmentTypeLabel,
  blockTypeLabel,
  formatBlockReason,
  formatDateTime,
  normalizeRuleTime,
  previewType,
  previewPeriodDays,
  previewError,
  previewPending,
  timezone,
  slotGroups,
  refreshSlotsPreview,
  createRuleModalOpen,
  createRuleError,
  isCreatingRule,
  createRuleApplyToAllTypes,
  createRuleDurationByType,
  createRuleDurationErrors,
  createRuleForm,
  createRuleFieldErrors,
  openCreateRuleModal,
  submitCreateRule,
  updateRuleModalOpen,
  updateRuleError,
  isUpdatingRule,
  updatingRuleId,
  updateRuleForm,
  updateRuleFieldErrors,
  openUpdateRuleModal,
  submitUpdateRule,
  setRuleActive,
  deleteRuleModalOpen,
  deleteRuleError,
  deletingRuleId,
  ruleBeingDeleted,
  openDeleteRuleModal,
  confirmDeleteRule,
  copyRulesModalOpen,
  copyRulesError,
  isCopyingRules,
  copyRulesDirection,
  copyRulesAdaptDurations,
  copyRulesSummary,
  openCopyRulesModal,
  confirmCopyRules,
  createBlockModalOpen,
  createBlockError,
  isCreatingBlock,
  createBlockForm,
  createBlockFieldErrors,
  openCreateBlockModal,
  submitCreateBlock,
  deleteBlockModalOpen,
  deleteBlockError,
  deletingBlockId,
  blockBeingDeleted,
  openDeleteBlockModal,
  confirmDeleteBlock
} = await useProviderAvailability()
</script>

<template>
  <div class="grid gap-10">
    <UModal
      v-model:open="createBlockModalOpen"
      :dismissible="!isCreatingBlock"
      :ui="{
        content:
          'rounded-blob-c border border-white/70 bg-white/80 shadow-floating backdrop-blur-md',
        header: 'px-8 pt-8 pb-4',
        body: 'px-8 pb-6',
        footer: 'px-8 pb-8 pt-6',
        title:
          'font-serif italic text-2xl leading-[var(--leading-tight)] text-[color:var(--color-brand-primary)]',
        description: 'text-sm text-[color:var(--color-brand-secondary)]'
      }"
      :close="{ class: 'rounded-full' }"
      title="Ajouter un blocage"
      description="Bloquez un créneau ponctuel (Europe/Paris)."
    >
      <template #body>
        <SystemAlert
          v-if="createBlockError"
          class="mb-5"
          variant="error"
          title="Création impossible"
          :description="createBlockError"
        />

        <form
          class="grid gap-6"
          @submit.prevent="submitCreateBlock"
        >
          <div class="grid gap-4 sm:grid-cols-2">
            <div class="grid gap-2">
              <label class="text-xs font-bold uppercase tracking-[0.22em] text-[color:var(--color-brand-muted)]">
                Début
              </label>
              <input
                v-model="createBlockForm.startAt"
                type="datetime-local"
                class="h-11 rounded-full border border-white/60 bg-white/70 px-4 text-sm font-semibold text-[color:var(--color-brand-primary)] shadow-soft transition-base focus:outline-none focus:ring-4 focus:ring-[rgba(212,184,160,0.35)]"
                :disabled="isCreatingBlock"
              >
              <p
                v-if="createBlockFieldErrors.startAt"
                class="text-xs text-[color:var(--color-error)]"
              >
                {{ createBlockFieldErrors.startAt }}
              </p>
            </div>

            <div class="grid gap-2">
              <label class="text-xs font-bold uppercase tracking-[0.22em] text-[color:var(--color-brand-muted)]">
                Fin
              </label>
              <input
                v-model="createBlockForm.endAt"
                type="datetime-local"
                class="h-11 rounded-full border border-white/60 bg-white/70 px-4 text-sm font-semibold text-[color:var(--color-brand-primary)] shadow-soft transition-base focus:outline-none focus:ring-4 focus:ring-[rgba(212,184,160,0.35)]"
                :disabled="isCreatingBlock"
              >
              <p
                v-if="createBlockFieldErrors.endAt"
                class="text-xs text-[color:var(--color-error)]"
              >
                {{ createBlockFieldErrors.endAt }}
              </p>
            </div>
          </div>

          <div class="grid gap-2">
            <label class="text-xs font-bold uppercase tracking-[0.22em] text-[color:var(--color-brand-muted)]">
              Type
            </label>
            <select
              v-model="createBlockForm.blockType"
              class="h-11 rounded-full border border-white/60 bg-white/70 px-4 text-sm font-semibold text-[color:var(--color-brand-primary)] shadow-soft transition-base focus:outline-none focus:ring-4 focus:ring-[rgba(212,184,160,0.35)]"
              :disabled="isCreatingBlock"
            >
              <option value="all">
                Tout
              </option>
              <option value="discovery">
                Discovery
              </option>
              <option value="consultation">
                Consultation
              </option>
            </select>
            <p
              v-if="createBlockFieldErrors.blockType"
              class="text-xs text-[color:var(--color-error)]"
            >
              {{ createBlockFieldErrors.blockType }}
            </p>
          </div>

          <div class="grid gap-2">
            <label class="text-xs font-bold uppercase tracking-[0.22em] text-[color:var(--color-brand-muted)]">
              Raison (optionnel)
            </label>
            <textarea
              v-model="createBlockForm.reason"
              rows="4"
              class="min-h-[110px] w-full resize-none rounded-blob-d border border-white/60 bg-white/70 px-4 py-3 text-sm font-medium text-[color:var(--color-brand-primary)] shadow-soft transition-base focus:outline-none focus:ring-4 focus:ring-[rgba(212,184,160,0.35)]"
              :disabled="isCreatingBlock"
              placeholder="Vacances, indisponibilité…"
            />
            <p
              v-if="createBlockFieldErrors.reason"
              class="text-xs text-[color:var(--color-error)]"
            >
              {{ createBlockFieldErrors.reason }}
            </p>
          </div>
        </form>
      </template>

      <template #footer>
        <div class="flex flex-wrap justify-end gap-3">
          <UButton
            color="neutral"
            variant="ghost"
            class="rounded-full"
            :disabled="isCreatingBlock"
            @click="createBlockModalOpen = false"
          >
            Annuler
          </UButton>
          <UButton
            color="primary"
            class="rounded-full px-6"
            :loading="isCreatingBlock"
            @click="submitCreateBlock"
          >
            Ajouter
          </UButton>
        </div>
      </template>
    </UModal>

    <ConfirmActionModal
      v-model:open="deleteBlockModalOpen"
      title="Supprimer ce blocage ?"
      :description="blockBeingDeleted ? `${formatDateTime(blockBeingDeleted.startAt)} → ${formatDateTime(blockBeingDeleted.endAt)} • ${blockTypeLabel(blockBeingDeleted)}${formatBlockReason(blockBeingDeleted.reason) ? ` • ${formatBlockReason(blockBeingDeleted.reason)}` : ''}` : 'Ce blocage sera supprimé définitivement.'"
      confirm-label="Supprimer"
      :loading="Boolean(deletingBlockId)"
      :error="deleteBlockError"
      @confirm="confirmDeleteBlock"
    />

    <UModal
      v-model:open="createRuleModalOpen"
      :dismissible="!isCreatingRule"
      :ui="{
        content:
          'rounded-blob-c border border-white/70 bg-white/80 shadow-floating backdrop-blur-md',
        header: 'px-8 pt-8 pb-4',
        body: 'px-8 pb-6',
        footer: 'px-8 pb-8 pt-6',
        title:
          'font-serif italic text-2xl leading-[var(--leading-tight)] text-[color:var(--color-brand-primary)]',
        description: 'text-sm text-[color:var(--color-brand-secondary)]'
      }"
      :close="{ class: 'rounded-full' }"
      title="Ajouter une règle"
      description="Créez une règle récurrente (Europe/Paris)."
    >
      <template #body>
        <SystemAlert
          v-if="createRuleError"
          class="mb-5"
          variant="error"
          title="Création impossible"
          :description="createRuleError"
        />

        <form
          class="grid gap-6"
          @submit.prevent="submitCreateRule"
        >
          <div class="grid gap-2">
            <label class="text-xs font-bold uppercase tracking-[0.22em] text-[color:var(--color-brand-muted)]">
              Type
            </label>
            <select
              v-model="createRuleForm.appointmentType"
              class="h-11 rounded-full border border-white/60 bg-white/70 px-4 text-sm font-semibold text-[color:var(--color-brand-primary)] shadow-soft transition-base focus:outline-none focus:ring-4 focus:ring-[rgba(212,184,160,0.35)]"
              :disabled="isCreatingRule || createRuleApplyToAllTypes"
            >
              <option value="discovery">
                Discovery
              </option>
              <option value="consultation">
                Consultation
              </option>
            </select>
            <p
              v-if="createRuleFieldErrors.appointmentType"
              class="text-xs text-[color:var(--color-error)]"
            >
              {{ createRuleFieldErrors.appointmentType }}
            </p>
            <p
              v-if="createRuleApplyToAllTypes"
              class="text-xs text-[color:var(--color-brand-secondary)]"
            >
              Les deux types (Discovery + Consultation) seront créés.
            </p>
          </div>

          <div class="flex flex-col justify-between gap-4 rounded-blob-d border border-[rgba(231,229,228,0.75)] bg-[color:var(--color-surface-highlight)] p-4 md:flex-row md:items-center">
            <div class="min-w-0">
              <span class="block font-bold text-[color:var(--color-brand-primary)]">
                Appliquer à tous les types
              </span>
              <span class="text-xs text-[color:var(--color-brand-secondary)]">
                Crée la règle pour Discovery et Consultation en une seule action.
              </span>
            </div>
            <USwitch
              v-model="createRuleApplyToAllTypes"
              size="lg"
              color="primary"
              :disabled="isCreatingRule"
              class="self-start md:self-auto"
            />
          </div>

          <div class="grid gap-2">
            <label class="text-xs font-bold uppercase tracking-[0.22em] text-[color:var(--color-brand-muted)]">
              Jour
            </label>
            <select
              v-model.number="createRuleForm.weekday"
              class="h-11 rounded-full border border-white/60 bg-white/70 px-4 text-sm font-semibold text-[color:var(--color-brand-primary)] shadow-soft transition-base focus:outline-none focus:ring-4 focus:ring-[rgba(212,184,160,0.35)]"
              :disabled="isCreatingRule"
            >
              <option :value="1">
                Lundi
              </option>
              <option :value="2">
                Mardi
              </option>
              <option :value="3">
                Mercredi
              </option>
              <option :value="4">
                Jeudi
              </option>
              <option :value="5">
                Vendredi
              </option>
              <option :value="6">
                Samedi
              </option>
              <option :value="7">
                Dimanche
              </option>
            </select>
            <p
              v-if="createRuleFieldErrors.weekday"
              class="text-xs text-[color:var(--color-error)]"
            >
              {{ createRuleFieldErrors.weekday }}
            </p>
          </div>

          <div class="grid gap-4 sm:grid-cols-2">
            <div class="grid gap-2">
              <label class="text-xs font-bold uppercase tracking-[0.22em] text-[color:var(--color-brand-muted)]">
                Début
              </label>
              <input
                v-model="createRuleForm.startTime"
                type="time"
                step="60"
                class="h-11 rounded-full border border-white/60 bg-white/70 px-4 text-sm font-semibold text-[color:var(--color-brand-primary)] shadow-soft transition-base focus:outline-none focus:ring-4 focus:ring-[rgba(212,184,160,0.35)]"
                :disabled="isCreatingRule"
              >
              <p
                v-if="createRuleFieldErrors.startTime"
                class="text-xs text-[color:var(--color-error)]"
              >
                {{ createRuleFieldErrors.startTime }}
              </p>
            </div>

            <div class="grid gap-2">
              <label class="text-xs font-bold uppercase tracking-[0.22em] text-[color:var(--color-brand-muted)]">
                Fin
              </label>
              <input
                v-model="createRuleForm.endTime"
                type="time"
                step="60"
                class="h-11 rounded-full border border-white/60 bg-white/70 px-4 text-sm font-semibold text-[color:var(--color-brand-primary)] shadow-soft transition-base focus:outline-none focus:ring-4 focus:ring-[rgba(212,184,160,0.35)]"
                :disabled="isCreatingRule"
              >
              <p
                v-if="createRuleFieldErrors.endTime"
                class="text-xs text-[color:var(--color-error)]"
              >
                {{ createRuleFieldErrors.endTime }}
              </p>
            </div>
          </div>

          <div
            v-if="!createRuleApplyToAllTypes"
            class="grid gap-2"
          >
            <label class="text-xs font-bold uppercase tracking-[0.22em] text-[color:var(--color-brand-muted)]">
              Durée (minutes)
            </label>
            <input
              v-model.number="createRuleForm.slotDurationMinutes"
              type="number"
              min="1"
              class="h-11 rounded-full border border-white/60 bg-white/70 px-4 text-sm font-semibold text-[color:var(--color-brand-primary)] shadow-soft transition-base focus:outline-none focus:ring-4 focus:ring-[rgba(212,184,160,0.35)]"
              :disabled="isCreatingRule"
            >
            <p
              v-if="createRuleFieldErrors.slotDurationMinutes"
              class="text-xs text-[color:var(--color-error)]"
            >
              {{ createRuleFieldErrors.slotDurationMinutes }}
            </p>
          </div>

          <div
            v-else
            class="grid gap-4"
          >
            <p class="text-xs font-bold uppercase tracking-[0.22em] text-[color:var(--color-brand-muted)]">
              Durées par type (minutes)
            </p>
            <div class="grid gap-6 md:grid-cols-2">
              <div class="grid gap-2">
                <label class="text-xs font-bold uppercase tracking-[0.22em] text-[color:var(--color-brand-muted)]">
                  Discovery
                </label>
                <input
                  v-model.number="createRuleDurationByType.discovery"
                  type="number"
                  min="1"
                  class="h-11 rounded-full border border-white/60 bg-white/70 px-4 text-sm font-semibold text-[color:var(--color-brand-primary)] shadow-soft transition-base focus:outline-none focus:ring-4 focus:ring-[rgba(212,184,160,0.35)]"
                  :disabled="isCreatingRule"
                >
                <p
                  v-if="createRuleDurationErrors.discovery"
                  class="text-xs text-[color:var(--color-error)]"
                >
                  {{ createRuleDurationErrors.discovery }}
                </p>
              </div>

              <div class="grid gap-2">
                <label class="text-xs font-bold uppercase tracking-[0.22em] text-[color:var(--color-brand-muted)]">
                  Consultation
                </label>
                <input
                  v-model.number="createRuleDurationByType.consultation"
                  type="number"
                  min="1"
                  class="h-11 rounded-full border border-white/60 bg-white/70 px-4 text-sm font-semibold text-[color:var(--color-brand-primary)] shadow-soft transition-base focus:outline-none focus:ring-4 focus:ring-[rgba(212,184,160,0.35)]"
                  :disabled="isCreatingRule"
                >
                <p
                  v-if="createRuleDurationErrors.consultation"
                  class="text-xs text-[color:var(--color-error)]"
                >
                  {{ createRuleDurationErrors.consultation }}
                </p>
              </div>
            </div>
          </div>

          <div class="flex flex-col justify-between gap-4 rounded-blob-d border border-[rgba(231,229,228,0.75)] bg-[color:var(--color-surface-highlight)] p-4 md:flex-row md:items-center">
            <div class="min-w-0">
              <span class="block font-bold text-[color:var(--color-brand-primary)]">
                Activer la règle
              </span>
              <span class="text-xs text-[color:var(--color-brand-secondary)]">
                Désactivez temporairement une règle sans la supprimer.
              </span>
            </div>
            <USwitch
              v-model="createRuleForm.isActive"
              size="lg"
              color="primary"
              :disabled="isCreatingRule"
              class="self-start md:self-auto"
            />
          </div>
          <p
            v-if="createRuleFieldErrors.isActive"
            class="text-xs text-[color:var(--color-error)]"
          >
            {{ createRuleFieldErrors.isActive }}
          </p>
        </form>
      </template>

      <template #footer>
        <div class="flex flex-wrap justify-end gap-3">
          <UButton
            color="neutral"
            variant="ghost"
            class="rounded-full"
            :disabled="isCreatingRule"
            @click="createRuleModalOpen = false"
          >
            Annuler
          </UButton>
          <UButton
            color="primary"
            class="rounded-full px-6"
            :loading="isCreatingRule"
            @click="submitCreateRule"
          >
            Ajouter
          </UButton>
        </div>
      </template>
    </UModal>

    <UModal
      v-model:open="updateRuleModalOpen"
      :dismissible="!isUpdatingRule"
      :ui="{
        content:
          'rounded-blob-c border border-white/70 bg-white/80 shadow-floating backdrop-blur-md',
        header: 'px-8 pt-8 pb-4',
        body: 'px-8 pb-6',
        footer: 'px-8 pb-8 pt-6',
        title:
          'font-serif italic text-2xl leading-[var(--leading-tight)] text-[color:var(--color-brand-primary)]',
        description: 'text-sm text-[color:var(--color-brand-secondary)]'
      }"
      :close="{ class: 'rounded-full' }"
      title="Modifier une règle"
      description="Ajustez votre règle récurrente (Europe/Paris)."
    >
      <template #body>
        <SystemAlert
          v-if="updateRuleError"
          class="mb-5"
          variant="error"
          title="Modification impossible"
          :description="updateRuleError"
        />

        <form
          class="grid gap-6"
          @submit.prevent="submitUpdateRule"
        >
          <div class="grid gap-2">
            <label class="text-xs font-bold uppercase tracking-[0.22em] text-[color:var(--color-brand-muted)]">
              Type
            </label>
            <select
              v-model="updateRuleForm.appointmentType"
              class="h-11 rounded-full border border-white/60 bg-white/70 px-4 text-sm font-semibold text-[color:var(--color-brand-primary)] shadow-soft transition-base focus:outline-none focus:ring-4 focus:ring-[rgba(212,184,160,0.35)]"
              :disabled="isUpdatingRule"
            >
              <option value="discovery">
                Discovery
              </option>
              <option value="consultation">
                Consultation
              </option>
            </select>
            <p
              v-if="updateRuleFieldErrors.appointmentType"
              class="text-xs text-[color:var(--color-error)]"
            >
              {{ updateRuleFieldErrors.appointmentType }}
            </p>
          </div>

          <div class="grid gap-2">
            <label class="text-xs font-bold uppercase tracking-[0.22em] text-[color:var(--color-brand-muted)]">
              Jour
            </label>
            <select
              v-model.number="updateRuleForm.weekday"
              class="h-11 rounded-full border border-white/60 bg-white/70 px-4 text-sm font-semibold text-[color:var(--color-brand-primary)] shadow-soft transition-base focus:outline-none focus:ring-4 focus:ring-[rgba(212,184,160,0.35)]"
              :disabled="isUpdatingRule"
            >
              <option
                v-for="weekday in [1, 2, 3, 4, 5, 6, 7]"
                :key="weekday"
                :value="weekday"
              >
                {{ weekdayLabel(weekday) }}
              </option>
            </select>
            <p
              v-if="updateRuleFieldErrors.weekday"
              class="text-xs text-[color:var(--color-error)]"
            >
              {{ updateRuleFieldErrors.weekday }}
            </p>
          </div>

          <div class="grid gap-6 md:grid-cols-2">
            <div class="grid gap-2">
              <label class="text-xs font-bold uppercase tracking-[0.22em] text-[color:var(--color-brand-muted)]">
                Début
              </label>
              <input
                v-model="updateRuleForm.startTime"
                type="time"
                step="60"
                class="h-11 rounded-full border border-white/60 bg-white/70 px-4 text-sm font-semibold text-[color:var(--color-brand-primary)] shadow-soft transition-base focus:outline-none focus:ring-4 focus:ring-[rgba(212,184,160,0.35)]"
                :disabled="isUpdatingRule"
              >
              <p
                v-if="updateRuleFieldErrors.startTime"
                class="text-xs text-[color:var(--color-error)]"
              >
                {{ updateRuleFieldErrors.startTime }}
              </p>
            </div>

            <div class="grid gap-2">
              <label class="text-xs font-bold uppercase tracking-[0.22em] text-[color:var(--color-brand-muted)]">
                Fin
              </label>
              <input
                v-model="updateRuleForm.endTime"
                type="time"
                step="60"
                class="h-11 rounded-full border border-white/60 bg-white/70 px-4 text-sm font-semibold text-[color:var(--color-brand-primary)] shadow-soft transition-base focus:outline-none focus:ring-4 focus:ring-[rgba(212,184,160,0.35)]"
                :disabled="isUpdatingRule"
              >
              <p
                v-if="updateRuleFieldErrors.endTime"
                class="text-xs text-[color:var(--color-error)]"
              >
                {{ updateRuleFieldErrors.endTime }}
              </p>
            </div>
          </div>

          <div class="grid gap-2">
            <label class="text-xs font-bold uppercase tracking-[0.22em] text-[color:var(--color-brand-muted)]">
              Durée (minutes)
            </label>
            <input
              v-model.number="updateRuleForm.slotDurationMinutes"
              type="number"
              min="1"
              class="h-11 rounded-full border border-white/60 bg-white/70 px-4 text-sm font-semibold text-[color:var(--color-brand-primary)] shadow-soft transition-base focus:outline-none focus:ring-4 focus:ring-[rgba(212,184,160,0.35)]"
              :disabled="isUpdatingRule"
            >
            <p
              v-if="updateRuleFieldErrors.slotDurationMinutes"
              class="text-xs text-[color:var(--color-error)]"
            >
              {{ updateRuleFieldErrors.slotDurationMinutes }}
            </p>
          </div>

          <div class="flex flex-col justify-between gap-4 rounded-blob-d border border-[rgba(231,229,228,0.75)] bg-[color:var(--color-surface-highlight)] p-4 md:flex-row md:items-center">
            <div class="min-w-0">
              <span class="block font-bold text-[color:var(--color-brand-primary)]">
                Activer la règle
              </span>
              <span class="text-xs text-[color:var(--color-brand-secondary)]">
                Désactivez temporairement une règle sans la supprimer.
              </span>
            </div>
            <USwitch
              v-model="updateRuleForm.isActive"
              size="lg"
              color="primary"
              :disabled="isUpdatingRule"
              class="self-start md:self-auto"
            />
          </div>
          <p
            v-if="updateRuleFieldErrors.isActive"
            class="text-xs text-[color:var(--color-error)]"
          >
            {{ updateRuleFieldErrors.isActive }}
          </p>
        </form>
      </template>

      <template #footer>
        <div class="flex flex-wrap justify-end gap-3">
          <UButton
            color="neutral"
            variant="ghost"
            class="rounded-full"
            :disabled="isUpdatingRule"
            @click="updateRuleModalOpen = false"
          >
            Annuler
          </UButton>
          <UButton
            color="primary"
            class="rounded-full px-6"
            :loading="isUpdatingRule"
            @click="submitUpdateRule"
          >
            Enregistrer
          </UButton>
        </div>
      </template>
    </UModal>

    <ConfirmActionModal
      v-model:open="deleteRuleModalOpen"
      title="Supprimer cette règle ?"
      :description="ruleBeingDeleted ? `${weekdayLabel(ruleBeingDeleted.weekday)} • ${normalizeRuleTime(ruleBeingDeleted.startTime)}–${normalizeRuleTime(ruleBeingDeleted.endTime)} (${ruleBeingDeleted.slotDurationMinutes} min)` : 'Cette règle sera supprimée définitivement.'"
      confirm-label="Supprimer"
      :loading="Boolean(deletingRuleId)"
      :error="deleteRuleError"
      @confirm="confirmDeleteRule"
    />

    <UModal
      v-model:open="copyRulesModalOpen"
      :dismissible="!isCopyingRules"
      :ui="{
        content:
          'rounded-blob-c border border-white/70 bg-white/80 shadow-floating backdrop-blur-md',
        header: 'px-8 pt-8 pb-4',
        body: 'px-8 pb-6',
        footer: 'px-8 pb-8 pt-6',
        title:
          'font-serif italic text-2xl leading-[var(--leading-tight)] text-[color:var(--color-brand-primary)]',
        description: 'text-sm text-[color:var(--color-brand-secondary)]'
      }"
      :close="{ class: 'rounded-full' }"
      title="Copier un planning"
      description="Dupliquez vos règles d’un type de rendez-vous à l’autre."
    >
      <template #body>
        <SystemAlert
          v-if="copyRulesError"
          class="mb-5"
          variant="error"
          title="Copie impossible"
          :description="copyRulesError"
        />

        <div class="grid gap-6">
          <div class="grid gap-2">
            <label class="text-xs font-bold uppercase tracking-[0.22em] text-[color:var(--color-brand-muted)]">
              Copier
            </label>
            <select
              v-model="copyRulesDirection"
              class="h-11 rounded-full border border-white/60 bg-white/70 px-4 text-sm font-semibold text-[color:var(--color-brand-primary)] shadow-soft transition-base focus:outline-none focus:ring-4 focus:ring-[rgba(212,184,160,0.35)]"
              :disabled="isCopyingRules"
            >
              <option value="discovery-to-consultation">
                Discovery → Consultation
              </option>
              <option value="consultation-to-discovery">
                Consultation → Discovery
              </option>
            </select>
          </div>

          <div class="rounded-blob-d border border-[rgba(231,229,228,0.8)] bg-[color:var(--color-surface-highlight)] p-4 text-sm text-[color:var(--color-brand-secondary)]">
            <p class="font-semibold text-[color:var(--color-brand-primary)]">
              Résumé
            </p>
            <p class="mt-2">
              {{ copyRulesSummary.sourceCount }} règle(s) source • {{ copyRulesSummary.targetCount }} règle(s) déjà configurée(s) côté cible
            </p>
            <p
              v-if="copyRulesSummary.duplicatesCount"
              class="mt-2 text-xs text-[color:var(--color-brand-secondary)]"
            >
              {{ copyRulesSummary.duplicatesCount }} créneau(x) identique(s) détecté(s) et ignoré(s).
            </p>
          </div>

          <div class="flex flex-col justify-between gap-4 rounded-blob-d border border-[rgba(231,229,228,0.75)] bg-[color:var(--color-surface-highlight)] p-4 md:flex-row md:items-center">
            <div class="min-w-0">
              <span class="block font-bold text-[color:var(--color-brand-primary)]">
                Adapter aux durées recommandées
              </span>
              <span class="text-xs text-[color:var(--color-brand-secondary)]">
                Discovery : 30 min • Consultation : 60 min.
              </span>
            </div>
            <USwitch
              v-model="copyRulesAdaptDurations"
              size="lg"
              color="primary"
              :disabled="isCopyingRules"
              class="self-start md:self-auto"
            />
          </div>
        </div>
      </template>

      <template #footer>
        <div class="flex flex-wrap justify-end gap-3">
          <UButton
            color="neutral"
            variant="ghost"
            class="rounded-full"
            :disabled="isCopyingRules"
            @click="copyRulesModalOpen = false"
          >
            Annuler
          </UButton>
          <UButton
            color="primary"
            class="rounded-full px-6"
            :loading="isCopyingRules"
            @click="confirmCopyRules"
          >
            Copier
          </UButton>
        </div>
      </template>
    </UModal>

    <SystemAlert
      v-if="errorMessage"
      variant="error"
      title="Disponibilités indisponibles"
      :description="errorMessage"
    />
    <SystemAlert
      v-if="actionErrorMessage"
      variant="error"
      title="Action impossible"
      :description="actionErrorMessage"
    />
    <SystemAlert
      v-if="noticeMessage"
      variant="success"
      :description="noticeMessage"
    />

    <section class="relative flex flex-col items-start justify-between gap-6 pl-6 md:flex-row md:items-end">
      <div class="absolute left-0 top-2 h-[90%] w-1.5 rounded-full bg-gradient-to-b from-[color:var(--color-brand-solid)] via-[rgba(212,184,160,0.35)] to-transparent opacity-70" />

      <div class="grid gap-2">
        <h1 class="font-serif text-4xl italic leading-[var(--leading-tight)] text-[color:var(--color-brand-primary)] md:text-5xl">
          Disponibilités
        </h1>
        <p class="text-lg font-medium text-[color:var(--color-brand-secondary)]">
          Définissez vos règles hebdomadaires, puis ajoutez des blocages ponctuels si besoin.
        </p>
      </div>

      <button
        type="button"
        class="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-white px-5 text-sm font-bold text-[color:var(--color-brand-primary)] shadow-soft ring-1 ring-[rgba(231,229,228,0.7)] transition-base hover:shadow-floating disabled:cursor-not-allowed disabled:opacity-60"
        :disabled="pending"
        @click="() => refresh()"
      >
        <Icon
          name="lucide:refresh-ccw"
          size="16"
          aria-hidden="true"
        />
        Actualiser
      </button>
    </section>

    <div class="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-10">
      <section class="space-y-8 lg:col-span-8">
        <div class="rounded-blob-a border border-white/60 bg-white/70 shadow-soft backdrop-blur">
          <div class="flex flex-col gap-4 border-b border-[rgba(231,229,228,0.7)] px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div class="grid gap-1">
              <h2 class="font-serif text-2xl italic text-[color:var(--color-brand-primary)]">
                Règles récurrentes hebdomadaires
              </h2>
              <p class="text-sm text-[color:var(--color-brand-secondary)]">
                Vos créneaux récurrents (Europe/Paris). La génération des slots est calculée côté backend.
              </p>
            </div>

            <div class="flex flex-wrap items-center justify-end gap-3">
              <button
                type="button"
                class="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-white px-4 text-sm font-bold text-[color:var(--color-brand-primary)] shadow-soft ring-1 ring-[rgba(231,229,228,0.7)] transition-base hover:shadow-floating disabled:cursor-not-allowed disabled:opacity-60"
                :disabled="pending || Boolean(errorMessage)"
                @click="openCopyRulesModal()"
              >
                <Icon
                  name="lucide:copy"
                  size="18"
                  aria-hidden="true"
                />
                Copier depuis…
              </button>

              <button
                type="button"
                class="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-[color:var(--color-accent-main)] px-4 text-sm font-bold text-[color:var(--color-accent-contrast)] shadow-floating transition-base hover:bg-[color:var(--color-accent-hover)] disabled:cursor-not-allowed disabled:opacity-60"
                :disabled="pending || Boolean(errorMessage)"
                @click="openCreateRuleModal"
              >
                <Icon
                  name="lucide:plus"
                  size="18"
                  aria-hidden="true"
                />
                Ajouter une règle
              </button>
            </div>
          </div>

          <div class="px-6 py-6">
            <div
              v-if="pending"
              class="grid gap-4"
            >
              <div class="h-16 rounded-blob-d bg-[rgba(231,229,228,0.55)]" />
              <div class="h-16 rounded-blob-d bg-[rgba(231,229,228,0.35)]" />
            </div>

            <div
              v-else-if="!hasRules"
              class="rounded-blob-d border border-[rgba(231,229,228,0.8)] bg-[color:var(--color-surface-highlight)] p-6 text-sm text-[color:var(--color-brand-secondary)]"
            >
              Aucune règle configurée pour le moment. Ajoutez vos plages horaires récurrentes pour générer des créneaux.
            </div>

            <div
              v-else
              class="grid gap-6"
            >
              <div
                v-for="group in groupedRules"
                :key="group.weekday"
                class="rounded-blob-d border border-white/60 bg-white/60 p-5 shadow-soft"
              >
                <div class="flex items-center justify-between gap-3">
                  <p class="font-semibold text-[color:var(--color-brand-primary)]">
                    {{ weekdayLabel(group.weekday) }}
                  </p>
                  <span class="rounded-full bg-[rgba(212,184,160,0.20)] px-3 py-1 text-xs font-bold text-[color:var(--color-brand-primary)]">
                    {{
                      group.groups.reduce((count, typeGroup) => count + typeGroup.rules.length, 0)
                    }}
                  </span>
                </div>

                <div class="mt-4 grid gap-5">
                  <section
                    v-for="typeGroup in group.groups"
                    :key="typeGroup.type"
                    class="rounded-blob-d border border-white/55 bg-white/65 p-4 shadow-soft"
                  >
                    <div class="flex items-center justify-between gap-3">
                      <p class="text-sm font-bold uppercase tracking-[0.22em] text-[color:var(--color-brand-muted)]">
                        {{ appointmentTypeLabel(typeGroup.type) }}
                      </p>
                      <span class="rounded-full bg-[rgba(212,184,160,0.20)] px-3 py-1 text-xs font-bold text-[color:var(--color-brand-primary)]">
                        {{ typeGroup.rules.length }}
                      </span>
                    </div>

                    <ul class="mt-4 grid gap-3">
                      <li
                        v-for="rule in typeGroup.rules"
                        :key="rule.id"
                        class="flex flex-col gap-4 rounded-blob-d bg-[color:var(--color-surface-highlight)] px-4 py-4 text-sm shadow-soft sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div class="min-w-0">
                          <span class="block font-semibold text-[color:var(--color-brand-primary)]">
                            {{ normalizeRuleTime(rule.startTime) }}–{{ normalizeRuleTime(rule.endTime) }}
                          </span>
                          <span class="mt-2 inline-flex flex-wrap items-center gap-2">
                            <span class="rounded-full bg-white px-3 py-1 text-xs font-bold text-[color:var(--color-brand-primary)] shadow-soft">
                              {{ rule.slotDurationMinutes }} min
                            </span>
                            <span
                              class="rounded-full px-3 py-1 text-xs font-bold shadow-soft"
                              :class="rule.isActive ? 'bg-[rgba(181,192,163,0.25)] text-[color:var(--color-brand-primary)]' : 'bg-[rgba(239,68,68,0.10)] text-[color:var(--color-brand-primary)]'"
                            >
                              {{ rule.isActive ? 'Active' : 'Inactive' }}
                            </span>
                          </span>
                        </div>

                        <div class="flex flex-wrap items-center justify-end gap-3">
                          <div class="flex items-center gap-2">
                            <span class="text-xs font-semibold text-[color:var(--color-brand-secondary)]">
                              {{ rule.isActive ? 'Actif' : 'Inactif' }}
                            </span>
                            <USwitch
                              :model-value="rule.isActive"
                              size="md"
                              color="primary"
                              :disabled="pending || updatingRuleId === rule.id || deletingRuleId === rule.id"
                              @update:model-value="(next) => setRuleActive(rule, next)"
                            />
                          </div>

                          <button
                            type="button"
                            class="inline-flex h-9 items-center justify-center gap-2 rounded-full bg-white px-4 text-xs font-bold text-[color:var(--color-brand-primary)] shadow-soft ring-1 ring-[rgba(231,229,228,0.7)] transition-base hover:shadow-floating disabled:cursor-not-allowed disabled:opacity-60"
                            :disabled="pending || updatingRuleId === rule.id || deletingRuleId === rule.id"
                            @click="openUpdateRuleModal(rule)"
                          >
                            <Icon
                              name="lucide:pencil"
                              size="14"
                              aria-hidden="true"
                            />
                            Modifier
                          </button>

                          <button
                            type="button"
                            class="inline-flex h-9 items-center justify-center gap-2 rounded-full bg-white px-4 text-xs font-bold text-[color:var(--color-brand-primary)] shadow-soft ring-1 ring-[rgba(231,229,228,0.7)] transition-base hover:shadow-floating disabled:cursor-not-allowed disabled:opacity-60"
                            :disabled="pending || updatingRuleId === rule.id || deletingRuleId === rule.id"
                            @click="openDeleteRuleModal(rule)"
                          >
                            <Icon
                              name="lucide:trash-2"
                              size="14"
                              aria-hidden="true"
                            />
                            Supprimer
                          </button>
                        </div>
                      </li>
                    </ul>
                  </section>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="rounded-blob-b border border-white/60 bg-white/70 shadow-soft backdrop-blur">
          <div class="flex flex-col gap-4 border-b border-[rgba(231,229,228,0.7)] px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div class="grid gap-1">
              <h2 class="font-serif text-2xl italic text-[color:var(--color-brand-primary)]">
                Blocages ponctuels
              </h2>
              <p class="text-sm text-[color:var(--color-brand-secondary)]">
                Bloquez des créneaux (vacances, indisponibilités). Ces blocages sont prioritaires sur les règles.
              </p>
            </div>

            <button
              type="button"
              class="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-[color:var(--color-accent-main)] px-4 text-sm font-bold text-[color:var(--color-accent-contrast)] shadow-floating transition-base hover:bg-[color:var(--color-accent-hover)] disabled:cursor-not-allowed disabled:opacity-60"
              :disabled="pending"
              @click="openCreateBlockModal"
            >
              <Icon
                name="lucide:plus"
                size="18"
                aria-hidden="true"
              />
              Ajouter un blocage
            </button>
          </div>

          <div class="px-6 py-6">
            <div
              v-if="pending"
              class="grid gap-4"
            >
              <div class="h-20 rounded-blob-d bg-[rgba(231,229,228,0.55)]" />
              <div class="h-20 rounded-blob-d bg-[rgba(231,229,228,0.35)]" />
            </div>

            <div
              v-else-if="!hasBlocks"
              class="rounded-blob-d border border-[rgba(231,229,228,0.8)] bg-[color:var(--color-surface-highlight)] p-6 text-sm text-[color:var(--color-brand-secondary)]"
            >
              Aucun blocage ponctuel pour le moment.
            </div>

            <ul
              v-else
              class="grid gap-4"
            >
              <li
                v-for="block in sortedBlocks"
                :key="block.id"
                class="rounded-blob-d border border-white/60 bg-white/60 p-5 shadow-soft"
              >
                <div class="flex flex-wrap items-start justify-between gap-3">
                  <div class="min-w-0">
                    <p class="font-semibold text-[color:var(--color-brand-primary)]">
                      {{ formatDateTime(block.startAt) }} → {{ formatDateTime(block.endAt) }}
                    </p>
                    <p class="mt-1 text-sm text-[color:var(--color-brand-secondary)]">
                      Type : {{ blockTypeLabel(block) }}
                    </p>
                    <p
                      v-if="formatBlockReason(block.reason)"
                      class="mt-2 text-xs text-[color:var(--color-brand-secondary)]"
                    >
                      Raison : {{ formatBlockReason(block.reason) }}
                    </p>
                  </div>

                  <div class="flex flex-wrap items-center justify-end gap-2">
                    <span class="rounded-full bg-[rgba(212,184,160,0.20)] px-3 py-1 text-xs font-bold text-[color:var(--color-brand-primary)]">
                      Blocage
                    </span>
                    <button
                      type="button"
                      class="inline-flex h-9 items-center justify-center gap-2 rounded-full bg-white px-4 text-xs font-bold text-[color:var(--color-brand-primary)] shadow-soft ring-1 ring-[rgba(231,229,228,0.7)] transition-base hover:shadow-floating disabled:cursor-not-allowed disabled:opacity-60"
                      :disabled="pending || Boolean(deletingBlockId)"
                      @click="openDeleteBlockModal(block)"
                    >
                      <Icon
                        name="lucide:trash-2"
                        size="14"
                        aria-hidden="true"
                      />
                      Supprimer
                    </button>
                  </div>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </section>

      <aside class="space-y-8 lg:col-span-4">
        <div class="rounded-blob-d border border-[rgba(231,229,228,0.8)] bg-white/75 p-6 shadow-soft backdrop-blur">
          <h2 class="font-serif text-2xl italic text-[color:var(--color-brand-primary)]">
            À venir
          </h2>
          <p class="mt-2 text-sm text-[color:var(--color-brand-secondary)]">
            Les prochains blocages, pour garder une vue d’ensemble.
          </p>

          <div
            v-if="pending"
            class="mt-6 grid gap-3"
          >
            <div class="h-16 rounded-blob-a bg-[rgba(231,229,228,0.55)]" />
            <div class="h-16 rounded-blob-a bg-[rgba(231,229,228,0.35)]" />
          </div>

          <div
            v-else-if="upcomingBlocks.length === 0"
            class="mt-6 text-sm text-[color:var(--color-brand-secondary)]"
          >
            Aucun blocage à venir.
          </div>

          <ul
            v-else
            class="mt-6 grid gap-3"
          >
            <li
              v-for="block in upcomingBlocks"
              :key="block.id"
              class="rounded-blob-a border border-white/60 bg-white/70 px-4 py-3 shadow-soft"
            >
              <p class="text-sm font-semibold text-[color:var(--color-brand-primary)]">
                {{ formatDateTime(block.startAt) }}
              </p>
              <p class="mt-1 text-xs text-[color:var(--color-brand-secondary)]">
                {{ blockTypeLabel(block) }}
              </p>
            </li>
          </ul>
        </div>

        <ProviderAvailabilitySlotsPreview
          :type="previewType"
          :period-days="previewPeriodDays"
          :timezone="timezone"
          :pending="previewPending"
          :error="previewError"
          :groups="slotGroups"
          @update:type="(value) => (previewType = value)"
          @update:period-days="(value) => (previewPeriodDays = value)"
          @refresh="refreshSlotsPreview"
        />
      </aside>
    </div>
  </div>
</template>
