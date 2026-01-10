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
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
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
    elevated: false,
    size: 'xl'
  }
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

const isRevealed = ref(false)

const toggleAriaLabel = computed(() =>
  isRevealed.value ? 'Masquer le mot de passe' : 'Afficher le mot de passe'
)

const inputType = computed(() => isRevealed.value ? 'text' : 'password')
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
      <UInput
        v-bind="slotProps?.inputAttrs ?? { id }"
        :model-value="modelValue"
        :name="name"
        :type="inputType"
        :autocomplete="autocomplete"
        :placeholder="placeholder"
        :disabled="disabled"
        :size="size"
        :ui="{
          trailing: 'pe-1'
        }"
        @update:model-value="emit('update:modelValue', $event as string)"
      >
        <template #trailing>
          <UButton
            type="button"
            variant="ghost"
            color="neutral"
            size="sm"
            :icon="isRevealed ? 'i-lucide-eye-off' : 'i-lucide-eye'"
            :aria-label="toggleAriaLabel"
            :aria-pressed="isRevealed"
            :ui="{
              base: 'rounded-full'
            }"
            @click="isRevealed = !isRevealed"
          />
        </template>
      </UInput>
    </template>
  </FormControl>
</template>
