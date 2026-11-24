<template>
  <div class="space-y-6">
    <AtomsDsPageHeader title="Nouveau contenu">
      <template #subtitle>
        <span class="block max-w-[62ch] text-base text-[color:var(--color-text-secondary)]">
          Créez un brouillon puis publiez quand il est prêt.
        </span>
      </template>
      <template #actions>
        <div class="flex max-w-[calc(100vw-5rem)] flex-wrap items-center gap-3 sm:max-w-none">
          <UButton
            variant="ghost"
            color="neutral"
            size="md"
            @click="cancel"
          >
            <UIcon
              name="lucide:arrow-left"
              class="mr-2 h-4 w-4"
            />
            Annuler
          </UButton>
        </div>
      </template>
    </AtomsDsPageHeader>

    <AtomsDsErrorState
      v-if="errorMessage"
      :message="errorMessage"
      @retry="submit"
    />

    <form
      class="space-y-6"
      @submit.prevent="submit"
    >
      <UCard class="bg-[color:var(--color-surface-card)]">
        <section class="space-y-5">
          <header>
            <h2 class="font-sans text-base font-semibold text-[color:var(--color-text-primary)]">
              Contenu
            </h2>
          </header>
          <MoleculesContentsFormFields
            v-model:title="form.title"
            v-model:type="form.type"
            v-model:body="form.body"
            v-model:slug="form.slug"
            :errors="errors"
            :disabled="saving"
          />
        </section>

        <hr class="my-6 border-[color:var(--color-border-subtle)]">

        <section class="space-y-5">
          <header>
            <h2 class="font-sans text-base font-semibold text-[color:var(--color-text-primary)]">
              Médias
            </h2>
          </header>

          <MoleculesContentCoverField
            v-model="form.coverImageUrl"
            :disabled="saving"
          />

          <MoleculesContentDocumentField
            v-model="form.document"
            :disabled="saving"
            @uploading="documentUploading = $event"
          />
        </section>

        <hr class="my-6 border-[color:var(--color-border-subtle)]">

        <section class="space-y-3">
          <header>
            <h2 class="font-sans text-base font-semibold text-[color:var(--color-text-primary)]">
              Diffusion
            </h2>
          </header>
          <div class="flex flex-wrap gap-2">
            <UButton
              size="md"
              :variant="form.audience === 'all' ? 'solid' : 'soft'"
              color="primary"
              type="button"
              :aria-pressed="form.audience === 'all'"
              :disabled="saving"
              @click="form.audience = 'all'"
            >
              Partagé avec toutes vos clientes
            </UButton>
            <UButton
              size="md"
              :variant="form.audience === 'selected' ? 'solid' : 'soft'"
              color="primary"
              type="button"
              :aria-pressed="form.audience === 'selected'"
              :disabled="saving"
              @click="form.audience = 'selected'"
            >
              Clientes choisies
            </UButton>
          </div>
        </section>
      </UCard>

      <div class="flex flex-wrap items-center justify-end gap-3 border-t border-[color:var(--color-border-subtle)] pt-4">
        <UButton
          variant="ghost"
          color="neutral"
          size="md"
          type="button"
          :disabled="saving"
          @click="cancel"
        >
          Annuler
        </UButton>
        <UButton
          color="primary"
          size="md"
          type="submit"
          :loading="saving"
          :disabled="saving || documentUploading"
        >
          Créer (brouillon)
        </UButton>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import type { ContentAudience, ContentType } from '../../../features/contents/api/contents.contract'
import { createContent } from '../../../features/contents/services/provider-contents.service'
import {
  CONTENT_GENERIC_ERROR_MESSAGE,
  resolveContentServerError,
  validateContentForm,
  type ContentFormErrors
} from '../../../features/contents/domain/content-form'
import { buildCreateContentPayload } from '../../../features/contents/domain/content-payload'
import { ApiFetchError } from '../../../services/api/api-error'
import MoleculesContentsFormFields from '../../../components/molecules/ContentsFormFields.vue'
import MoleculesContentCoverField from '../../../components/molecules/ContentCoverField.vue'
import MoleculesContentDocumentField from '../../../components/molecules/ContentDocumentField.vue'

definePageMeta({
  layout: 'provider',
  middleware: 'auth-provider',
  pageTitle: 'Nouveau contenu'
})

const toast = useToast()
const form = reactive({
  title: '',
  type: '' as ContentType | '',
  body: '',
  coverImageUrl: '',
  audience: 'selected' as ContentAudience,
  slug: '',
  document: null as { assetId: string, filename: string, sizeBytes: number } | null
})

const errors = ref<ContentFormErrors>({})
const saving = ref(false)
const errorMessage = ref<string | null>(null)
/** A PDF is still uploading: its asset id is not in the form yet. */
const documentUploading = ref(false)

function cancel() {
  navigateTo('/provider/content')
}

async function submit() {
  if (saving.value || documentUploading.value) return

  const validationErrors = validateContentForm(form)
  errors.value = validationErrors
  if (Object.keys(validationErrors).length > 0) return

  saving.value = true
  errorMessage.value = null
  try {
    const res = await createContent(buildCreateContentPayload(form))
    toast.add({ title: 'Contenu créé', color: 'success' })
    navigateTo(`/provider/content/${res.contentId}`)
  } catch (err) {
    if (err instanceof ApiFetchError) {
      const mapped = resolveContentServerError(err.apiError.code)
      if (mapped.field) {
        errors.value = { ...errors.value, [mapped.field]: mapped.message }
      } else {
        errorMessage.value = mapped.message
      }
    } else {
      errorMessage.value = CONTENT_GENERIC_ERROR_MESSAGE
    }
  } finally {
    saving.value = false
  }
}
</script>
