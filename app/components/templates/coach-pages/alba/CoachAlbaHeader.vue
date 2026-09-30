<script setup lang="ts">
/**
 * CoachAlbaHeader — Header interne du template Alba (YB.1.2).
 *
 * Révision de design du 2026-09-30 (décision PO) : le hero d'Alba est passé en
 * sombre immersif (voir `CoachAlbaHero.vue`). Le header se pose donc DESSUS en
 * transparent, texte clair, puis repasse en barre claire après défilement —
 * même contrat que `CoachVisuelHeader` (jusqu'alors le modèle de Visuel).
 *
 * Alba rend SON header et masque la `PublicHeader` globale via l'état
 * `hide-layout-header` ; l'aperçu de l'éditeur reproduit cette répartition par
 * `templateRendersOwnHeader` (registre). Ce header reste l'un des composants
 * NON PARTAGÉS du périmètre (AD-5) : sa surface est celle d'Alba.
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

// Bascule transparent → clair après le seuil de 10px.
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
    class="sticky top-0 z-40 -mb-16 w-full transition-colors duration-300 sm:-mb-18"
    :class="[
      hasScrolled
        ? 'border-b border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface-card)]/95 shadow-md backdrop-blur-md'
        : 'border-b border-transparent bg-transparent'
    ]"
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
          class="h-7 w-auto transition-[filter] duration-300 sm:h-8"
          :class="hasScrolled ? '' : 'brightness-0 invert drop-shadow-md'"
        >
        <span
          class="hidden h-5 w-px transition-colors duration-300 sm:block"
          :class="hasScrolled ? 'bg-[color:var(--color-border-emphasis)]' : 'bg-white/30'"
          aria-hidden="true"
        />
        <span
          class="hidden text-sm font-medium transition-colors duration-300 sm:inline"
          :class="hasScrolled ? 'text-[color:var(--color-text-primary)]' : 'text-[color:var(--color-crepuscule-50)] drop-shadow-sm'"
        >
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
          class="text-sm font-medium transition-colors duration-200"
          :class="hasScrolled
            ? 'text-[color:var(--color-text-primary)] hover:text-[color:var(--color-brand-primary)]'
            : 'text-[color:var(--color-crepuscule-50)]/85 hover:text-[color:var(--color-crepuscule-50)]'"
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
          :class="hasScrolled ? '' : 'text-[color:var(--color-crepuscule-50)]/90 hover:bg-white/10'"
        />

        <UButton
          :to="ctaTo"
          color="secondary"
          variant="solid"
          size="sm"
          class="hidden sm:inline-flex"
          :class="hasScrolled ? '' : 'shadow-lg shadow-black/20'"
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
          :class="hasScrolled ? '' : 'text-[color:var(--color-crepuscule-50)]/90 hover:bg-white/10'"
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
        <div class="flex h-full flex-col bg-[color:var(--color-surface-card)]">
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
