<script setup lang="ts">
import MoleculesContentsFormFields from '~/components/molecules/ContentsFormFields.vue'
import MoleculesContentCoverField from '~/components/molecules/ContentCoverField.vue'
import {
  getAdminContent,
  updateAdminContent,
  publishAdminContent,
  unpublishAdminContent,
  deleteAdminContent,
  ADMIN_CONTENT_UPLOAD_ENDPOINT
} from '~/features/contents/services/admin-contents.service'
import { createAdminContentEditor } from '~/features/contents/createAdminContentEditor'
import {
  ADMIN_CONTENT_TYPE,
  formatAdminApprovalCount,
  getAdminStatusBadge
} from '~/features/contents/domain/admin-content-form'
import { getStatusBadgeClasses } from '~/composables/useAdminBadges'

definePageMeta({
  layout: 'admin',
  middleware: 'auth-admin',
  pageTitle: 'Article Keova'
})

const route = useRoute()
const toast = useToast()
const id = computed(() => String(route.params.id))

/**
 * Presentation and wiring only. The load token, the mutation-versus-re-read
 * split, the immediate publish state and the French error copy are executed by
 * tests/contents/admin-contents.test.ts.
 */
const {
  loading,
  loadError,
  content,
  form,
  errors,
  saving,
  publishing,
  unpublishing,
  deleting,
  busy,
  canPublish,
  statusScopeLabel,
  load,
  save,
  publish,
  unpublish,
  handleDelete
} = createAdminContentEditor({
  id: () => id.value,
  getContent: getAdminContent,
  updateContent: updateAdminContent,
  publishContent: publishAdminContent,
  unpublishContent: unpublishAdminContent,
  deleteContent: deleteAdminContent,
  notify: notice => toast.add(notice),
  navigate: path => navigateTo(path)
})

const isDeleteModalOpen = ref(false)

const statusBadge = computed(() => getAdminStatusBadge(content.value?.isPublished === true))
const statusBadgeClasses = computed(() => getStatusBadgeClasses(statusBadge.value.color))

onMounted(load)
watch(id, load)

function goBack() {
  navigateTo('/admin/content')
}

async function confirmDelete() {
  await handleDelete()
  isDeleteModalOpen.value = false
}
</script>

<template>
  <div class="space-y-6">
    <AtomsDsPageHeader :title="content ? content.title : 'Article'">
      <template #actions>
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
      <div class="flex flex-wrap items-center gap-3">
        <span :class="statusBadgeClasses.badge">
          <span :class="statusBadgeClasses.dot" />
          {{ statusBadge.label }}
        </span>
        <span class="text-sm text-[color:var(--color-text-muted)]">
          {{ statusScopeLabel }}
        </span>
        <span class="text-sm text-[color:var(--color-text-secondary)]">
          {{ formatAdminApprovalCount(content.approvalCount) }}
        </span>
      </div>

      <UCard class="bg-[color:var(--color-surface-card)]">
        <form
          class="space-y-4"
          @submit.prevent="save"
        >
          <MoleculesContentsFormFields
            v-model:title="form.title"
            v-model:body="form.body"
            v-model:slug="form.slug"
            :type="ADMIN_CONTENT_TYPE"
            :type-disabled="true"
            :errors="errors"
            :disabled="busy"
            slug-placeholder="Laissez vide pour conserver l’adresse actuelle"
          />

          <MoleculesContentCoverField
            v-model="form.coverImageUrl"
            :error="errors.coverImageUrl"
            :disabled="busy"
            :upload-endpoint="ADMIN_CONTENT_UPLOAD_ENDPOINT"
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
              :disabled="busy"
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

      <UModal
        v-model:open="isDeleteModalOpen"
        title="Supprimer l’article"
      >
        <template #body>
          <p>Êtes-vous sûr de vouloir supprimer cet article et les approbations associées ? Cette action est irréversible.</p>
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
              @click="confirmDelete"
            >
              Supprimer
            </UButton>
          </div>
        </template>
      </UModal>
    </template>
  </div>
</template>
