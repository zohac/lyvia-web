<script setup lang="ts">
import { isTemplateLocked } from '~/features/plans/domain/template-lock'

const props = defineProps<{
  templates: Array<{ id: string, name: string, description?: string | null, previewImageUrl?: string | null, sectionsAvailable?: readonly string[] | null, locked?: boolean, code?: string | null }>
  selectedTemplateId: string | null
  saving?: boolean
  hasPremiumTemplates?: boolean
}>()

const emit = defineEmits<{ select: [id: string] }>()

function isLocked(tmpl: { locked?: boolean, code?: string | null }): boolean {
  if (typeof tmpl.locked === 'boolean') return tmpl.locked
  return isTemplateLocked({ code: tmpl.code ?? '' }, props.hasPremiumTemplates ?? true)
}

function onClick(tmpl: { id: string, locked?: boolean, code?: string | null }) {
  if (props.saving || isLocked(tmpl)) return
  emit('select', tmpl.id)
}
</script>

<template>
  <section
    id="section-template"
    class="mb-10"
  >
    <h2 class="mb-4 text-lg font-semibold text-[color:var(--color-text-primary)]">
      Template
    </h2>
    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <button
        v-for="tmpl in templates"
        :key="tmpl.id"
        type="button"
        class="relative rounded-xl border-2 p-5 text-left transition-all"
        :class="[
          tmpl.id === selectedTemplateId
            ? 'border-[color:var(--color-brand-primary)] bg-[color:var(--color-surface-card)] shadow-md'
            : 'border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface-page)]',
          tmpl.id !== selectedTemplateId && !isLocked(tmpl)
            ? 'hover:border-[color:var(--color-brand-accent)]'
            : '',
          isLocked(tmpl) ? 'cursor-not-allowed opacity-60' : ''
        ]"
        :disabled="saving || isLocked(tmpl)"
        :aria-pressed="tmpl.id === selectedTemplateId"
        :data-testid="isLocked(tmpl) ? 'coach-template-card-locked' : 'coach-template-card'"
        @click="onClick(tmpl)"
      >
        <span
          v-if="isLocked(tmpl)"
          class="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-[color:var(--color-surface-highlight)] px-2.5 py-1 text-xs font-medium text-[color:var(--color-text-muted)]"
          data-testid="coach-template-premium-badge"
        >
          <UIcon
            name="i-lucide-lock"
            class="size-3"
          />
          Premium
        </span>
        <div
          v-if="tmpl.id === selectedTemplateId"
          class="absolute right-3 top-3"
        >
          <UIcon
            name="i-lucide-check-circle"
            class="size-5 text-[color:var(--color-brand-primary)]"
          />
        </div>
        <NuxtImg
          v-if="tmpl.previewImageUrl"
          :src="tmpl.previewImageUrl"
          :alt="`Aperçu du template ${tmpl.name}`"
          class="mb-3 aspect-[16/9] w-full rounded-lg object-cover"
          width="320"
          height="180"
          loading="lazy"
        />
        <h3 class="font-semibold text-[color:var(--color-text-primary)]">
          {{ tmpl.name }}
        </h3>
        <p
          v-if="tmpl.description"
          class="mt-1 text-sm text-[color:var(--color-brand-secondary)]"
        >
          {{ tmpl.description }}
        </p>
        <p class="mt-2 text-xs text-[color:var(--color-text-muted)]">
          {{ (tmpl.sectionsAvailable ?? []).length }} sections disponibles
        </p>
      </button>
    </div>
  </section>
</template>
