<script setup lang="ts">
withDefaults(
  defineProps<{
    title: string
    subtitle?: string
  }>(),
  {
    subtitle: undefined
  }
)
</script>

<template>
  <div class="min-h-[100svh] bg-[color:var(--color-surface-page)] px-4 py-12 sm:px-6">
    <div class="mx-auto flex w-full max-w-[400px] flex-col gap-8">
      <header class="flex flex-col items-center gap-4 text-center">
        <slot name="logo">
          <NuxtLink
            to="/"
            class="inline-flex items-center justify-center"
            aria-label="Retour à l’accueil"
          >
            <AppLogo class="h-12 w-auto" />
          </NuxtLink>
        </slot>

        <div class="grid gap-2">
          <h1 class="font-serif text-[1.75rem] font-bold leading-[var(--leading-tight)] tracking-[-0.01em] sm:text-[2.25rem]">
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
