<script setup lang="ts">
import { usePublicHeaderState } from '../../features/public/state/public-header.state'

const headerState = usePublicHeaderState()

const showNavLinks = computed(() => headerState.value.navLinks.length > 0)
const isDockHeader = computed(() => headerState.value.layoutStyle === 'dock')
const useKaoraLogoImage = computed(
  () => headerState.value.showBrandIcon && headerState.value.variant !== 'white-label'
)
</script>

<template>
  <template v-if="isDockHeader">
    <nav
      class="fixed top-6 left-0 right-0 z-50 flex justify-center px-4"
      aria-label="Navigation principale"
    >
      <div class="glass-panel flex w-full max-w-6xl items-center justify-between gap-6 rounded-full px-5 py-3 shadow-floating">
        <NuxtLink
          :to="headerState.brandTo"
          class="inline-flex items-center gap-2 transition-base"
          aria-label="Accueil"
        >
          <template v-if="useKaoraLogoImage">
            <img
              src="/images/kaora-logo.png"
              alt=""
              class="h-7 w-auto opacity-90 dark:hidden sm:h-8"
              aria-hidden="true"
              decoding="async"
            >
            <img
              src="/images/kaora-logo-light.png"
              alt=""
              class="hidden h-7 w-auto opacity-90 dark:block sm:h-8"
              aria-hidden="true"
              decoding="async"
            >
            <span class="sr-only">
              Kaora
            </span>
          </template>
          <span
            v-else
            class="font-serif text-xl italic tracking-tight"
          >
            {{ headerState.brandLabel }}
          </span>
        </NuxtLink>

        <div class="hidden items-center gap-6 md:flex">
          <a
            v-for="link in headerState.navLinks"
            :key="link.href"
            :href="link.href"
            class="text-sm font-semibold text-[color:var(--color-brand-muted)] hover:text-[color:var(--color-brand-primary)] transition-base"
          >
            {{ link.label }}
          </a>
        </div>

        <div class="flex items-center gap-3">
          <NuxtLink
            :to="headerState.loginTo"
            class="hidden rounded-full px-4 py-2 text-sm font-semibold text-[color:var(--color-brand-muted)] hover:text-[color:var(--color-brand-primary)] md:inline-flex transition-base"
          >
            {{ headerState.loginLabel }}
          </NuxtLink>

          <NuxtLink
            :to="headerState.ctaTo"
            class="inline-flex h-11 items-center justify-center rounded-full bg-[color:var(--color-accent-main)] px-6 text-[15px] font-bold text-[color:var(--color-accent-contrast)] shadow-floating transition-base hover:brightness-110 active:scale-[0.99]"
          >
            {{ headerState.ctaLabel }}
          </NuxtLink>
        </div>
      </div>
    </nav>
  </template>

  <header
    v-else
    class="sticky top-0 z-40 border-b border-[color:var(--color-brand-subtle)]"
  >
    <div class="glass-panel">
      <div class="mx-auto flex h-20 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
        <NuxtLink
          :to="headerState.brandTo"
          class="inline-flex items-center gap-3 transition-base"
          aria-label="Accueil"
        >
          <template v-if="useKaoraLogoImage">
            <img
              src="/images/kaora-logo.png"
              alt=""
              class="h-8 w-auto opacity-90 dark:hidden sm:h-9"
              aria-hidden="true"
              decoding="async"
            >
            <img
              src="/images/kaora-logo-light.png"
              alt=""
              class="hidden h-8 w-auto opacity-90 dark:block sm:h-9"
              aria-hidden="true"
              decoding="async"
            >
            <span class="sr-only">
              Kaora
            </span>
          </template>
          <span
            v-else
            class="font-serif text-2xl italic tracking-tight"
          >
            {{ headerState.brandLabel }}
          </span>
        </NuxtLink>

        <nav
          v-if="showNavLinks"
          class="hidden items-center gap-8 text-sm font-semibold text-[color:var(--color-brand-muted)] md:flex"
          aria-label="Navigation"
        >
          <a
            v-for="link in headerState.navLinks"
            :key="link.href"
            :href="link.href"
            class="hover:text-[color:var(--color-brand-primary)] transition-base"
          >
            {{ link.label }}
          </a>
        </nav>

        <div class="flex items-center gap-3">
          <NuxtLink
            :to="headerState.loginTo"
            class="hidden rounded-full px-4 py-2 text-sm font-semibold text-[color:var(--color-brand-muted)] hover:text-[color:var(--color-brand-primary)] md:inline-flex transition-base"
          >
            {{ headerState.loginLabel }}
          </NuxtLink>

          <NuxtLink
            :to="headerState.ctaTo"
            class="inline-flex h-12 items-center justify-center rounded-full bg-[color:var(--color-accent-main)] px-7 text-[15px] font-bold text-[color:var(--color-accent-contrast)] shadow-floating transition-base hover:brightness-110 active:scale-[0.99]"
          >
            {{ headerState.ctaLabel }}
          </NuxtLink>
        </div>
      </div>
    </div>
  </header>
</template>
