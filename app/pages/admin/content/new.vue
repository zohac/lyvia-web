<script setup lang="ts">
import MoleculesContentsFormFields from '~/components/molecules/ContentsFormFields.vue'
import MoleculesContentCoverField from '~/components/molecules/ContentCoverField.vue'
import type { ContentFormErrors } from '~/features/contents/domain/content-form'
import { CONTENT_GENERIC_ERROR_MESSAGE } from '~/features/contents/domain/content-form'
import {
  ADMIN_CONTENT_TYPE,
  buildCreateAdminContentPayload,
  resolveAdminContentServerError,
  validateAdminContentForm
} from '~/features/contents/domain/admin-content-form'
import {
  ADMIN_CONTENT_UPLOAD_ENDPOINT,
  createAdminContent
} from '~/features/contents/services/admin-contents.service'
import { ApiFetchError } from '~/services/api/api-error'

definePageMeta({
  layout: 'admin',
  middleware: 'auth-admin',
  pageTitle: 'Nouvel article Keova'
})

const toast = useToast()

// `type` is deliberately not a form field: a platform article is always an
// article (the server rejects any other value). Validation payload builders are
// pure and executed by tests/contents/admin-contents.test.ts.
const form = reactive({
  title: '',
  slug: '',
  body: '',
  coverImageUrl: ''
})
const errors = ref<ContentFormErrors>({})
const errorMessage = ref<string | null>(null)
const saving = ref(false)

function cancel() {
  navigateTo('/admin/content')
}

async function submit() {
  if (saving.value) return

  const validationErrors = validateAdminContentForm(form)
  errors.value = validationErrors
  if (Object.keys(validationErrors).length > 0) return

  saving.value = true
  errorMessage.value = null
  try {
    const result = await createAdminContent(buildCreateAdminContentPayload(form))
    toast.add({ title: 'Article créé', color: 'success' })
    navigateTo(`/admin/content/${result.contentId}`)
  } catch (err) {
    if (err instanceof ApiFetchError) {
      const mapped = resolveAdminContentServerError(err.apiError.code)
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

<template>
  <div class="space-y-6">
    <AtomsDsPageHeader
      title="Nouvel article"
      subtitle="Créez un brouillon, puis publiez-le quand il est prêt."
    >
      <template #actions>
        <UButton
          variant="ghost"
          color="neutral"
          @click="cancel"
        >
          <UIcon
            name="lucide:arrow-left"
            class="mr-2 h-4 w-4"
          />
          Annuler
        </UButton>
      </template>
    </AtomsDsPageHeader>

    <AtomsDsErrorState
      v-if="errorMessage"
      :message="errorMessage"
      @retry="submit"
    />

    <UCard class="bg-[color:var(--color-surface-card)]">
      <form
        class="space-y-4"
        @submit.prevent="submit"
      >
        <p class="text-sm text-[color:var(--color-text-muted)]">
          Type : <span class="font-medium text-[color:var(--color-text-primary)]">Article</span> —
          seul type disponible pour un contenu de plateforme ({{ ADMIN_CONTENT_TYPE }}).
        </p>

        <MoleculesContentsFormFields
          v-model:title="form.title"
          v-model:body="form.body"
          v-model:slug="form.slug"
          :type="ADMIN_CONTENT_TYPE"
          :type-disabled="true"
          :errors="errors"
          :disabled="saving"
          slug-placeholder="Laissez vide pour générer l’adresse à partir du titre"
        />

        <MoleculesContentCoverField
          v-model="form.coverImageUrl"
          :error="errors.coverImageUrl"
          :disabled="saving"
          :upload-endpoint="ADMIN_CONTENT_UPLOAD_ENDPOINT"
        />

        <div class="flex justify-end gap-3">
          <UButton
            variant="ghost"
            color="neutral"
            type="button"
            :disabled="saving"
            @click="cancel"
          >
            Annuler
          </UButton>
          <UButton
            color="primary"
            type="submit"
            :loading="saving"
            :disabled="saving"
          >
            Créer (brouillon)
          </UButton>
        </div>
      </form>
    </UCard>
  </div>
</template>
