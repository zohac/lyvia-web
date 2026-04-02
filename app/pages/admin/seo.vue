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

const { data, status, error, refresh } = await useAsyncData<AdminSeoEntry[]>(
  'admin-seo',
  () => apiFetch<AdminSeoEntry[]>('/admin/seo')
)

const toast = useToast()

const platformEntries = computed(() =>
  data.value?.filter(e => e.targetId === null) ?? []
)

const savingMap = ref<Record<string, boolean>>({})

async function savePlatform(targetType: string, patch: SeoFieldValues) {
  savingMap.value[targetType] = true
  try {
    await apiFetch(`/admin/seo/${targetType}`, { method: 'PUT', body: patch })
    toast.add({ title: 'Métadonnées SEO mises à jour', color: 'success' })
    await refresh()
  } catch {
    toast.add({ title: 'Erreur lors de la sauvegarde', color: 'error' })
  } finally {
    savingMap.value[targetType] = false
  }
}

const TARGET_TYPE_ICONS: Record<string, string> = {
  landing: 'lucide:home',
  legal_page: 'lucide:scale'
}
</script>

<template>
  <div class="mx-auto max-w-4xl space-y-8">
    <AtomsDsPageHeader
      title="SEO Plateforme"
      subtitle="Métadonnées des pages Keova (accueil, mentions légales)"
    />

    <!-- Loading -->
    <div
      v-if="status === 'pending'"
      class="space-y-6"
    >
      <USkeleton
        v-for="i in 2"
        :key="i"
        class="h-64 rounded-2xl"
      />
    </div>

    <!-- Error -->
    <AtomsDsErrorState
      v-else-if="status === 'error'"
      :message="error?.message || 'Erreur lors du chargement'"
      @retry="refresh()"
    />

    <!-- Data -->
    <template v-else-if="data">
      <section
        v-for="entry in platformEntries"
        :key="entry.targetType"
        class="relative overflow-hidden rounded-2xl border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface-elevated)]/75 p-8 shadow-soft backdrop-blur"
      >
        <div class="mb-6 flex items-start gap-4">
          <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[color:var(--color-crepuscule-100)]">
            <UIcon
              :name="TARGET_TYPE_ICONS[entry.targetType] ?? 'lucide:file-text'"
              size="20"
              class="text-[color:var(--color-crepuscule-600)]"
            />
          </div>
          <div>
            <h2 class="font-serif text-2xl italic text-[color:var(--color-brand-primary)]">
              {{ entry.label }}
            </h2>
            <p class="mt-1 text-sm text-[color:var(--color-brand-secondary)]">
              Métadonnées affichées dans les résultats Google
            </p>
          </div>
        </div>

        <AdminSeoForm
          :admin-config="entry.adminConfig"
          :resolved-config="entry.resolvedConfig"
          :saving="savingMap[entry.targetType]"
          @save="(patch) => savePlatform(entry.targetType, patch)"
        />
      </section>

      <div
        v-if="platformEntries.length === 0"
        class="rounded-2xl border border-dashed border-[color:var(--color-brand-subtle)] bg-[color:var(--color-surface-elevated)]/75 p-12 text-center shadow-soft"
      >
        <UIcon
          name="lucide:globe"
          size="48"
          class="mx-auto mb-4 text-[color:var(--color-brand-muted)]"
        />
        <p class="text-[color:var(--color-brand-secondary)]">
          Aucune page plateforme configurée
        </p>
      </div>
    </template>
  </div>
</template>
