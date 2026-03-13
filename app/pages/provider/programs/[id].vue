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
    <!-- Header -->
    <div class="flex items-center gap-4">
      <UButton
        to="/provider/programs"
        color="neutral"
        variant="ghost"
        icon="i-lucide-arrow-left"
        size="sm"
      />
      <div class="min-w-0 flex-1">
        <h1 class="truncate text-2xl font-bold text-stone-900">
          {{ program?.name ?? 'Chargement…' }}
        </h1>
      </div>
    </div>

    <!-- Error -->
    <UAlert
      v-if="errorMessage"
      color="error"
      variant="soft"
      title="Erreur"
      :description="errorMessage"
      icon="i-lucide-alert-circle"
    />

    <!-- Loading -->
    <div
      v-if="pending"
      class="space-y-4"
    >
      <USkeleton class="h-40 w-full" />
    </div>

    <!-- Content -->
    <template v-else-if="program">
      <!-- Status + Actions -->
      <div class="flex items-center justify-between rounded-xl border border-stone-200 bg-white p-5">
        <div class="flex items-center gap-3">
          <UBadge
            :color="PROGRAM_STATUS_META[program.status].color"
            variant="soft"
          >
            {{ PROGRAM_STATUS_META[program.status].label }}
          </UBadge>
          <span class="text-sm text-stone-500">
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
      <div class="rounded-xl border border-stone-200 bg-white p-6">
        <div class="grid gap-6">
          <!-- Description -->
          <section>
            <h3 class="text-xs font-bold uppercase tracking-wider text-stone-500">
              Description
            </h3>
            <p class="mt-2 whitespace-pre-line text-sm text-stone-700">
              {{ program.description }}
            </p>
          </section>

          <!-- Key details grid -->
          <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div class="rounded-lg border border-stone-100 bg-stone-50 p-4">
              <p class="text-xs font-bold uppercase tracking-wider text-stone-400">
                Séances
              </p>
              <p class="mt-1 text-lg font-bold text-stone-900">
                {{ program.totalSessions }}
              </p>
              <p class="text-xs text-stone-400">
                {{ program.sessionDurationMinutes }} min chacune
              </p>
            </div>

            <div class="rounded-lg border border-stone-100 bg-stone-50 p-4">
              <p class="text-xs font-bold uppercase tracking-wider text-stone-400">
                Validité
              </p>
              <p class="mt-1 text-lg font-bold text-stone-900">
                {{ program.validityMonths }} mois
              </p>
              <p class="text-xs text-stone-400">
                + {{ program.gracePeriodDays }} jours de grâce
              </p>
            </div>

            <div class="rounded-lg border border-stone-100 bg-stone-50 p-4">
              <p class="text-xs font-bold uppercase tracking-wider text-stone-400">
                Prix
              </p>
              <p class="mt-1 text-lg font-bold text-stone-900">
                {{ formatCurrency(program.priceCents) }}
              </p>
              <p
                v-if="installmentsLabel"
                class="text-xs text-stone-400"
              >
                {{ installmentsLabel }}
              </p>
            </div>
          </div>

          <!-- Options -->
          <div class="flex flex-wrap gap-3">
            <span
              v-if="program.discoveryGate"
              class="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700 ring-1 ring-amber-200"
            >
              <UIcon
                name="i-lucide-phone-call"
                class="h-3.5 w-3.5"
              />
              Discovery gate activée
            </span>
            <span
              v-if="program.allowInstallments"
              class="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 ring-1 ring-blue-200"
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
