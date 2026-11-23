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
          <MoleculesContentsFormFields
            v-model:title="form.title"
            v-model:type="form.type"
            v-model:body="form.body"
            v-model:slug="form.slug"
            :errors="errors"
            :disabled="busy"
            slug-placeholder="Laissez vide pour conserver l’adresse actuelle"
          />

          <MoleculesContentCoverField
            v-model="form.coverImageUrl"
            :disabled="busy"
          />

          <MoleculesContentDocumentField
            v-model="form.document"
            :disabled="busy"
          />

          <div class="flex flex-wrap items-center justify-between gap-3">
            <div class="flex flex-wrap items-center gap-2">
              <UButton
                v-if="!content.isPublished"
                color="success"
                type="button"
                :disabled="!canPublish || busy"
                :loading="publishing"
                @click="publish"
              >
                Publier
              </UButton>
              <UButton
                v-else
                color="warning"
                variant="soft"
                type="button"
                :disabled="busy"
                :loading="unpublishing"
                @click="unpublish"
              >
                Dépublier
              </UButton>
              <UButton
                color="error"
                variant="ghost"
                type="button"
                :disabled="busy"
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

          <p
            v-if="!content.isPublished && !canPublish"
            class="text-xs text-[color:var(--color-text-muted)]"
          >
            Le titre et le contenu doivent être enregistrés avant de pouvoir publier.
          </p>
        </form>
      </UCard>

      <UCard class="bg-[color:var(--color-surface-card)]">
        <template #header>
          <h3 class="text-base font-semibold text-[color:var(--color-text-primary)]">
            Diffusion
          </h3>
        </template>
        <MoleculesContentDiffusionSection
          :key="content.id"
          v-model:audience="form.audience"
          :content-id="content.id"
          :disabled="busy"
        />
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
              type="button"
              @click="isDeleteModalOpen = false"
            >
              Annuler
            </UButton>
            <UButton
              color="error"
              type="button"
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
import type { ContentAudience, ContentItem, ContentType } from '../../../features/contents/api/contents.contract'
import { getMyContent, updateContent, publishContent, unpublishContent, deleteContent } from '../../../features/contents/services/provider-contents.service'
import { mapProviderContentsErrorToMessage } from '../../../features/contents/api/contents-error'
import {
  CONTENT_GENERIC_ERROR_MESSAGE,
  isContentPublishable,
  resolveContentServerError,
  validateContentForm,
  type ContentFormErrors
} from '../../../features/contents/domain/content-form'
import { buildUpdateContentPayload } from '../../../features/contents/domain/content-payload'
import { ApiFetchError } from '../../../services/api/api-error'
import MoleculesContentsFormFields from '../../../components/molecules/ContentsFormFields.vue'
import MoleculesContentCoverField from '../../../components/molecules/ContentCoverField.vue'
import MoleculesContentDocumentField from '../../../components/molecules/ContentDocumentField.vue'
import MoleculesContentDiffusionSection from '../../../components/molecules/ContentDiffusionSection.vue'

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
  type: '' as ContentType | '',
  body: '',
  coverImageUrl: '',
  audience: 'selected' as ContentAudience,
  slug: '',
  document: null as { assetId: string, filename: string, sizeBytes: number } | null
})

const original = ref<ContentItem | null>(null)
const errors = ref<ContentFormErrors>({})
const saving = ref(false)
const publishing = ref(false)
const unpublishing = ref(false)
const deleting = ref(false)
const isDeleteModalOpen = ref(false)

const busy = computed(() =>
  saving.value || publishing.value || unpublishing.value || deleting.value
)

const canPublish = computed(() =>
  isContentPublishable({ title: content.value?.title, body: content.value?.body })
)

// Request token for GET (DR-3)
let loadToken = 0

function fillForm(data: ContentItem) {
  content.value = data
  original.value = { ...data }
  form.title = data.title ?? ''
  form.type = data.type ?? ''
  form.body = data.body ?? ''
  form.coverImageUrl = data.coverImageUrl ?? ''
  form.audience = (data.audience ?? 'selected') as ContentAudience
  form.slug = data.slug ?? ''
  form.document = data.document
    ? { assetId: '', filename: data.document.filename, sizeBytes: data.document.sizeBytes }
    : null
}

async function load() {
  const token = ++loadToken
  loading.value = true
  loadError.value = null
  try {
    const data = await getMyContent(id.value)
    if (token !== loadToken) return
    fillForm(data)
  } catch (err) {
    if (token !== loadToken) return
    loadError.value = mapProviderContentsErrorToMessage(err, 'Impossible de charger le contenu.')
  } finally {
    if (token === loadToken) loading.value = false
  }
}

onMounted(load)
watch(id, load)

function goBack() {
  navigateTo('/provider/content')
}

async function refreshServerState() {
  const data = await getMyContent(id.value)
  content.value = data
  original.value = { ...data }
}

async function save() {
  const validationErrors = validateContentForm({ title: form.title, type: form.type, body: form.body, slug: form.slug, coverImageUrl: form.coverImageUrl })
  errors.value = validationErrors
  if (Object.keys(validationErrors).length > 0) return
  if (!original.value) return

  const payload = buildUpdateContentPayload(
    {
      title: form.title,
      type: form.type,
      body: form.body,
      coverImageUrl: form.coverImageUrl,
      audience: form.audience,
      slug: form.slug
    },
    {
      title: original.value.title,
      type: original.value.type,
      body: original.value.body,
      coverImageUrl: original.value.coverImageUrl,
      audience: original.value.audience,
      slug: original.value.slug
    } as Parameters<typeof buildUpdateContentPayload>[1]
  )
  if (Object.keys(payload).length === 0 && form.document === null && original.value.document) {
    // allow document-only? handled separately below
  }

  // Handle document changes separately: if cleared, need to update content? API uses documentAssetId?
  // The update DTO doesn't include a document field per openapi; document managed via asset upload + content update.
  // Keep payload as is.

  if (Object.keys(payload).length === 0) {
    toast.add({ title: 'Aucune modification à enregistrer', color: 'neutral' })
    return
  }

  saving.value = true
  try {
    await updateContent(id.value, payload)
    toast.add({ title: 'Contenu enregistré', color: 'success' })
    // re-read in separate try (DR-5)
    try {
      fillForm(await getMyContent(id.value))
    } catch {
      toast.add({ title: 'Le contenu est enregistré, mais le rechargement a échoué.', color: 'warning' })
    }
  } catch (err) {
    if (err instanceof ApiFetchError) {
      const mapped = resolveContentServerError(err.apiError.code)
      if (mapped.field) {
        errors.value = { ...errors.value, [mapped.field]: mapped.message }
        return
      }
      toast.add({ title: mapped.message, color: 'error' })
      return
    }
    toast.add({ title: CONTENT_GENERIC_ERROR_MESSAGE, color: 'error' })
  } finally {
    saving.value = false
  }
}

async function publish() {
  if (busy.value) return
  publishing.value = true
  try {
    await publishContent(id.value)
    toast.add({ title: 'Contenu publié', color: 'success' })
    await refreshServerState()
  } catch (err) {
    if (err instanceof ApiFetchError && err.apiError.code === 'CONTENT_NOT_PUBLISHABLE') {
      toast.add({ title: resolveContentServerError(err.apiError.code).message, color: 'error' })
    } else {
      toast.add({
        title: mapProviderContentsErrorToMessage(err, 'Impossible de publier.'),
        color: 'error'
      })
    }
  } finally {
    publishing.value = false
  }
}

async function unpublish() {
  if (busy.value) return
  unpublishing.value = true
  try {
    await unpublishContent(id.value)
    toast.add({ title: 'Contenu dépublié', color: 'success' })
    await refreshServerState()
  } catch (err) {
    toast.add({
      title: mapProviderContentsErrorToMessage(err, 'Impossible de dépublier.'),
      color: 'error'
    })
  } finally {
    unpublishing.value = false
  }
}

async function handleDelete() {
  if (deleting.value) return
  deleting.value = true
  try {
    await deleteContent(id.value)
    toast.add({ title: 'Contenu supprimé', color: 'success' })
    isDeleteModalOpen.value = false
    navigateTo('/provider/content')
  } catch (err) {
    toast.add({
      title: mapProviderContentsErrorToMessage(err, 'Impossible de supprimer.'),
      color: 'error'
    })
  } finally {
    deleting.value = false
  }
}
</script>
