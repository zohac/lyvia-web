<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    id: string
    label: string
    error?: string | null
    hint?: string
    describedByIds?: string[]
    required?: boolean
  }>(),
  {
    error: null,
    hint: undefined,
    describedByIds: undefined,
    required: false
  }
)

const hintId = computed(() => `${props.id}-hint`)
const errorId = computed(() => `${props.id}-error`)

const describedBy = computed(() => {
  const ids: string[] = []
  if (props.hint) ids.push(hintId.value)
  if (props.error) ids.push(errorId.value)

  if (props.describedByIds?.length) {
    for (const id of props.describedByIds) {
      if (typeof id !== 'string') continue
      if (!id.trim()) continue
      if (ids.includes(id)) continue
      ids.push(id)
    }
  }

  return ids.length ? ids.join(' ') : undefined
})

const inputAttrs = computed(() => ({
  'id': props.id,
  'aria-invalid': props.error ? true : undefined,
  'aria-describedby': describedBy.value,
  'required': props.required || undefined,
  'aria-required': props.required ? true : undefined
}))
</script>

<template>
  <div class="grid min-w-0 gap-2">
    <div class="flex flex-wrap items-center justify-between gap-2">
      <label
        :for="id"
        class="text-sm font-semibold leading-none"
        :class="error ? 'text-[color:var(--color-error)]' : 'text-[color:var(--color-brand-primary)]'"
      >
        {{ label }}
        <span
          v-if="required"
          aria-hidden="true"
          class="text-[color:var(--color-error)]"
        >*</span>
      </label>

      <slot
        name="label-aside"
        v-bind="{ invalid: Boolean(error) }"
      />
    </div>

    <slot v-bind="{ inputAttrs, invalid: Boolean(error) }" />

    <p
      v-if="hint"
      :id="hintId"
      class="text-sm text-[color:var(--color-brand-secondary)]"
    >
      {{ hint }}
    </p>

    <p
      v-if="error"
      :id="errorId"
      class="text-sm text-[color:var(--color-error)]"
      role="alert"
      aria-live="assertive"
    >
      {{ error }}
    </p>
  </div>
</template>
