<script setup lang="ts">
/**
 * CoachAlbaHeader — Header interne du template Alba (YB.1.2).
 *
 * Décision produit du 2026-09-29 : Alba est « auto-portrait » sur une page
 * calme, donc un header sobre sur fond clair — le modèle d'Essentiel, pas la
 * barre transparente sur fond sombre de Visuel. Alba rend SON header et masque
 * la `PublicHeader` globale via l'état `hide-layout-header` ; l'aperçu de
 * l'éditeur reproduit cette répartition par
 * `templateRendersOwnHeader` (registre), sans quoi l'écran afficherait deux
 * headers.
 *
 * Structure identique à `CoachEssentielHeader` / `CoachVisuelHeader` : ce
 * header est volontairement l'un des composants NON PARTAGÉS du périmètre
 * (AD-5), sa surface est celle d'Alba.
 */
export interface CoachAlbaHeaderNavLink {
  label: string
  href: string
}

const props = defineProps<{
  coachName: string
  navLinks: CoachAlbaHeaderNavLink[]
  ctaLabel: string
  ctaTo: string
  loginTo?: string
  isAuthenticated?: boolean
}>()

const isMobileOpen = ref(false)

function closeMobile() {
  isMobileOpen.value = false
}

// Scroll elevation: ombre après le seuil de 10px.
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

      <div class="flex items-center gap-2 sm:gap-3">
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

        <UButton
          :to="ctaTo"
          color="secondary"
          variant="solid"
          size="sm"
          class="hidden sm:inline-flex"
        >
          {{ ctaLabel }}
        </UButton>

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

    <USlideover
      v-model:open="isMobileOpen"
      side="right"
      title="Menu"
    >
      <template #content>
        <div class="flex h-full flex-col">
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

          <div class="border-b border-[color:var(--color-border-subtle)] px-6 py-4 text-sm text-[color:var(--color-text-primary)]">
            {{ coachName }}
          </div>

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
