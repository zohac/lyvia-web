<script setup lang="ts">
import { h } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import { apiFetch } from '~/services/api/apiFetch'
import { ADMIN_TABLE_CLASSES } from '~/features/admin/admin-table-classes'
import { getStatusBadgeClasses } from '~/composables/useAdminBadges'
import { formatDateShort } from '~/composables/useDateFormat'

definePageMeta({
  layout: 'admin',
  middleware: 'auth-admin',
  pageTitle: 'Templates pages coaches'
})

const toast = useToast()

// ── Types ──
type AdminTemplate = {
  id: string
  code: string
  name: string
  description: string | null
  previewImageUrl: string | null
  sectionsAvailable: string[]
  isActive: boolean
  exclusiveProviderId: string | null
  exclusiveProviderName: string | null
  providerCount: number
  createdAt: string
}

type ProviderOption = {
  id: string
  displayName: string
}

type AdminProvidersResponse = {
  items: ProviderOption[]
}

// ── Data ──
const { data: templates, pending, refresh } = await useAsyncData<AdminTemplate[]>(
  'admin-coach-templates',
  () => apiFetch<AdminTemplate[]>('/admin/coach-page-templates')
)

// Fetch providers for the exclusive select
const providerOptions = ref<{ label: string, value: string }[]>([])
const providersLoaded = ref(false)

async function loadProviders() {
  if (providersLoaded.value) return
  try {
    const res = await apiFetch<AdminProvidersResponse>('/admin/providers', {
      params: { limit: '200' }
    })
    providerOptions.value = [
      { label: 'Aucun (tous les coaches)', value: '' },
      ...res.items.map(p => ({ label: p.displayName, value: p.id }))
    ]
    providersLoaded.value = true
  } catch {
    providerOptions.value = [{ label: 'Aucun (tous les coaches)', value: '' }]
  }
}

// ── Slideover state ──
const slideoverOpen = ref(false)
const slideoverSaving = ref(false)
const editingTemplate = ref<AdminTemplate | null>(null)
const editForm = reactive({
  name: '',
  description: '',
  previewImageUrl: '',
  isActive: true,
  exclusiveProviderId: ''
})

async function openEdit(tmpl: AdminTemplate) {
  editingTemplate.value = tmpl
  editForm.name = tmpl.name
  editForm.description = tmpl.description ?? ''
  editForm.previewImageUrl = tmpl.previewImageUrl ?? ''
  editForm.isActive = tmpl.isActive
  editForm.exclusiveProviderId = tmpl.exclusiveProviderId ?? ''
  slideoverOpen.value = true
  await loadProviders()
}

async function saveEdit() {
  if (!editingTemplate.value || slideoverSaving.value) return
  slideoverSaving.value = true

  try {
    const body: Record<string, unknown> = {}

    if (editForm.name !== editingTemplate.value.name) {
      body.name = editForm.name.trim()
    }
    if ((editForm.description || null) !== editingTemplate.value.description) {
      body.description = editForm.description?.trim() || null
    }
    if ((editForm.previewImageUrl || null) !== editingTemplate.value.previewImageUrl) {
      body.previewImageUrl = editForm.previewImageUrl?.trim() || null
    }
    if (editForm.isActive !== editingTemplate.value.isActive) {
      body.isActive = editForm.isActive
    }
    if ((editForm.exclusiveProviderId || null) !== editingTemplate.value.exclusiveProviderId) {
      body.exclusiveProviderId = editForm.exclusiveProviderId?.trim() || null
    }

    if (Object.keys(body).length === 0) {
      slideoverOpen.value = false
      return
    }

    await apiFetch(`/admin/coach-page-templates/${editingTemplate.value.id}`, {
      method: 'PATCH',
      body
    })

    toast.add({ title: 'Template mis à jour', color: 'primary' })
    slideoverOpen.value = false
    await refresh()
  } catch {
    toast.add({ title: 'Erreur lors de la mise à jour', color: 'error' })
  } finally {
    slideoverSaving.value = false
  }
}

// ── Quick toggle ──
async function toggleActive(tmpl: AdminTemplate) {
  try {
    await apiFetch(`/admin/coach-page-templates/${tmpl.id}`, {
      method: 'PATCH',
      body: { isActive: !tmpl.isActive }
    })
    await refresh()
  } catch {
    toast.add({ title: 'Erreur lors du changement de statut', color: 'error' })
  }
}

// ── Table columns ──
const columns: TableColumn<AdminTemplate>[] = [
  {
    accessorKey: 'name',
    header: 'Nom',
    cell: ({ row }) => h('div', { class: 'font-medium text-[color:var(--color-text-primary)]' }, [
      h('div', row.original.name),
      h('div', { class: 'text-xs text-[color:var(--color-text-muted)]' }, row.original.code)
    ])
  },
  {
    accessorKey: 'isActive',
    header: 'Statut',
    cell: ({ row }) => {
      const variant = row.original.isActive ? 'success' : 'neutral'
      const classes = getStatusBadgeClasses(variant)
      return h('span', { class: classes.badge }, [
        h('span', { class: classes.dot }),
        row.original.isActive ? 'Actif' : 'Inactif'
      ])
    }
  },
  {
    accessorKey: 'exclusiveProviderName',
    header: 'Exclusivité',
    cell: ({ row }) => h('span', {
      class: 'text-sm text-[color:var(--color-text-secondary)]'
    }, row.original.exclusiveProviderName ?? 'Tous')
  },
  {
    accessorKey: 'providerCount',
    header: 'Coaches',
    cell: ({ row }) => h('span', {
      class: 'text-sm font-medium text-[color:var(--color-text-primary)]'
    }, String(row.original.providerCount))
  },
  {
    accessorKey: 'sectionsAvailable',
    header: 'Sections',
    cell: ({ row }) => h('span', {
      class: 'text-sm text-[color:var(--color-text-muted)]'
    }, `${row.original.sectionsAvailable.length} sections`)
  },
  {
    accessorKey: 'createdAt',
    header: 'Créé le',
    cell: ({ row }) => h('span', {
      class: 'text-sm text-[color:var(--color-text-muted)]'
    }, formatDateShort(row.original.createdAt))
  },
  {
    id: 'actions',
    header: '',
    cell: ({ row }) => h('div', { class: 'flex gap-2' }, [
      h(resolveComponent('UButton'), {
        color: 'neutral',
        variant: 'ghost',
        size: 'xs',
        icon: 'i-lucide-pencil',
        onClick: () => openEdit(row.original)
      }),
      h(resolveComponent('UButton'), {
        color: row.original.isActive ? 'neutral' : 'primary',
        variant: 'ghost',
        size: 'xs',
        icon: row.original.isActive ? 'i-lucide-eye-off' : 'i-lucide-eye',
        onClick: () => toggleActive(row.original)
      })
    ])
  }
]
</script>

<template>
  <div>
    <AtomsDsPageHeader>
      Templates pages coaches
      <template #subtitle>
        Gérez le registre de templates et supervisez les pages des coaches.
      </template>
    </AtomsDsPageHeader>

    <!-- Loading -->
    <div
      v-if="pending"
      class="space-y-4"
    >
      <USkeleton class="h-10 w-full" />
      <USkeleton class="h-64 w-full" />
    </div>

    <template v-else-if="templates">
      <!-- Desktop table -->
      <div class="hidden sm:block">
        <UTable
          :data="templates"
          :columns="columns"
          :ui="{ root: ADMIN_TABLE_CLASSES }"
        />
      </div>

      <!-- Mobile cards -->
      <div class="space-y-3 sm:hidden">
        <button
          v-for="tmpl in templates"
          :key="tmpl.id"
          type="button"
          class="w-full rounded-xl border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface-card)] p-4 text-left"
          @click="openEdit(tmpl)"
        >
          <div class="flex items-center justify-between">
            <div>
              <div class="font-medium text-[color:var(--color-text-primary)]">
                {{ tmpl.name }}
              </div>
              <div class="text-xs text-[color:var(--color-text-muted)]">
                {{ tmpl.code }}
              </div>
            </div>
            <span :class="getStatusBadgeClasses(tmpl.isActive ? 'success' : 'neutral').badge">
              <span :class="getStatusBadgeClasses(tmpl.isActive ? 'success' : 'neutral').dot" />
              {{ tmpl.isActive ? 'Actif' : 'Inactif' }}
            </span>
          </div>
          <div class="mt-2 flex gap-4 text-xs text-[color:var(--color-text-muted)]">
            <span>{{ tmpl.providerCount }} coaches</span>
            <span>{{ tmpl.sectionsAvailable.length }} sections</span>
            <span>{{ tmpl.exclusiveProviderName ?? 'Tous' }}</span>
          </div>
        </button>
      </div>
    </template>

    <!-- ═══════ SLIDEOVER EDIT ═══════ -->
    <USlideover
      v-model:open="slideoverOpen"
      side="right"
    >
      <template #header>
        <div class="flex items-center gap-3">
          <UIcon
            name="i-lucide-layout-template"
            class="size-5 text-[color:var(--color-brand-primary)]"
          />
          <div>
            <h3 class="text-lg font-semibold text-[color:var(--color-text-primary)]">
              Modifier le template
            </h3>
            <p class="text-sm text-[color:var(--color-text-muted)]">
              {{ editingTemplate?.code }}
            </p>
          </div>
        </div>
      </template>

      <template #body>
        <div class="space-y-4 p-4">
          <UFormField label="Nom">
            <UInput
              v-model="editForm.name"
              placeholder="Nom du template"
            />
          </UFormField>

          <UFormField label="Description">
            <UTextarea
              v-model="editForm.description"
              placeholder="Description (optionnel)"
              :rows="3"
            />
          </UFormField>

          <UFormField label="URL image preview">
            <UInput
              v-model="editForm.previewImageUrl"
              placeholder="https://... (optionnel)"
            />
          </UFormField>

          <UFormField label="Provider exclusif">
            <USelect
              v-model="editForm.exclusiveProviderId"
              :items="providerOptions"
              value-key="value"
              label-key="label"
              placeholder="Sélectionner un provider (optionnel)"
            />
          </UFormField>

          <div class="flex items-center justify-between rounded-lg border border-[color:var(--color-border-subtle)] px-4 py-3">
            <span class="text-sm font-medium text-[color:var(--color-text-primary)]">
              Template actif
            </span>
            <USwitch v-model="editForm.isActive" />
          </div>
        </div>
      </template>

      <template #footer>
        <div class="flex justify-end gap-3 p-4">
          <UButton
            color="neutral"
            variant="outline"
            @click="slideoverOpen = false"
          >
            Annuler
          </UButton>
          <UButton
            color="primary"
            :loading="slideoverSaving"
            @click="saveEdit"
          >
            Sauvegarder
          </UButton>
        </div>
      </template>
    </USlideover>
  </div>
</template>
