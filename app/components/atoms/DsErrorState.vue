<script setup lang="ts">
interface DsErrorStateProps {
  message?: string
  retryLabel?: string
}

withDefaults(defineProps<DsErrorStateProps>(), {
  message: 'Une erreur est survenue',
  retryLabel: 'Reessayer'
})

defineEmits<{
  retry: []
}>()
</script>

<template>
  <div class="flex flex-col items-center justify-center px-6 py-16 text-center">
    <div class="mb-4 flex size-14 items-center justify-center rounded-full bg-[color:var(--color-error-50)]">
      <UIcon
        name="i-lucide-alert-circle"
        class="size-7 text-[color:var(--color-error)]"
      />
    </div>
    <p class="text-sm text-[color:var(--color-text-secondary)]">
      {{ message }}
    </p>
    <UButton
      color="neutral"
      variant="outline"
      size="sm"
      class="mt-6"
      @click="$emit('retry')"
    >
      {{ retryLabel }}
    </UButton>
  </div>
</template>
