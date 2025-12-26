<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    id: string
    label: string
    modelValue: string
    name?: string
    placeholder?: string
    autocomplete?: string
    disabled?: boolean
    error?: string | null
    hint?: string
    describedByIds?: string[]
    required?: boolean
    elevated?: boolean
  }>(),
  {
    name: 'password',
    placeholder: undefined,
    autocomplete: 'current-password',
    disabled: false,
    error: null,
    hint: undefined,
    describedByIds: undefined,
    required: false,
    elevated: false
  }
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

const isRevealed = ref(false)

const inputClasses = computed(() => {
  const base
    = 'block h-12 w-full max-w-full rounded-[var(--radius-sm)] border bg-[color:var(--color-surface-card)] px-4 pr-12 text-base text-[color:var(--color-brand-primary)] placeholder:text-[color:var(--color-brand-secondary)] placeholder:opacity-60 transition-[border-color,box-shadow,transform] duration-150 ease-in-out focus:outline-none focus:ring-4 focus:ring-inset'

  const elevation = props.elevated ? ' shadow-soft' : ' shadow-none'

  if (props.error) {
    return `${base}${elevation} border-[color:var(--color-error)] focus:ring-[rgba(186,63,63,0.18)]`
  }

  return `${base}${elevation} border-[color:var(--color-brand-subtle)] focus:border-[color:var(--color-accent-main)] focus:ring-[rgba(200,121,100,0.2)]`
})

const toggleAriaLabel = computed(() =>
  isRevealed.value ? 'Masquer le mot de passe' : 'Afficher le mot de passe'
)
</script>

<template>
  <FormControl
    :id="id"
    :label="label"
    :error="error"
    :hint="hint"
    :described-by-ids="describedByIds"
    :required="required"
  >
    <template #label-aside>
      <slot name="label-aside" />
    </template>

    <template #default="slotProps">
      <div class="relative">
        <input
          v-bind="slotProps?.inputAttrs ?? { id }"
          :name="name"
          :type="isRevealed ? 'text' : 'password'"
          :autocomplete="autocomplete"
          :placeholder="placeholder"
          :disabled="disabled"
          :class="inputClasses"
          :value="modelValue"
          @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
        >

        <UButton
          type="button"
          variant="ghost"
          color="neutral"
          :icon="isRevealed ? 'i-lucide-eye-off' : 'i-lucide-eye'"
          :aria-label="toggleAriaLabel"
          :aria-pressed="isRevealed"
          class="absolute right-1 top-1/2 h-11 w-11 -translate-y-1/2 justify-center rounded-[var(--radius-sm)] text-[color:var(--color-brand-secondary)] hover:bg-[color:var(--color-surface-highlight)]"
          @click="isRevealed = !isRevealed"
        />
      </div>
    </template>
  </FormControl>
</template>
