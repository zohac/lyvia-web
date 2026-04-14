<script setup lang="ts">
import AuthCard from '../organisms/AuthCard.vue'

withDefaults(
  defineProps<{
    title: string
    subtitle?: string
    autofocusTitle?: boolean
  }>(),
  {
    subtitle: undefined,
    autofocusTitle: false
  }
)

const titleRef = ref<HTMLHeadingElement | null>(null)

onMounted(() => {
  if (import.meta.server) return
  if (!titleRef.value) return
  if (!titleRef.value.hasAttribute('tabindex')) return

  requestAnimationFrame(() => {
    titleRef.value?.focus()
  })
})
</script>

<template>
  <div class="min-h-[100svh] bg-[color:var(--color-surface-page)] px-4 py-12 sm:px-6">
    <div class="mx-auto flex w-full max-w-[400px] flex-col gap-8">
      <header class="flex flex-col items-center gap-4 text-center">
        <slot name="logo">
          <ULink
            to="/"
            class="inline-flex items-center justify-center"
            aria-label="Retour à l’accueil"
          >
            <AppLogo class="h-12 w-auto" />
          </ULink>
        </slot>

        <div class="grid gap-2">
          <h1
            ref="titleRef"
            :tabindex="autofocusTitle ? -1 : undefined"
            class="font-serif text-[1.75rem] font-bold leading-[var(--leading-tight)] tracking-[-0.01em] sm:text-[2.25rem] focus:outline-none focus:ring-4 focus:ring-[rgba(200,121,100,0.2)]"
          >
            {{ title }}
          </h1>
          <p
            v-if="subtitle"
            class="text-[0.95rem] leading-[var(--leading-relaxed)] text-[color:var(--color-brand-secondary)]"
          >
            {{ subtitle }}
          </p>
        </div>
      </header>

      <AuthCard class="grid gap-6">
        <slot name="alert" />

        <div class="grid gap-6">
          <slot />
        </div>

        <footer
          v-if="$slots.footer"
          class="text-center text-sm text-[color:var(--color-brand-secondary)]"
        >
          <slot name="footer" />
        </footer>
      </AuthCard>
    </div>
  </div>
</template>
