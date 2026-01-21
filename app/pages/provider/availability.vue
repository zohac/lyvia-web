<script setup lang="ts">
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

const weekdayOptions = [
  { label: 'Lundi', value: 1 },
  { label: 'Mardi', value: 2 },
  { label: 'Mercredi', value: 3 },
  { label: 'Jeudi', value: 4 },
  { label: 'Vendredi', value: 5 },
  { label: 'Samedi', value: 6 },
  { label: 'Dimanche', value: 7 }
]

const appointmentTypeOptions = [
  { label: 'Discovery', value: 'discovery' },
  { label: 'Consultation', value: 'consultation' }
]

const blockTypeOptions = [
  { label: 'Tout', value: 'all' },
  { label: 'Discovery', value: 'discovery' },
  { label: 'Consultation', value: 'consultation' }
]

const copyDirectionOptions = [
  { label: 'Discovery → Consultation', value: 'discovery-to-consultation' },
  { label: 'Consultation → Discovery', value: 'consultation-to-discovery' }
]
</script>

<template>
  <div class="space-y-8">
    <!-- Create Block Modal -->
    <UModal
      v-model:open="createBlockModalOpen"
      :dismissible="!isCreatingBlock"
      title="Ajouter un blocage"
      description="Bloquez un créneau ponctuel (Europe/Paris)."
    >
      <template #body>
        <UAlert
          v-if="createBlockError"
          class="mb-5"
          color="error"
          variant="soft"
          title="Création impossible"
          :description="createBlockError"
          icon="i-lucide-alert-circle"
        />

        <form
          class="space-y-5"
          @submit.prevent="submitCreateBlock"
        >
          <div class="grid gap-4 sm:grid-cols-2">
            <UFormField
              label="Début"
              :error="createBlockFieldErrors.startAt ?? undefined"
            >
              <UInput
                v-model="createBlockForm.startAt"
                type="datetime-local"
                :disabled="isCreatingBlock"
              />
            </UFormField>

            <UFormField
              label="Fin"
              :error="createBlockFieldErrors.endAt ?? undefined"
            >
              <UInput
                v-model="createBlockForm.endAt"
                type="datetime-local"
                :disabled="isCreatingBlock"
              />
            </UFormField>
          </div>

          <UFormField
            label="Type"
            :error="createBlockFieldErrors.blockType ?? undefined"
          >
            <USelect
              v-model="createBlockForm.blockType"
              :items="blockTypeOptions"
              :disabled="isCreatingBlock"
            />
          </UFormField>

          <UFormField
            label="Raison (optionnel)"
            :error="createBlockFieldErrors.reason ?? undefined"
          >
            <UTextarea
              v-model="createBlockForm.reason"
              :rows="3"
              :disabled="isCreatingBlock"
              placeholder="Vacances, indisponibilité…"
            />
          </UFormField>
        </form>
      </template>

      <template #footer>
        <div class="flex justify-end gap-3">
          <UButton
            color="neutral"
            variant="ghost"
            :disabled="isCreatingBlock"
            @click="createBlockModalOpen = false"
          >
            Annuler
          </UButton>
          <UButton
            color="primary"
            :loading="isCreatingBlock"
            @click="submitCreateBlock"
          >
            Ajouter
          </UButton>
        </div>
      </template>
    </UModal>

    <!-- Delete Block Modal -->
    <ConfirmActionModal
      v-model:open="deleteBlockModalOpen"
      title="Supprimer ce blocage ?"
      :description="blockBeingDeleted ? `${formatDateTime(blockBeingDeleted.startAt)} → ${formatDateTime(blockBeingDeleted.endAt)} • ${blockTypeLabel(blockBeingDeleted)}${formatBlockReason(blockBeingDeleted.reason) ? ` • ${formatBlockReason(blockBeingDeleted.reason)}` : ''}` : 'Ce blocage sera supprimé définitivement.'"
      confirm-label="Supprimer"
      :loading="Boolean(deletingBlockId)"
      :error="deleteBlockError"
      @confirm="confirmDeleteBlock"
    />

    <!-- Create Rule Modal -->
    <UModal
      v-model:open="createRuleModalOpen"
      :dismissible="!isCreatingRule"
      title="Ajouter une règle"
      description="Créez une règle récurrente (Europe/Paris)."
    >
      <template #body>
        <UAlert
          v-if="createRuleError"
          class="mb-5"
          color="error"
          variant="soft"
          title="Création impossible"
          :description="createRuleError"
          icon="i-lucide-alert-circle"
        />

        <form
          class="space-y-5"
          @submit.prevent="submitCreateRule"
        >
          <UFormField
            label="Type"
            :error="createRuleFieldErrors.appointmentType ?? undefined"
          >
            <USelect
              v-model="createRuleForm.appointmentType"
              :items="appointmentTypeOptions"
              :disabled="isCreatingRule || createRuleApplyToAllTypes"
            />
            <template
              v-if="createRuleApplyToAllTypes"
              #hint
            >
              Les deux types (Discovery + Consultation) seront créés.
            </template>
          </UFormField>

          <div class="flex items-center justify-between gap-4 rounded-lg border border-stone-200 bg-stone-50 p-4">
            <div>
              <p class="font-medium text-stone-900">
                Appliquer à tous les types
              </p>
              <p class="text-sm text-stone-500">
                Crée la règle pour Discovery et Consultation.
              </p>
            </div>
            <USwitch
              v-model="createRuleApplyToAllTypes"
              :disabled="isCreatingRule"
            />
          </div>

          <UFormField
            label="Jour"
            :error="createRuleFieldErrors.weekday ?? undefined"
          >
            <USelect
              v-model="createRuleForm.weekday"
              :items="weekdayOptions"
              :disabled="isCreatingRule"
            />
          </UFormField>

          <div class="grid gap-4 sm:grid-cols-2">
            <UFormField
              label="Début"
              :error="createRuleFieldErrors.startTime ?? undefined"
            >
              <UInput
                v-model="createRuleForm.startTime"
                type="time"
                step="60"
                :disabled="isCreatingRule"
              />
            </UFormField>

            <UFormField
              label="Fin"
              :error="createRuleFieldErrors.endTime ?? undefined"
            >
              <UInput
                v-model="createRuleForm.endTime"
                type="time"
                step="60"
                :disabled="isCreatingRule"
              />
            </UFormField>
          </div>

          <UFormField
            v-if="!createRuleApplyToAllTypes"
            label="Durée (minutes)"
            :error="createRuleFieldErrors.slotDurationMinutes ?? undefined"
          >
            <UInput
              v-model.number="createRuleForm.slotDurationMinutes"
              type="number"
              min="1"
              :disabled="isCreatingRule"
            />
          </UFormField>

          <div
            v-else
            class="grid gap-4 sm:grid-cols-2"
          >
            <UFormField
              label="Durée Discovery (min)"
              :error="createRuleDurationErrors.discovery ?? undefined"
            >
              <UInput
                v-model.number="createRuleDurationByType.discovery"
                type="number"
                min="1"
                :disabled="isCreatingRule"
              />
            </UFormField>

            <UFormField
              label="Durée Consultation (min)"
              :error="createRuleDurationErrors.consultation ?? undefined"
            >
              <UInput
                v-model.number="createRuleDurationByType.consultation"
                type="number"
                min="1"
                :disabled="isCreatingRule"
              />
            </UFormField>
          </div>

          <div class="flex items-center justify-between gap-4 rounded-lg border border-stone-200 bg-stone-50 p-4">
            <div>
              <p class="font-medium text-stone-900">
                Activer la règle
              </p>
              <p class="text-sm text-stone-500">
                Désactivez temporairement sans supprimer.
              </p>
            </div>
            <USwitch
              v-model="createRuleForm.isActive"
              :disabled="isCreatingRule"
            />
          </div>
        </form>
      </template>

      <template #footer>
        <div class="flex justify-end gap-3">
          <UButton
            color="neutral"
            variant="ghost"
            :disabled="isCreatingRule"
            @click="createRuleModalOpen = false"
          >
            Annuler
          </UButton>
          <UButton
            color="primary"
            :loading="isCreatingRule"
            @click="submitCreateRule"
          >
            Ajouter
          </UButton>
        </div>
      </template>
    </UModal>

    <!-- Update Rule Modal -->
    <UModal
      v-model:open="updateRuleModalOpen"
      :dismissible="!isUpdatingRule"
      title="Modifier une règle"
      description="Ajustez votre règle récurrente (Europe/Paris)."
    >
      <template #body>
        <UAlert
          v-if="updateRuleError"
          class="mb-5"
          color="error"
          variant="soft"
          title="Modification impossible"
          :description="updateRuleError"
          icon="i-lucide-alert-circle"
        />

        <form
          class="space-y-5"
          @submit.prevent="submitUpdateRule"
        >
          <UFormField
            label="Type"
            :error="updateRuleFieldErrors.appointmentType ?? undefined"
          >
            <USelect
              v-model="updateRuleForm.appointmentType"
              :items="appointmentTypeOptions"
              :disabled="isUpdatingRule"
            />
          </UFormField>

          <UFormField
            label="Jour"
            :error="updateRuleFieldErrors.weekday ?? undefined"
          >
            <USelect
              v-model="updateRuleForm.weekday"
              :items="weekdayOptions"
              :disabled="isUpdatingRule"
            />
          </UFormField>

          <div class="grid gap-4 sm:grid-cols-2">
            <UFormField
              label="Début"
              :error="updateRuleFieldErrors.startTime ?? undefined"
            >
              <UInput
                v-model="updateRuleForm.startTime"
                type="time"
                step="60"
                :disabled="isUpdatingRule"
              />
            </UFormField>

            <UFormField
              label="Fin"
              :error="updateRuleFieldErrors.endTime ?? undefined"
            >
              <UInput
                v-model="updateRuleForm.endTime"
                type="time"
                step="60"
                :disabled="isUpdatingRule"
              />
            </UFormField>
          </div>

          <UFormField
            label="Durée (minutes)"
            :error="updateRuleFieldErrors.slotDurationMinutes ?? undefined"
          >
            <UInput
              v-model.number="updateRuleForm.slotDurationMinutes"
              type="number"
              min="1"
              :disabled="isUpdatingRule"
            />
          </UFormField>

          <div class="flex items-center justify-between gap-4 rounded-lg border border-stone-200 bg-stone-50 p-4">
            <div>
              <p class="font-medium text-stone-900">
                Activer la règle
              </p>
              <p class="text-sm text-stone-500">
                Désactivez temporairement sans supprimer.
              </p>
            </div>
            <USwitch
              v-model="updateRuleForm.isActive"
              :disabled="isUpdatingRule"
            />
          </div>
        </form>
      </template>

      <template #footer>
        <div class="flex justify-end gap-3">
          <UButton
            color="neutral"
            variant="ghost"
            :disabled="isUpdatingRule"
            @click="updateRuleModalOpen = false"
          >
            Annuler
          </UButton>
          <UButton
            color="primary"
            :loading="isUpdatingRule"
            @click="submitUpdateRule"
          >
            Enregistrer
          </UButton>
        </div>
      </template>
    </UModal>

    <!-- Delete Rule Modal -->
    <ConfirmActionModal
      v-model:open="deleteRuleModalOpen"
      title="Supprimer cette règle ?"
      :description="ruleBeingDeleted ? `${weekdayLabel(ruleBeingDeleted.weekday)} • ${normalizeRuleTime(ruleBeingDeleted.startTime)}–${normalizeRuleTime(ruleBeingDeleted.endTime)} (${ruleBeingDeleted.slotDurationMinutes} min)` : 'Cette règle sera supprimée définitivement.'"
      confirm-label="Supprimer"
      :loading="Boolean(deletingRuleId)"
      :error="deleteRuleError"
      @confirm="confirmDeleteRule"
    />

    <!-- Copy Rules Modal -->
    <UModal
      v-model:open="copyRulesModalOpen"
      :dismissible="!isCopyingRules"
      title="Copier un planning"
      description="Dupliquez vos règles d'un type à l'autre."
    >
      <template #body>
        <UAlert
          v-if="copyRulesError"
          class="mb-5"
          color="error"
          variant="soft"
          title="Copie impossible"
          :description="copyRulesError"
          icon="i-lucide-alert-circle"
        />

        <div class="space-y-5">
          <UFormField label="Copier">
            <USelect
              v-model="copyRulesDirection"
              :items="copyDirectionOptions"
              :disabled="isCopyingRules"
            />
          </UFormField>

          <div class="rounded-lg border border-stone-200 bg-stone-50 p-4">
            <p class="font-medium text-stone-900">
              Résumé
            </p>
            <p class="mt-2 text-sm text-stone-600">
              {{ copyRulesSummary.sourceCount }} règle(s) source • {{ copyRulesSummary.targetCount }} règle(s) déjà configurée(s)
            </p>
            <p
              v-if="copyRulesSummary.duplicatesCount"
              class="mt-1 text-xs text-stone-500"
            >
              {{ copyRulesSummary.duplicatesCount }} créneau(x) identique(s) ignoré(s).
            </p>
          </div>

          <div class="flex items-center justify-between gap-4 rounded-lg border border-stone-200 bg-stone-50 p-4">
            <div>
              <p class="font-medium text-stone-900">
                Adapter aux durées recommandées
              </p>
              <p class="text-sm text-stone-500">
                Discovery : 30 min • Consultation : 60 min.
              </p>
            </div>
            <USwitch
              v-model="copyRulesAdaptDurations"
              :disabled="isCopyingRules"
            />
          </div>
        </div>
      </template>

      <template #footer>
        <div class="flex justify-end gap-3">
          <UButton
            color="neutral"
            variant="ghost"
            :disabled="isCopyingRules"
            @click="copyRulesModalOpen = false"
          >
            Annuler
          </UButton>
          <UButton
            color="primary"
            :loading="isCopyingRules"
            @click="confirmCopyRules"
          >
            Copier
          </UButton>
        </div>
      </template>
    </UModal>

    <!-- Error/Notice alerts -->
    <UAlert
      v-if="errorMessage"
      color="error"
      variant="soft"
      title="Disponibilités indisponibles"
      :description="errorMessage"
      icon="i-lucide-alert-circle"
    />
    <UAlert
      v-if="actionErrorMessage"
      color="error"
      variant="soft"
      title="Action impossible"
      :description="actionErrorMessage"
      icon="i-lucide-alert-circle"
    />
    <UAlert
      v-if="noticeMessage"
      color="success"
      variant="soft"
      :description="noticeMessage"
      icon="i-lucide-check-circle"
    />

    <!-- Page header -->
    <header class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 class="text-2xl font-semibold text-stone-900 sm:text-3xl">
          Disponibilités
        </h1>
        <p class="mt-1 text-stone-500">
          Définissez vos règles hebdomadaires et ajoutez des blocages ponctuels.
        </p>
      </div>
      <UButton
        :loading="pending"
        variant="outline"
        color="neutral"
        @click="() => refresh()"
      >
        <UIcon
          name="lucide:refresh-cw"
          class="mr-2 h-4 w-4"
        />
        Actualiser
      </UButton>
    </header>

    <!-- Main content -->
    <div class="grid gap-8 lg:grid-cols-3">
      <!-- Main column -->
      <div class="space-y-8 lg:col-span-2">
        <!-- Recurring rules section -->
        <UCard class="bg-white">
          <template #header>
            <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 class="font-semibold text-stone-900">
                  Règles récurrentes
                </h2>
                <p class="mt-1 text-sm text-stone-500">
                  Vos créneaux récurrents (Europe/Paris)
                </p>
              </div>
              <div class="flex flex-wrap gap-2">
                <UButton
                  variant="outline"
                  color="neutral"
                  size="sm"
                  :disabled="pending || Boolean(errorMessage)"
                  @click="openCopyRulesModal()"
                >
                  <UIcon
                    name="lucide:copy"
                    class="mr-1.5 h-4 w-4"
                  />
                  Copier depuis…
                </UButton>
                <UButton
                  color="primary"
                  size="sm"
                  :disabled="pending || Boolean(errorMessage)"
                  @click="openCreateRuleModal"
                >
                  <UIcon
                    name="lucide:plus"
                    class="mr-1.5 h-4 w-4"
                  />
                  Ajouter
                </UButton>
              </div>
            </div>
          </template>

          <!-- Loading -->
          <div
            v-if="pending"
            class="space-y-4"
          >
            <USkeleton class="h-20 w-full" />
            <USkeleton class="h-20 w-full" />
          </div>

          <!-- Empty state -->
          <div
            v-else-if="!hasRules"
            class="flex flex-col items-center justify-center gap-3 py-12 text-center"
          >
            <div class="flex h-12 w-12 items-center justify-center rounded-full bg-stone-100">
              <UIcon
                name="lucide:calendar-clock"
                class="h-6 w-6 text-stone-400"
              />
            </div>
            <p class="text-sm text-stone-500">
              Aucune règle configurée. Ajoutez vos plages horaires récurrentes.
            </p>
          </div>

          <!-- Rules list -->
          <div
            v-else
            class="space-y-4"
          >
            <div
              v-for="group in groupedRules"
              :key="group.weekday"
              class="rounded-lg border border-stone-100 bg-stone-50 p-4"
            >
              <div class="flex items-center justify-between">
                <p class="font-semibold text-stone-900">
                  {{ weekdayLabel(group.weekday) }}
                </p>
                <UBadge
                  color="neutral"
                  variant="soft"
                  size="sm"
                >
                  {{ group.groups.reduce((count, typeGroup) => count + typeGroup.rules.length, 0) }} règle(s)
                </UBadge>
              </div>

              <div class="mt-4 space-y-3">
                <div
                  v-for="typeGroup in group.groups"
                  :key="typeGroup.type"
                  class="rounded-lg border border-stone-200 bg-white p-4"
                >
                  <div class="flex items-center justify-between">
                    <p class="text-xs font-medium uppercase tracking-wider text-stone-500">
                      {{ appointmentTypeLabel(typeGroup.type) }}
                    </p>
                    <UBadge
                      color="primary"
                      variant="soft"
                      size="sm"
                    >
                      {{ typeGroup.rules.length }}
                    </UBadge>
                  </div>

                  <div class="mt-3 space-y-2">
                    <div
                      v-for="rule in typeGroup.rules"
                      :key="rule.id"
                      class="flex flex-col gap-3 rounded-lg bg-stone-50 p-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div class="flex flex-wrap items-center gap-2">
                        <span class="font-medium text-stone-900">
                          {{ normalizeRuleTime(rule.startTime) }}–{{ normalizeRuleTime(rule.endTime) }}
                        </span>
                        <UBadge
                          color="neutral"
                          variant="soft"
                          size="sm"
                        >
                          {{ rule.slotDurationMinutes }} min
                        </UBadge>
                        <UBadge
                          :color="rule.isActive ? 'success' : 'error'"
                          variant="soft"
                          size="sm"
                        >
                          {{ rule.isActive ? 'Active' : 'Inactive' }}
                        </UBadge>
                      </div>

                      <div class="flex flex-wrap items-center gap-2">
                        <div class="flex items-center gap-2">
                          <span class="text-xs text-stone-500">
                            {{ rule.isActive ? 'Actif' : 'Inactif' }}
                          </span>
                          <USwitch
                            :model-value="rule.isActive"
                            size="sm"
                            :disabled="pending || updatingRuleId === rule.id || deletingRuleId === rule.id"
                            @update:model-value="(next) => setRuleActive(rule, next)"
                          />
                        </div>
                        <UButton
                          variant="ghost"
                          color="neutral"
                          size="xs"
                          :disabled="pending || updatingRuleId === rule.id || deletingRuleId === rule.id"
                          @click="openUpdateRuleModal(rule)"
                        >
                          <UIcon
                            name="lucide:pencil"
                            class="h-4 w-4"
                          />
                        </UButton>
                        <UButton
                          variant="ghost"
                          color="neutral"
                          size="xs"
                          :disabled="pending || updatingRuleId === rule.id || deletingRuleId === rule.id"
                          @click="openDeleteRuleModal(rule)"
                        >
                          <UIcon
                            name="lucide:trash-2"
                            class="h-4 w-4"
                          />
                        </UButton>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </UCard>

        <!-- Blocks section -->
        <UCard class="bg-white">
          <template #header>
            <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 class="font-semibold text-stone-900">
                  Blocages ponctuels
                </h2>
                <p class="mt-1 text-sm text-stone-500">
                  Bloquez des créneaux (vacances, indisponibilités)
                </p>
              </div>
              <UButton
                color="primary"
                size="sm"
                :disabled="pending"
                @click="openCreateBlockModal"
              >
                <UIcon
                  name="lucide:plus"
                  class="mr-1.5 h-4 w-4"
                />
                Ajouter
              </UButton>
            </div>
          </template>

          <!-- Loading -->
          <div
            v-if="pending"
            class="space-y-4"
          >
            <USkeleton class="h-24 w-full" />
            <USkeleton class="h-24 w-full" />
          </div>

          <!-- Empty state -->
          <div
            v-else-if="!hasBlocks"
            class="flex flex-col items-center justify-center gap-3 py-12 text-center"
          >
            <div class="flex h-12 w-12 items-center justify-center rounded-full bg-stone-100">
              <UIcon
                name="lucide:calendar-x"
                class="h-6 w-6 text-stone-400"
              />
            </div>
            <p class="text-sm text-stone-500">
              Aucun blocage ponctuel pour le moment.
            </p>
          </div>

          <!-- Blocks list -->
          <div
            v-else
            class="space-y-3"
          >
            <div
              v-for="block in sortedBlocks"
              :key="block.id"
              class="flex flex-col gap-3 rounded-lg border border-stone-100 bg-stone-50 p-4 sm:flex-row sm:items-start sm:justify-between"
            >
              <div>
                <p class="font-medium text-stone-900">
                  {{ formatDateTime(block.startAt) }} → {{ formatDateTime(block.endAt) }}
                </p>
                <p class="mt-1 text-sm text-stone-500">
                  Type : {{ blockTypeLabel(block) }}
                </p>
                <p
                  v-if="formatBlockReason(block.reason)"
                  class="mt-1 text-xs text-stone-400"
                >
                  Raison : {{ formatBlockReason(block.reason) }}
                </p>
              </div>
              <div class="flex items-center gap-2">
                <UBadge
                  color="warning"
                  variant="soft"
                  size="sm"
                >
                  Blocage
                </UBadge>
                <UButton
                  variant="ghost"
                  color="neutral"
                  size="xs"
                  :disabled="pending || Boolean(deletingBlockId)"
                  @click="openDeleteBlockModal(block)"
                >
                  <UIcon
                    name="lucide:trash-2"
                    class="h-4 w-4"
                  />
                </UButton>
              </div>
            </div>
          </div>
        </UCard>
      </div>

      <!-- Sidebar -->
      <aside class="space-y-6">
        <!-- Upcoming blocks card -->
        <UCard class="bg-white">
          <template #header>
            <h3 class="font-semibold text-stone-900">
              À venir
            </h3>
          </template>

          <div
            v-if="pending"
            class="space-y-3"
          >
            <USkeleton class="h-14 w-full" />
            <USkeleton class="h-14 w-full" />
          </div>

          <div
            v-else-if="upcomingBlocks.length === 0"
            class="py-4 text-center text-sm text-stone-500"
          >
            Aucun blocage à venir.
          </div>

          <div
            v-else
            class="space-y-2"
          >
            <div
              v-for="block in upcomingBlocks"
              :key="block.id"
              class="rounded-lg border border-stone-100 bg-stone-50 p-3"
            >
              <p class="text-sm font-medium text-stone-900">
                {{ formatDateTime(block.startAt) }}
              </p>
              <p class="mt-0.5 text-xs text-stone-500">
                {{ blockTypeLabel(block) }}
              </p>
            </div>
          </div>
        </UCard>

        <!-- Slots preview -->
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
