<script setup lang="ts">
import type { ProgramResponse } from '../../../features/programs/api/programs.contract'
import { listMyPrograms } from '../../../features/programs/services/provider-programs.service'
import { PROGRAM_STATUS_META, formatProgramInstallments } from '../../../features/programs/domain/programs'
import { formatCurrency } from '../../../features/analytics/helpers/format-kpi'

definePageMeta({
  layout: 'provider',
  middleware: 'auth-provider',
  pageTitle: 'Programmes'
})

const toast = useToast()

const programs = ref<ProgramResponse[]>([])
const pending = ref(true)
const errorMessage = ref<string | null>(null)

async function loadPrograms() {
  pending.value = true
  errorMessage.value = null
  try {
    const response = await listMyPrograms()
    programs.value = response.programs
  } catch {
    errorMessage.value = 'Impossible de charger les programmes.'
    toast.add({ title: 'Erreur', description: errorMessage.value, color: 'error' })
  } finally {
    pending.value = false
  }
}

onMounted(() => loadPrograms())

function formatSessions(program: ProgramResponse): string {
  return `${program.totalSessions} séances · ${program.sessionDurationMinutes} min`
}

function formatValidity(program: ProgramResponse): string {
  return `${program.validityMonths} mois`
}
</script>

<template>
  <div class="space-y-6">
    <AtomsDsPageHeader
      title="Programmes"
      subtitle="Gérez vos programmes d'accompagnement."
    >
      <template #actions>
        <UButton
          to="/provider/programs/new"
          color="primary"
          icon="i-lucide-plus"
        >
          Créer un programme
        </UButton>
      </template>
    </AtomsDsPageHeader>

    <!-- Error -->
    <AtomsDsErrorState
      v-if="errorMessage"
      :message="errorMessage"
      @retry="loadPrograms()"
    />

    <!-- Loading -->
    <div
      v-else-if="pending"
      class="space-y-4"
    >
      <USkeleton class="h-24 w-full" />
      <USkeleton class="h-24 w-full" />
    </div>

    <!-- Empty -->
    <AtomsDsEmptyState
      v-else-if="programs.length === 0 && !errorMessage"
      icon="i-lucide-package"
      title="Aucun programme"
      description="Créez votre premier programme d'accompagnement pour proposer des packs de séances à vos clientes."
      cta-label="Créer un programme"
      cta-to="/provider/programs/new"
    />

    <!-- Programs list -->
    <div
      v-else
      class="grid gap-4"
    >
      <NuxtLink
        v-for="program in programs"
        :key="program.id"
        :to="`/provider/programs/${program.id}`"
        class="group rounded-xl border border-[color:var(--color-brand-subtle)] bg-[color:var(--color-surface-card)] p-5 transition-all hover:border-crepuscule-300 hover:shadow-sm"
      >
        <div class="flex items-start justify-between gap-4">
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-3">
              <h3 class="truncate text-lg font-semibold text-[color:var(--color-text-primary)] group-hover:text-crepuscule-700">
                {{ program.name }}
              </h3>
              <UBadge
                :color="PROGRAM_STATUS_META[program.status].color"
                variant="soft"
                size="sm"
              >
                {{ PROGRAM_STATUS_META[program.status].label }}
              </UBadge>
            </div>
            <p class="mt-1 line-clamp-2 text-sm text-[color:var(--color-text-muted)]">
              {{ program.description }}
            </p>
            <div class="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[color:var(--color-brand-muted)]">
              <span>{{ formatSessions(program) }}</span>
              <span>{{ formatValidity(program) }}</span>
              <span
                v-if="program.discoveryGate"
                class="text-[color:var(--color-sunset-600)]"
              >Discovery gate</span>
            </div>
          </div>
          <div class="text-right">
            <p class="text-lg font-bold text-[color:var(--color-text-primary)]">
              {{ formatCurrency(program.priceCents) }}
            </p>
            <p
              v-if="formatProgramInstallments(program)"
              class="mt-1 text-xs text-[color:var(--color-brand-muted)]"
            >
              {{ formatProgramInstallments(program) }}
            </p>
          </div>
        </div>
      </NuxtLink>
    </div>
  </div>
</template>
