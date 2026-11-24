<template>
  <div class="space-y-3">
    <div
      v-if="audience === 'all'"
      class="rounded-[12px] border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface-highlight)] p-4"
    >
      <p class="text-sm font-semibold text-[color:var(--color-text-primary)]">
        Partagé avec toutes vos clientes
      </p>
      <p class="mt-1 text-[13px] text-[color:var(--color-text-secondary)]">
        Couvre aussi les clientes qui vous rejoindront plus tard.
      </p>
      <UButton
        size="md"
        variant="soft"
        color="primary"
        type="button"
        class="mt-3"
        :disabled="disabled"
        @click="emit('update:audience', 'selected')"
      >
        Choisir des clientes
      </UButton>
    </div>

    <div
      v-else
      class="space-y-3"
    >
      <UButton
        size="md"
        variant="outline"
        color="neutral"
        type="button"
        :disabled="disabled"
        @click="emit('update:audience', 'all')"
      >
        Partager avec toutes mes clientes
      </UButton>
      <!--
        The checklist is rendered only once the audience is PERSISTED as
        `selected`: `POST /provider/content/:id/share` answers 422
        `CONTENT_NOT_PRIVATE` otherwise, so ticking a box on a content still
        stored as `all` would fail every time.
      -->
      <ContentClientChecklist
        v-if="canSelect"
        :content-id="contentId"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ContentAudience } from '../../features/contents/api/contents.contract'
// AGENTS §11.6: a component Nuxt cannot resolve renders nothing, silently.
import ContentClientChecklist from './ContentClientChecklist.vue'

defineProps<{
  contentId: string
  /** Audience as it is in the form (may not be saved yet). */
  audience: ContentAudience
  /** Audience as the server stores it — the only state a tick is allowed in. */
  canSelect: boolean
  disabled?: boolean
}>()

const emit = defineEmits<{
  'update:audience': [value: ContentAudience]
}>()
</script>
