<script setup lang="ts">
import { ref } from 'vue'

/**
 * V2.2d — Accessible block reorder bar.
 *
 * The grip is decorative (`aria-hidden`): the keyboard/touch path is the
 * always-visible Monter/Descendre buttons (≥ 44×44 px). Mouse drag is handled
 * by the parent, which makes this control bar `draggable`. `focusButton` is
 * exposed so the editor can restore focus on the moved block after a keyboard
 * move, falling back to the sibling button when the actioned one just became
 * disabled at an extremity.
 */
defineProps<{
  position: number
  canMoveUp: boolean
  canMoveDown: boolean
}>()

const emit = defineEmits<{
  (event: 'move-up' | 'move-down'): void
}>()

const rootRef = ref<HTMLElement | null>(null)

function focusButton(direction: 'up' | 'down') {
  const root = rootRef.value
  if (!root) return
  const other = direction === 'up' ? 'down' : 'up'
  const preferred = root.querySelector<HTMLButtonElement>(`[data-reorder-action="${direction}"]`)
  const fallback = root.querySelector<HTMLButtonElement>(`[data-reorder-action="${other}"]`)
  const target = preferred && !preferred.disabled ? preferred : fallback
  target?.focus()
}

defineExpose({ focusButton })
</script>

<template>
  <div
    ref="rootRef"
    class="flex items-center gap-1 rounded-lg border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface-card)] px-1"
  >
    <span
      class="inline-flex min-h-11 min-w-11 items-center justify-center text-[color:var(--color-text-muted)]"
      aria-hidden="true"
    >
      <UIcon
        name="i-lucide-grip-vertical"
        class="size-5"
      />
    </span>

    <UButton
      color="neutral"
      variant="ghost"
      icon="i-lucide-arrow-up"
      :disabled="!canMoveUp"
      :aria-label="`Monter le bloc ${position}`"
      data-reorder-action="up"
      class="min-h-11 min-w-11 justify-center"
      @click="emit('move-up')"
    />

    <UButton
      color="neutral"
      variant="ghost"
      icon="i-lucide-arrow-down"
      :disabled="!canMoveDown"
      :aria-label="`Descendre le bloc ${position}`"
      data-reorder-action="down"
      class="min-h-11 min-w-11 justify-center"
      @click="emit('move-down')"
    />
  </div>
</template>
