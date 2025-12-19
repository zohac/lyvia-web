<script setup lang="ts">
useHead({
  meta: [{ name: 'viewport', content: 'width=device-width, initial-scale=1' }],
  link: [{ rel: 'icon', href: '/favicon.ico' }],
  htmlAttrs: { lang: 'fr' }
})

const auth = useAuth()
const isLoggingOut = ref(false)

async function onLogout() {
  if (isLoggingOut.value) return
  isLoggingOut.value = true
  try {
    await auth.logout()
  } finally {
    isLoggingOut.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-[color:var(--color-surface-page)]">
    <header class="border-b border-[color:var(--color-brand-subtle)] bg-[color:var(--color-surface-card)]">
      <div class="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <div class="flex items-center gap-4">
          <NuxtLink
            to="/admin/dashboard"
            aria-label="Administration"
            class="inline-flex items-center gap-3"
          >
            <AppLogo class="h-6 w-auto text-[color:var(--color-brand-primary)]" />
            <span class="text-sm font-semibold text-[color:var(--color-brand-secondary)]">
              Admin
            </span>
          </NuxtLink>

          <nav class="hidden items-center gap-2 sm:flex">
            <NuxtLink
              to="/admin/dashboard"
              class="rounded-[var(--radius-sm)] px-3 py-2 text-sm font-semibold text-[color:var(--color-brand-secondary)] hover:bg-[color:var(--color-surface-highlight)] hover:underline"
            >
              Dashboard
            </NuxtLink>
          </nav>
        </div>

        <button
          type="button"
          :disabled="isLoggingOut"
          class="inline-flex h-10 items-center justify-center rounded-[var(--radius-sm)] border border-[color:var(--color-brand-subtle)] bg-[color:var(--color-surface-card)] px-4 text-sm font-semibold text-[color:var(--color-brand-secondary)] transition-colors duration-150 ease-in-out hover:bg-[color:var(--color-surface-highlight)] disabled:cursor-not-allowed disabled:opacity-70"
          @click="onLogout"
        >
          Se déconnecter
        </button>
      </div>
    </header>

    <main class="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
      <slot />
    </main>
  </div>
</template>
