<template>
  <div class="space-y-3">
    <div
      v-if="audience === 'all'"
      class="rounded-lg border border-[color:var(--color-brand-subtle)] p-4"
    >
      <p class="font-medium text-[color:var(--color-text-primary)]">
        Partagé avec toutes vos clientes
      </p>
      <p class="text-sm text-[color:var(--color-text-muted)]">
        Couvre aussi les clientes qui vous rejoindront plus tard.
      </p>
      <UButton
        size="sm"
        variant="soft"
        color="primary"
        type="button"
        class="mt-2"
        :disabled="disabled"
        @click="emit('update:audience', 'selected')"
      >
        Choisir des clientes
      </UButton>
    </div>

    <div v-else class="space-y-3">
      <ContentClientChecklist
        :content-id="contentId"
        @shared="onShared"
        @unshared="onUnshared"
      />
      <UButton
        size="sm"
        variant="ghost"
        color="neutral"
        type="button"
        :disabled="disabled"
        @click="emit('update:audience', 'all')"
      >
        Partager avec toutes mes clientes
      </UButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ContentAudience } from '../../features/contents/api/contents.contract'
import ContentClientChecklist from './ContentClientChecklist.vue'

defineProps<{
  contentId: string
  audience: ContentAudience
  disabled?: boolean
}>()

const emit = defineEmits<{
  'update:audience': [value: ContentAudience]
}>()

function onShared() {}
function onUnshared() {}
</script>
