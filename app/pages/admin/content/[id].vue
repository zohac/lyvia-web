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
  const deleted = await handleDelete()
  // The modal warns about an irreversible action: only close it on real success.
  if (deleted) {
    isDeleteModalOpen.value = false
  }
}
</script>

<template>
  <div class="space-y-6">
    <AtomsDsPageHeader :title="content ? content.title : 'Article'">
      <template #actions>
        <div class="flex max-w-[calc(100vw-5rem)] flex-wrap items-center gap-3 sm:max-w-none">
          <UButton
            size="sm"
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

    <UCard
      v-else-if="loading"
      class="bg-[color:var(--color-surface-card)]"
    >
      <div class="space-y-4">
        <USkeleton class="h-4 w-24" />
        <USkeleton class="h-10 w-full rounded-[8px]" />
        <USkeleton class="h-4 w-24" />
        <USkeleton class="h-10 w-full rounded-[8px]" />
        <USkeleton class="h-44 w-full rounded-[8px]" />
      </div>
    </UCard>

    <template v-else-if="content">
      <div class="flex flex-wrap items-center gap-x-3 gap-y-2">
        <span :class="statusBadgeClasses.badge">
          <span :class="statusBadgeClasses.dot" />
          {{ statusBadge.label }}
        </span>
        <span class="text-sm text-[color:var(--color-text-secondary)]">
          {{ statusScopeLabel }}
        </span>
        <span class="text-sm tabular-nums text-[color:var(--color-text-secondary)]">
          {{ formatAdminApprovalCount(content.approvalCount) }}
        </span>
      </div>

      <form
        class="space-y-4"
        @submit.prevent="save"
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
              v-model:body="form.body"
              v-model:slug="form.slug"
              :type="ADMIN_CONTENT_TYPE"
              :type-disabled="true"
              :errors="errors"
              :disabled="busy"
              control-size="compact"
              slug-placeholder="Laissez vide pour conserver l’adresse actuelle"
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
              :error="errors.coverImageUrl"
              :disabled="busy"
              control-size="compact"
              :upload-endpoint="ADMIN_CONTENT_UPLOAD_ENDPOINT"
            />
          </section>
        </UCard>

        <p
          v-if="!content.isPublished && !canPublish"
          class="text-xs text-[color:var(--color-neutral-600)]"
        >
          Le titre et le contenu doivent être enregistrés avant de pouvoir publier.
        </p>

        <div class="flex flex-wrap items-center justify-between gap-3 border-t border-[color:var(--color-border-subtle)] pt-4">
          <div class="flex flex-wrap items-center gap-2">
            <UButton
              v-if="!content.isPublished"
              size="sm"
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
              size="sm"
              color="warning"
              variant="soft"
              type="button"
              :disabled="busy"
              :loading="unpublishing"
              @click="unpublish"
            >
              Dépublier
            </UButton>
            <span class="mx-1 hidden h-6 w-px bg-[color:var(--color-border-subtle)] sm:block" />
            <UButton
              size="sm"
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
            size="sm"
            color="primary"
            type="submit"
            :loading="saving"
            :disabled="busy"
          >
            Enregistrer
          </UButton>
        </div>
      </form>

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
              size="sm"
              variant="ghost"
              type="button"
              @click="isDeleteModalOpen = false"
            >
              Annuler
            </UButton>
            <UButton
              size="sm"
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
