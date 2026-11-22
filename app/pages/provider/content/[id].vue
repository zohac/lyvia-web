<template>
  <div class="space-y-6">
    <AtomsDsPageHeader :title="content ? content.title : 'Contenu'">
      <template #actions>
        <div class="flex items-center gap-2">
          <UButton
            variant="ghost"
            color="neutral"
            @click="goBack"
          >
            <UIcon
              name="lucide:arrow-left"
              class="mr-2 h-4 w-4"
            />
            Retour
          </UButton>
        </div>
      </template>
    </AtomsDsPageHeader>

    <AtomsDsErrorState
      v-if="loadError"
      :message="loadError"
      @retry="load"
    />

    <div
      v-else-if="loading"
      class="space-y-4"
    >
      <USkeleton class="h-8 w-1/3" />
      <USkeleton class="h-40 w-full" />
    </div>

    <template v-else-if="content">
      <UCard class="bg-[color:var(--color-surface-card)]">
        <form
          class="space-y-4"
          @submit.prevent="save"
        >
          <UFormField
            label="Titre"
            name="title"
            :error="errors.title"
          >
            <UInput
              v-model="form.title"
              autocomplete="off"
              :max-length="200"
              class="w-full"
            />
          </UFormField>

          <UFormField
            label="Type"
            name="type"
            :error="errors.type"
          >
            <USelect
              v-model="form.type"
              :options="typeOptions"
              class="w-full"
            />
          </UFormField>

          <UFormField
            label="Contenu (markdown)"
            name="body"
          >
            <UTextarea
              v-model="form.body"
              :rows="10"
              class="w-full"
              autocomplete="off"
            />
          </UFormField>

          <UFormField
            label="URL de l'image de couverture"
            name="coverImageUrl"
            :error="errors.coverImageUrl"
          >
            <UInput
              v-model="form.coverImageUrl"
              type="url"
              autocomplete="url"
              class="w-full"
            />
          </UFormField>

          <UFormField
            label="Visibilité"
            name="visibility"
          >
            <USelect
              v-model="form.visibility"
              :options="visibilityOptions"
              class="w-full"
            />
          </UFormField>

          <UFormField
            label="Slug"
            name="slug"
            :error="errors.slug"
          >
            <UInput
              v-model="form.slug"
              autocomplete="off"
              class="w-full"
            />
          </UFormField>

          <UAlert
            v-if="slugError"
            color="error"
            variant="soft"
            :title="slugError"
            icon="i-lucide-alert-circle"
          />

          <div class="flex flex-wrap justify-between gap-3">
            <div class="flex gap-2">
              <template v-if="!content.isPublished">
                <UButton
                  color="success"
                  :disabled="!canPublish"
                  :loading="publishing"
                  @click="publish"
                >
                  Publier
                </UButton>
              </template>
              <template v-else>
                <UButton
                  color="warning"
                  variant="soft"
                  :loading="unpublishing"
                  @click="unpublish"
                >
                  Dépublier
                </UButton>
              </template>
              <UButton
                color="error"
                variant="ghost"
                @click="isDeleteModalOpen = true"
              >
                Supprimer
              </UButton>
            </div>
            <UButton
              color="primary"
              type="submit"
              :loading="saving"
            >
              Enregistrer
            </UButton>
          </div>
        </form>
      </UCard>

      <UModal
        v-model:open="isDeleteModalOpen"
        title="Supprimer le contenu"
      >
        <template #body>
          <p>Êtes-vous sûr de vouloir supprimer ce contenu ? Cette action est irréversible.</p>
        </template>
        <template #footer>
          <div class="flex justify-end gap-3">
            <UButton
              variant="ghost"
              @click="isDeleteModalOpen = false"
            >
              Annuler
            </UButton>
            <UButton
              color="error"
              :loading="deleting"
              @click="handleDelete"
            >
              Supprimer
            </UButton>
          </div>
        </template>
      </UModal>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { ContentItem } from '../../../features/contents/api/contents.contract'
import { getMyContent, updateContent, publishContent, unpublishContent, deleteContent } from '../../../features/contents/services/provider-contents.service'
import { validateContentForm, resolveContentServerError, isContentPublishable } from '../../../features/contents/domain/content-form'
import { ApiFetchError } from '../../../services/api/api-error'

const route = useRoute()
const toast = useToast()

definePageMeta({
  layout: 'provider',
  middleware: 'auth-provider',
  pageTitle: 'Contenu'
})

const id = computed(() => String(route.params.id))

const loading = ref(true)
const loadError = ref<string | null>(null)
const content = ref<ContentItem | null>(null)

const form = reactive({
  title: '',
  type: '' as 'article' | 'recette' | 'actualite' | '',
  body: '',
  coverImageUrl: '',
  visibility: 'public' as 'public' | 'private',
  slug: ''
})

const original = ref<ContentItem | null>(null)
const errors = ref<Record<string, string>>({})
const saving = ref(false)
const publishing = ref(false)
const unpublishing = ref(false)
const deleting = ref(false)
const isDeleteModalOpen = ref(false)
const slugError = ref<string | null>(null)

const typeOptions = [
  { label: 'Article', value: 'article' },
  { label: 'Recette', value: 'recette' },
  { label: 'Actualité', value: 'actualite' }
]

const visibilityOptions = [
  { label: 'Public', value: 'public' },
  { label: 'Privé', value: 'private' }
]

const canPublish = computed(() => isContentPublishable({ title: form.title, body: form.body }))

async function load() {
  loading.value = true
  loadError.value = null
  try {
    const data = await getMyContent(id.value)
    content.value = data
    original.value = { ...data }
    form.title = data.title ?? ''
    form.type = data.type ?? ''
    form.body = data.body ?? ''
    form.coverImageUrl = data.coverImageUrl ?? ''
    form.visibility = data.visibility ?? 'public'
    form.slug = data.slug ?? ''
  } catch (err) {
    loadError.value = err instanceof Error ? err.message : 'Impossible de charger le contenu.'
  } finally {
    loading.value = false
  }
}

onMounted(load)
watch(id, load)

function goBack() {
  navigateTo('/provider/content')
}

async function save() {
  slugError.value = null
  const validationErrors = validateContentForm({
    title: form.title,
    type: form.type,
    slug: form.slug,
    body: form.body,
    coverImageUrl: form.coverImageUrl,
    visibility: form.visibility
  })
  errors.value = validationErrors as Record<string, string>
  if (Object.keys(validationErrors).length > 0) return

  saving.value = true
  try {
    const payload: Record<string, unknown> = {}
    if (form.title.trim() !== (original.value?.title ?? '')) payload.title = form.title.trim()
    if (form.type !== (original.value?.type ?? '')) payload.type = form.type
    if (form.body.trim() !== (original.value?.body ?? '')) payload.body = form.body.trim() === '' ? null : form.body.trim()
    const cover = form.coverImageUrl.trim()
    if (cover !== (original.value?.coverImageUrl ?? '')) payload.coverImageUrl = cover === '' ? null : cover
    if (form.visibility !== (original.value?.visibility ?? '')) payload.visibility = form.visibility
    if (form.slug.trim() !== (original.value?.slug ?? '')) payload.slug = form.slug.trim()

    await updateContent(id.value, payload as import('../../../features/contents/api/contents.contract').UpdateContentRequest)
    toast.add({ title: 'Contenu enregistré', color: 'success' })
    await load()
  } catch (err) {
    if (err instanceof ApiFetchError && err.apiError.code === 'SLUG_ALREADY_TAKEN') {
      slugError.value = resolveContentServerError(err.apiError.code).message
    } else if (err instanceof ApiFetchError) {
      const mapped = resolveContentServerError(err.apiError.code)
      if (mapped.field) errors.value = { [mapped.field]: mapped.message }
      else {
        toast.add({ title: mapped.message, color: 'error' })
      }
    } else {
      toast.add({ title: 'Une erreur est survenue.', color: 'error' })
    }
  } finally {
    saving.value = false
  }
}

async function publish() {
  publishing.value = true
  try {
    await publishContent(id.value)
    toast.add({ title: 'Contenu publié', color: 'success' })
    await load()
  } catch (err) {
    if (err instanceof ApiFetchError && err.apiError.code === 'CONTENT_NOT_PUBLISHABLE') {
      toast.add({ title: resolveContentServerError(err.apiError.code).message, color: 'error' })
    } else {
      toast.add({ title: 'Impossible de publier.', color: 'error' })
    }
  } finally {
    publishing.value = false
  }
}

async function unpublish() {
  unpublishing.value = true
  try {
    await unpublishContent(id.value)
    toast.add({ title: 'Contenu dépublié', color: 'success' })
    await load()
  } catch {
    toast.add({ title: 'Impossible de dépublier.', color: 'error' })
  } finally {
    unpublishing.value = false
  }
}

async function handleDelete() {
  deleting.value = true
  try {
    await deleteContent(id.value)
    toast.add({ title: 'Contenu supprimé', color: 'success' })
    isDeleteModalOpen.value = false
    navigateTo('/provider/content')
  } catch {
    toast.add({ title: 'Impossible de supprimer.', color: 'error' })
  } finally {
    deleting.value = false
  }
}
</script>
