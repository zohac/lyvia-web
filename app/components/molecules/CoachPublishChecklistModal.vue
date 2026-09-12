<script setup lang="ts">
import type { PublishChecklist } from '~/features/account/api/provider-account.contract'

const props = withDefaults(
  defineProps<{
    open: boolean
    checklist: PublishChecklist
    loading?: boolean
    error?: string | null
  }>(),
  {
    loading: false,
    error: null
  }
)

const emit = defineEmits<{
  (event: 'update:open', value: boolean): void
  (event: 'publish'): void
  (event: 'navigate-to-section', sectionId: string): void
}>()

const checklistRows = computed(() => [
  {
    id: 'identity',
    title: 'Identité',
    description: 'Prénom et nom renseignés',
    valid: props.checklist.items.hasIdentity,
    targetSection: 'hero'
  },
  {
    id: 'bio',
    title: 'Présentation (Bio)',
    description: 'Présentation rédigée (minimum 20 caractères)',
    valid: props.checklist.items.hasBio,
    targetSection: 'bio'
  },
  {
    id: 'photo',
    title: 'Photo de profil',
    description: 'Une photo de profil pour incarner votre espace',
    valid: props.checklist.items.hasPhoto,
    targetSection: 'hero'
  },
  {
    id: 'template',
    title: 'Modèle visuel (Template)',
    description: 'Un template coach sélectionné',
    valid: props.checklist.items.hasTemplate,
    targetSection: 'template'
  },
  {
    id: 'offer',
    title: 'Offre active',
    description: 'Au moins un tarif de consultation actif ou un programme publié',
    valid: props.checklist.items.hasOffer,
    targetSection: 'offers'
  }
])

const completedCount = computed(() =>
  checklistRows.value.filter(r => r.valid).length
)

function updateOpen(next: boolean) {
  if (props.loading) return
  emit('update:open', next)
}

function handleGoToSection(target: string) {
  emit('update:open', false)
  emit('navigate-to-section', target)
}
</script>

<template>
  <UModal
    :open="open"
    :dismissible="!loading"
    title="Checklist de mise en ligne"
    description="Vérifiez les prérequis essentiels avant de rendre votre site visible à vos visiteurs."
    @update:open="updateOpen"
  >
    <template #body>
      <div class="space-y-4">
        <!-- Progress bar / header status -->
        <div class="rounded-xl border border-[color:var(--color-border-subtle)] bg-[color:var(--color-crepuscule-50)]/50 p-4">
          <div class="flex items-center justify-between text-sm">
            <span class="font-medium text-[color:var(--color-brand-primary)]">
              Critères validés
            </span>
            <span class="font-semibold text-[color:var(--color-crepuscule-700)]">
              {{ completedCount }} / {{ checklistRows.length }}
            </span>
          </div>
          <div class="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-neutral-200">
            <div
              class="h-full rounded-full bg-[color:var(--color-crepuscule-700)] transition-all duration-300"
              :style="{ width: `${(completedCount / checklistRows.length) * 100}%` }"
            />
          </div>
        </div>

        <UAlert
          v-if="error"
          color="error"
          variant="soft"
          title="Erreur lors de la publication"
          :description="error"
          icon="i-lucide-alert-circle"
        />

        <div
          v-if="checklist.isReady"
          class="flex items-center gap-2.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-xs text-emerald-800"
        >
          <UIcon
            name="lucide:check-circle-2"
            size="18"
            class="shrink-0 text-emerald-600"
          />
          <span>Tous les prérequis sont validés ! Vous pouvez mettre en ligne votre page dès maintenant.</span>
        </div>

        <div
          v-else
          class="flex items-center gap-2.5 rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-xs text-amber-900"
        >
          <UIcon
            name="lucide:info"
            size="18"
            class="shrink-0 text-amber-600"
          />
          <span>Complétez les critères manquants ci-dessous pour pouvoir publier votre page.</span>
        </div>

        <!-- Items list -->
        <ul class="divide-y divide-[color:var(--color-border-subtle)] rounded-xl border border-[color:var(--color-border-subtle)] bg-white overflow-hidden">
          <li
            v-for="row in checklistRows"
            :key="row.id"
            class="flex items-center justify-between gap-3 p-3.5 text-sm transition-colors hover:bg-neutral-50/70"
          >
            <div class="flex items-start gap-3 min-w-0">
              <span
                class="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                :class="row.valid ? 'bg-emerald-100 text-emerald-600' : 'bg-neutral-100 text-neutral-400'"
              >
                <UIcon
                  :name="row.valid ? 'lucide:check' : 'lucide:circle'"
                  size="13"
                  class="stroke-[3]"
                />
              </span>
              <div class="min-w-0">
                <p
                  class="font-medium truncate"
                  :class="row.valid ? 'text-[color:var(--color-brand-primary)]' : 'text-neutral-700'"
                >
                  {{ row.title }}
                </p>
                <p class="text-xs text-[color:var(--color-brand-muted)]">
                  {{ row.description }}
                </p>
              </div>
            </div>

            <UButton
              v-if="!row.valid"
              size="xs"
              color="neutral"
              variant="subtle"
              trailing-icon="i-lucide-arrow-right"
              @click="handleGoToSection(row.targetSection)"
            >
              Compléter
            </UButton>
            <UBadge
              v-else
              color="success"
              variant="subtle"
              size="sm"
            >
              Prêt
            </UBadge>
          </li>
        </ul>
      </div>
    </template>

    <template #footer>
      <div class="flex justify-end gap-3">
        <UButton
          color="neutral"
          variant="ghost"
          :disabled="loading"
          @click="updateOpen(false)"
        >
          Fermer
        </UButton>
        <UButton
          color="primary"
          :loading="loading"
          :disabled="!checklist.isReady"
          icon="i-lucide-globe"
          @click="emit('publish')"
        >
          Mettre en ligne
        </UButton>
      </div>
    </template>
  </UModal>
</template>
