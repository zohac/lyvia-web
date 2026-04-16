<script setup lang="ts">
import type { ProgramResponse } from '../../../features/programs/api/programs.contract'
import { getMyProgram, activateProgram, deactivateProgram } from '../../../features/programs/services/provider-programs.service'
import { PROGRAM_STATUS_META, formatProgramInstallments } from '../../../features/programs/domain/programs'
import { formatCurrency } from '../../../features/analytics/helpers/format-kpi'

definePageMeta({
  layout: 'provider',
  middleware: 'auth-provider',
  pageTitle: 'Détail programme'
})

const route = useRoute()
const toast = useToast()

const program = ref<ProgramResponse | null>(null)
const pending = ref(true)
const actionPending = ref(false)
const errorMessage = ref<string | null>(null)

const programId = computed(() => route.params.id as string)

async function loadProgram() {
  pending.value = true
  errorMessage.value = null
  try {
    program.value = await getMyProgram(programId.value)
  } catch {
    errorMessage.value = 'Impossible de charger le programme.'
  } finally {
    pending.value = false
  }
}

onMounted(() => loadProgram())

const dateFmt = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long' })

const formattedCreatedAt = computed(() => {
  if (!program.value) return ''
  return dateFmt.format(new Date(program.value.createdAt))
})

const installmentsLabel = computed(() => {
  if (!program.value) return null
  return formatProgramInstallments(program.value)
})

async function handleActivate() {
  if (actionPending.value || !program.value) return
  actionPending.value = true
  try {
    program.value = await activateProgram(programId.value)
    toast.add({
      title: 'Programme activé',
      description: 'Le programme est maintenant visible et souscriptible.',
      color: 'primary'
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur lors de l\'activation.'
    toast.add({ title: 'Erreur', description: message, color: 'error' })
  } finally {
    actionPending.value = false
  }
}

async function handleDeactivate() {
  if (actionPending.value || !program.value) return
  actionPending.value = true
  try {
    program.value = await deactivateProgram(programId.value)
    toast.add({
      title: 'Programme désactivé',
      description: 'Le programme n\'est plus visible pour les nouvelles souscriptions.',
      color: 'primary'
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur lors de la désactivation.'
    toast.add({ title: 'Erreur', description: message, color: 'error' })
  } finally {
    actionPending.value = false
  }
}
</script>

<template>
  <div class="mx-auto max-w-2xl space-y-6">
    <AtomsDsPageHeader
      :title="program?.name ?? 'Chargement…'"
      :accent-bar="false"
    >
      <template #back>
        <UButton
          to="/provider/programs"
          color="neutral"
          variant="ghost"
          icon="i-lucide-arrow-left"
          size="sm"
        />
      </template>
    </AtomsDsPageHeader>

    <!-- Error -->
    <AtomsDsErrorState
      v-if="errorMessage"
      :message="errorMessage"
      @retry="loadProgram()"
    />

    <!-- Loading -->
    <div
      v-else-if="pending"
      class="space-y-4"
    >
      <USkeleton class="h-40 w-full" />
    </div>

    <!-- Content -->
    <template v-else-if="program">
      <!-- Status + Actions -->
      <div class="flex items-center justify-between rounded-xl border border-[color:var(--color-brand-subtle)] bg-[color:var(--color-surface-card)] p-5">
        <div class="flex items-center gap-3">
          <UBadge
            :color="PROGRAM_STATUS_META[program.status].color"
            variant="soft"
          >
            {{ PROGRAM_STATUS_META[program.status].label }}
          </UBadge>
          <span class="text-sm text-[color:var(--color-text-muted)]">
            Créé le {{ formattedCreatedAt }}
          </span>
        </div>

        <div class="flex gap-2">
          <UButton
            v-if="program.status === 'draft'"
            color="primary"
            :loading="actionPending"
            @click="handleActivate"
          >
            Activer
          </UButton>
          <UButton
            v-else-if="program.status === 'active'"
            color="neutral"
            variant="soft"
            :loading="actionPending"
            @click="handleDeactivate"
          >
            Désactiver
          </UButton>
        </div>
      </div>

      <!-- Details -->
      <div class="rounded-xl border border-[color:var(--color-brand-subtle)] bg-[color:var(--color-surface-card)] p-6">
        <div class="grid gap-6">
          <!-- Description -->
          <section>
            <h3 class="text-xs font-bold uppercase tracking-wider text-[color:var(--color-text-muted)]">
              Description
            </h3>
            <p class="mt-2 whitespace-pre-line text-sm text-[color:var(--color-text-secondary)]">
              {{ program.description }}
            </p>
          </section>

          <!-- Key details grid -->
          <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div class="rounded-lg border border-[color:var(--color-neutral-100)] bg-[color:var(--color-surface-page)] p-4">
              <p class="text-xs font-bold uppercase tracking-wider text-[color:var(--color-brand-muted)]">
                Séances
              </p>
              <p class="mt-1 text-lg font-bold text-[color:var(--color-text-primary)]">
                {{ program.totalSessions }}
              </p>
              <p class="text-xs text-[color:var(--color-brand-muted)]">
                {{ program.sessionDurationMinutes }} min chacune
              </p>
            </div>

            <div class="rounded-lg border border-[color:var(--color-neutral-100)] bg-[color:var(--color-surface-page)] p-4">
              <p class="text-xs font-bold uppercase tracking-wider text-[color:var(--color-brand-muted)]">
                Validité
              </p>
              <p class="mt-1 text-lg font-bold text-[color:var(--color-text-primary)]">
                {{ program.validityMonths }} mois
              </p>
              <p class="text-xs text-[color:var(--color-brand-muted)]">
                + {{ program.gracePeriodDays }} jours de grâce
              </p>
            </div>

            <div class="rounded-lg border border-[color:var(--color-neutral-100)] bg-[color:var(--color-surface-page)] p-4">
              <p class="text-xs font-bold uppercase tracking-wider text-[color:var(--color-brand-muted)]">
                Prix
              </p>
              <p class="mt-1 text-lg font-bold text-[color:var(--color-text-primary)]">
                {{ formatCurrency(program.priceCents) }}
              </p>
              <p
                v-if="installmentsLabel"
                class="text-xs text-[color:var(--color-brand-muted)]"
              >
                {{ installmentsLabel }}
              </p>
            </div>
          </div>

          <!-- Options -->
          <div class="flex flex-wrap gap-3">
            <span
              v-if="program.discoveryGate"
              class="inline-flex items-center gap-1.5 rounded-full bg-[color:var(--color-sunset-50)] px-3 py-1 text-xs font-medium text-[color:var(--color-sunset-700)] ring-1 ring-[color:var(--color-sunset-200)]"
            >
              <UIcon
                name="i-lucide-phone-call"
                class="h-3.5 w-3.5"
              />
              Discovery gate activée
            </span>
            <span
              v-if="program.allowInstallments"
              class="inline-flex items-center gap-1.5 rounded-full bg-[color:var(--color-crepuscule-50)] px-3 py-1 text-xs font-medium text-[color:var(--color-crepuscule-700)] ring-1 ring-[color:var(--color-crepuscule-200)]"
            >
              <UIcon
                name="i-lucide-credit-card"
                class="h-3.5 w-3.5"
              />
              Paiement en {{ program.installmentCount }}× activé
            </span>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
