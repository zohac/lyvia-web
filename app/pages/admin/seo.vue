<script setup lang="ts">
import type { SeoFieldValues } from '~/types/seo.types'
import { apiFetch } from '~/services/api/apiFetch'
import AdminSeoForm from '~/components/organisms/AdminSeoForm.vue'

definePageMeta({
  layout: 'admin',
  middleware: 'auth-admin',
  pageTitle: 'SEO'
})

type AdminSeoEntry = {
  targetType: string
  targetId: string | null
  label: string
  providerConfig: SeoFieldValues | null
  adminConfig: SeoFieldValues | null
  resolvedConfig: SeoFieldValues
}

// Fetch
const { data, status, error, refresh } = await useAsyncData<AdminSeoEntry[]>(
  'admin-seo',
  () => apiFetch<AdminSeoEntry[]>('/admin/seo')
)

const toast = useToast()

// Group entries
const globalEntries = computed(() =>
  data.value?.filter(e => e.targetId === null) ?? []
)

type ProviderGroup = {
  providerId: string
  displayName: string
  entries: AdminSeoEntry[]
}

const providerGroups = computed<ProviderGroup[]>(() => {
  const coachEntries = data.value?.filter(e => e.targetId !== null) ?? []
  const grouped = new Map<string, AdminSeoEntry[]>()

  for (const entry of coachEntries) {
    const list = grouped.get(entry.targetId!) ?? []
    list.push(entry)
    grouped.set(entry.targetId!, list)
  }

  return Array.from(grouped.entries()).map(([providerId, entries]) => ({
    providerId,
    displayName: entries[0]?.label.split(' — ')[0] ?? providerId,
    entries
  }))
})

// Saving states
const savingMap = ref<Record<string, boolean>>({})

function savingKey(targetType: string, targetId: string | null): string {
  return `${targetType}:${targetId ?? 'global'}`
}

// Save handlers
async function saveGlobal(targetType: string, patch: SeoFieldValues) {
  const key = savingKey(targetType, null)
  savingMap.value[key] = true
  try {
    await apiFetch(`/admin/seo/${targetType}`, { method: 'PUT', body: patch })
    toast.add({ title: 'Métadonnées SEO mises à jour', color: 'success' })
    await refresh()
  } catch {
    toast.add({ title: 'Erreur lors de la sauvegarde', color: 'error' })
  } finally {
    savingMap.value[key] = false
  }
}

async function saveCoach(targetType: string, providerId: string, patch: SeoFieldValues) {
  const key = savingKey(targetType, providerId)
  savingMap.value[key] = true
  try {
    await apiFetch(`/admin/seo/${targetType}/${providerId}`, { method: 'PUT', body: patch })
    toast.add({ title: 'Métadonnées SEO mises à jour', color: 'success' })
    await refresh()
  } catch {
    toast.add({ title: 'Erreur lors de la sauvegarde', color: 'error' })
  } finally {
    savingMap.value[key] = false
  }
}

// Restore handler
const restoring = ref<Record<string, boolean>>({})

async function confirmRestore(targetType: string, providerId: string) {
  if (!window.confirm('Supprimer l\'override admin ? Les valeurs du provider seront restaurées.')) return

  const key = savingKey(targetType, providerId)
  restoring.value[key] = true
  try {
    await apiFetch(`/admin/seo/${targetType}/${providerId}/override`, { method: 'DELETE' })
    toast.add({ title: 'Override supprimé', color: 'success' })
    await refresh()
  } catch {
    toast.add({ title: 'Erreur lors de la suppression', color: 'error' })
  } finally {
    restoring.value[key] = false
  }
}

function truncate(text: string | null, max: number): string {
  if (!text) return '—'
  return text.length > max ? text.slice(0, max) + '...' : text
}
</script>

<template>
  <div class="mx-auto max-w-4xl space-y-10">
    <!-- Page Header -->
    <section class="relative mb-10 flex flex-col items-start justify-between gap-6 pl-6 md:flex-row md:items-end">
      <div class="absolute left-0 top-2 h-[90%] w-1.5 rounded-full bg-gradient-to-b from-[color:var(--color-brand-solid)] via-[rgba(212,184,160,0.35)] to-transparent opacity-70" />

      <div class="grid gap-2">
        <h1 class="font-serif text-4xl italic leading-[var(--leading-tight)] text-[color:var(--color-brand-primary)] md:text-5xl">
          Gestion SEO
        </h1>
        <p class="text-lg font-medium text-[color:var(--color-brand-secondary)]">
          Configurez les métadonnées SEO de toutes les pages publiques
        </p>
      </div>
    </section>

    <!-- Loading State -->
    <div
      v-if="status === 'pending'"
      class="space-y-8"
    >
      <div
        v-for="i in 3"
        :key="i"
        class="h-64 animate-pulse rounded-3xl border border-[color:var(--color-border-subtle)] bg-white/75 p-8"
      >
        <div class="h-6 w-48 rounded bg-[color:var(--color-brand-subtle)]" />
        <div class="mt-6 space-y-4">
          <div class="h-10 rounded bg-[color:var(--color-brand-subtle)]" />
          <div class="h-20 rounded bg-[color:var(--color-brand-subtle)]" />
        </div>
      </div>
    </div>

    <!-- Error State -->
    <div
      v-else-if="status === 'error'"
      class="relative overflow-hidden rounded-3xl border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface-elevated)] p-12 text-center shadow-card"
    >
      <UIcon
        name="lucide:alert-circle"
        size="48"
        class="mx-auto mb-4 text-red-500"
      />
      <p class="text-lg font-medium text-red-800">
        Erreur lors du chargement des configurations SEO
      </p>
      <p class="mt-2 text-sm text-[color:var(--color-brand-secondary)]">
        {{ error?.message || 'Une erreur inattendue est survenue.' }}
      </p>
      <UButton
        variant="outline"
        color="neutral"
        class="mt-6 rounded-full"
        @click="() => refresh()"
      >
        <UIcon
          name="lucide:refresh-cw"
          size="16"
        />
        Réessayer
      </UButton>
    </div>

    <!-- Data State -->
    <template v-else-if="data">
      <!-- Pages globales -->
      <section
        v-for="entry in globalEntries"
        :key="entry.targetType"
        class="space-y-4 rounded-3xl border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface-elevated)] p-8 shadow-card"
      >
        <h2 class="font-serif text-2xl italic text-[color:var(--color-brand-primary)]">
          {{ entry.label }}
        </h2>

        <AdminSeoForm
          :admin-config="entry.adminConfig"
          :resolved-config="entry.resolvedConfig"
          :saving="savingMap[savingKey(entry.targetType, null)]"
          @save="(patch) => saveGlobal(entry.targetType, patch)"
        />
      </section>

      <USeparator v-if="providerGroups.length > 0" />

      <!-- Pages coach par provider -->
      <section
        v-for="provider in providerGroups"
        :key="provider.providerId"
        class="space-y-6 rounded-3xl border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface-elevated)] p-8 shadow-card"
      >
        <h2 class="font-serif text-2xl italic text-[color:var(--color-brand-primary)]">
          {{ provider.displayName }}
        </h2>

        <div
          v-for="entry in provider.entries"
          :key="entry.targetType"
          class="space-y-4 border-l-2 border-[color:var(--color-brand-subtle)] pl-6"
        >
          <div class="flex items-center gap-2">
            <h3 class="text-lg font-medium text-[color:var(--color-brand-primary)]">
              {{ entry.targetType === 'coach_profile' ? 'Page profil' : 'Page booking' }}
            </h3>
            <UBadge
              v-if="entry.adminConfig"
              color="warning"
              variant="subtle"
            >
              Override admin
            </UBadge>
          </div>

          <!-- Provider config info -->
          <UAlert
            v-if="entry.providerConfig"
            color="info"
            variant="soft"
            icon="i-lucide-user"
          >
            <template #title>
              Configuration provider
            </template>
            <template #description>
              Title : {{ entry.providerConfig.title || '—' }} · Description : {{ truncate(entry.providerConfig.description, 60) }}
            </template>
          </UAlert>

          <AdminSeoForm
            :admin-config="entry.adminConfig"
            :resolved-config="entry.resolvedConfig"
            :saving="savingMap[savingKey(entry.targetType, provider.providerId)]"
            @save="(patch) => saveCoach(entry.targetType, provider.providerId, patch)"
          />

          <!-- Restore button -->
          <UButton
            v-if="entry.adminConfig"
            color="warning"
            variant="outline"
            size="sm"
            :loading="restoring[savingKey(entry.targetType, provider.providerId)]"
            @click="confirmRestore(entry.targetType, provider.providerId)"
          >
            Restaurer les valeurs du provider
          </UButton>
        </div>
      </section>

      <!-- Empty state if no entries at all -->
      <div
        v-if="data.length === 0"
        class="rounded-3xl border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface-elevated)] p-12 text-center shadow-card"
      >
        <UIcon
          name="lucide:globe"
          size="48"
          class="mx-auto mb-4 text-[color:var(--color-brand-muted)]"
        />
        <p class="text-[color:var(--color-brand-secondary)]">
          Aucune configuration SEO disponible
        </p>
      </div>
    </template>
  </div>
</template>
