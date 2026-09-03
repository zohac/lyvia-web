<script setup lang="ts">
/**
 * CoachEssentielHeader — Header sticky pleine largeur pour template Essentiel.
 *
 * Positionnement : sticky top-0, edge to edge, distinct de la `PublicHeader`
 * dock-style (pilule flottante max-w-5xl rounded-full) utilisée par
 * Signature et les pages marketing.
 *
 * Philosophie visuelle :
 *   - Bar pleine largeur `w-full` + backdrop-blur + border-b discret
 *   - Brand logo image Keova + séparateur + nom coach
 *   - Nav links inline avec underline animation
 *   - CTA bouton `rounded-lg` carré (vs rounded-full pilule)
 *   - Mobile : burger → USlideover Nuxt UI v4 avec nav verticale
 *
 * Utilisé uniquement depuis `CoachPageEssentiel.vue` qui désactive la
 * `PublicHeader` globale via le state `hide-layout-header`.
 */
export interface CoachEssentielHeaderNavLink {
  label: string
  href: string
}

const props = defineProps<{
  brandLabel: string
  coachName: string
  navLinks: CoachEssentielHeaderNavLink[]
  ctaLabel: string
  ctaTo: string
  loginTo?: string
  isAuthenticated?: boolean
}>()

// Mobile slideover
const isMobileOpen = ref(false)

function closeMobile() {
  isMobileOpen.value = false
}

// Scroll elevation: add shadow after scroll > 10px
const hasScrolled = ref(false)

function handleScroll() {
  hasScrolled.value = (globalThis.window?.scrollY ?? 0) > 10
}

onMounted(() => {
  handleScroll()
  window.addEventListener('scroll', handleScroll, { passive: true })
})

onBeforeUnmount(() => {
  if (import.meta.client) {
    window.removeEventListener('scroll', handleScroll)
  }
})

const showLogin = computed(() => !props.isAuthenticated && !!props.loginTo)
</script>

<template>
  <header
    class="sticky top-0 z-40 w-full border-b border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface-card)]/95 backdrop-blur-md transition-shadow duration-300"
    :class="[hasScrolled ? 'shadow-md' : 'shadow-sm']"
    aria-label="Navigation principale"
  >
    <div class="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-6 sm:h-18 lg:px-8">
      <!-- Brand zone — logo image + coach name -->
      <NuxtLink
        to="/"
        class="flex items-center gap-3 whitespace-nowrap"
        aria-label="Accueil Keova"
      >
        <img
          src="/images/keova-logo.webp"
          alt="Keova"
          class="h-7 w-auto sm:h-8"
        >
        <span
          class="hidden h-5 w-px bg-[color:var(--color-border-emphasis)] sm:block"
          aria-hidden="true"
        />
        <span class="hidden text-sm font-medium text-[color:var(--color-text-primary)] sm:inline">
          {{ coachName }}
        </span>
      </NuxtLink>

      <!-- Nav links — desktop only (in-page anchors stay as <a>) -->
      <nav
        v-if="navLinks.length"
        class="hidden items-center gap-8 lg:flex"
        aria-label="Sections de la page"
      >
        <a
          v-for="link in navLinks"
          :key="link.href"
          :href="link.href"
          class="text-sm font-medium text-[color:var(--color-text-primary)] transition-colors duration-200 hover:text-[color:var(--color-brand-primary)]"
        >
          {{ link.label }}
        </a>
      </nav>

      <!-- Actions right — all interactive controls via UButton (DS keovaButton) -->
      <div class="flex items-center gap-2 sm:gap-3">
        <!-- Login icon (desktop only) — Neutral Ghost variant DS -->
        <UButton
          v-if="showLogin"
          :to="loginTo"
          color="neutral"
          variant="ghost"
          icon="i-lucide-user"
          size="sm"
          aria-label="Se connecter"
          class="hidden sm:inline-flex"
        />

        <!-- CTA Réserver — Secondary Solid (DS Sunset accent) -->
        <UButton
          :to="ctaTo"
          color="secondary"
          variant="solid"
          size="sm"
          class="hidden sm:inline-flex"
        >
          {{ ctaLabel }}
        </UButton>

        <!-- Mobile burger — Neutral Ghost variant DS -->
        <UButton
          color="neutral"
          variant="ghost"
          icon="i-lucide-menu"
          size="md"
          :aria-expanded="isMobileOpen"
          aria-label="Ouvrir le menu"
          class="lg:hidden"
          @click="isMobileOpen = true"
        />
      </div>
    </div>

    <!-- Mobile slideover -->
    <USlideover
      v-model:open="isMobileOpen"
      side="right"
      title="Menu"
    >
      <template #content>
        <div class="flex h-full flex-col">
          <!-- Header with close -->
          <div class="flex items-center justify-between border-b border-[color:var(--color-border-subtle)] px-6 py-4">
            <img
              src="/images/keova-logo.webp"
              alt="Keova"
              class="h-7 w-auto"
            >
            <UButton
              color="neutral"
              variant="ghost"
              icon="i-lucide-x"
              size="sm"
              aria-label="Fermer le menu"
              @click="closeMobile"
            />
          </div>

          <!-- Coach name -->
          <div class="border-b border-[color:var(--color-border-subtle)] px-6 py-4 text-sm text-[color:var(--color-text-primary)]">
            {{ coachName }}
          </div>

          <!-- Nav links vertical (in-page anchors stay as <a>) -->
          <nav
            class="flex flex-1 flex-col gap-1 px-4 py-6"
            aria-label="Sections de la page"
          >
            <a
              v-for="link in navLinks"
              :key="link.href"
              :href="link.href"
              class="rounded-2xl px-4 py-3 text-base font-medium text-[color:var(--color-text-primary)] transition-colors hover:bg-[color:var(--color-surface-highlight)] hover:text-[color:var(--color-brand-primary)]"
              @click="closeMobile"
            >
              {{ link.label }}
            </a>
          </nav>

          <!-- Footer CTA — DS Secondary Solid + Neutral Ghost -->
          <div class="space-y-3 border-t border-[color:var(--color-border-subtle)] px-6 py-5">
            <UButton
              :to="ctaTo"
              color="secondary"
              variant="solid"
              size="md"
              block
              @click="closeMobile"
            >
              {{ ctaLabel }}
            </UButton>
            <UButton
              v-if="showLogin"
              :to="loginTo"
              color="neutral"
              variant="ghost"
              size="sm"
              block
              @click="closeMobile"
            >
              Se connecter
            </UButton>
          </div>
        </div>
      </template>
    </USlideover>
  </header>
</template>
