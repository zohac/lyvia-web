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
 *   - Brand texte (pas de logo image Keova script)
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
    class="sticky top-0 z-40 w-full bg-white/90 backdrop-blur-md transition-shadow duration-300"
    :class="[hasScrolled ? 'border-b border-[var(--color-crepuscule-100)] shadow-sm' : 'border-b border-transparent']"
    aria-label="Navigation principale"
  >
    <div class="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-6 sm:h-18 lg:px-8">
      <!-- Brand zone — text only, no image logo -->
      <NuxtLink
        to="/"
        class="flex items-center gap-3 whitespace-nowrap"
        aria-label="Accueil Keova"
      >
        <span class="font-serif text-lg italic text-[var(--color-brand-primary)] sm:text-xl">
          {{ brandLabel }}
        </span>
        <span
          class="hidden h-5 w-px bg-[var(--color-crepuscule-200)] sm:block"
          aria-hidden="true"
        />
        <span class="hidden text-sm font-medium text-[var(--color-crepuscule-700)] sm:inline">
          {{ coachName }}
        </span>
      </NuxtLink>

      <!-- Nav links — desktop only -->
      <nav
        v-if="navLinks.length"
        class="hidden items-center gap-8 lg:flex"
        aria-label="Sections de la page"
      >
        <a
          v-for="link in navLinks"
          :key="link.href"
          :href="link.href"
          class="essentiel-nav-link relative text-sm font-medium text-[var(--color-crepuscule-700)] transition-colors duration-200 hover:text-[var(--color-brand-primary)]"
        >
          {{ link.label }}
        </a>
      </nav>

      <!-- Actions right -->
      <div class="flex items-center gap-2 sm:gap-3">
        <!-- Login icon (desktop only) -->
        <NuxtLink
          v-if="showLogin"
          :to="loginTo"
          class="hidden size-9 place-items-center rounded-lg text-[var(--color-crepuscule-700)] transition-colors hover:bg-[var(--color-neutral-50)] hover:text-[var(--color-brand-primary)] sm:grid"
          aria-label="Se connecter"
        >
          <UIcon
            name="i-lucide-user"
            class="size-5"
          />
        </NuxtLink>

        <!-- CTA Réserver — rounded-lg (distinct from dock's rounded-full pill) -->
        <UButton
          :to="ctaTo"
          class="hidden rounded-lg bg-[var(--color-brand-accent)] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-[var(--color-sunset-600)] hover:shadow-md sm:inline-flex"
        >
          {{ ctaLabel }}
        </UButton>

        <!-- Mobile burger -->
        <button
          type="button"
          class="grid size-10 place-items-center rounded-lg text-[var(--color-crepuscule-700)] transition-colors hover:bg-[var(--color-neutral-50)] lg:hidden"
          :aria-expanded="isMobileOpen"
          aria-label="Ouvrir le menu"
          @click="isMobileOpen = true"
        >
          <UIcon
            name="i-lucide-menu"
            class="size-6"
          />
        </button>
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
          <div class="flex items-center justify-between border-b border-[var(--color-crepuscule-100)] px-6 py-4">
            <span class="font-serif text-lg italic text-[var(--color-brand-primary)]">
              {{ brandLabel }}
            </span>
            <button
              type="button"
              class="grid size-9 place-items-center rounded-lg text-[var(--color-crepuscule-700)] hover:bg-[var(--color-neutral-50)]"
              aria-label="Fermer le menu"
              @click="closeMobile"
            >
              <UIcon
                name="i-lucide-x"
                class="size-5"
              />
            </button>
          </div>

          <!-- Coach name -->
          <div class="border-b border-[var(--color-crepuscule-100)] px-6 py-4 text-sm text-[var(--color-crepuscule-700)]">
            {{ coachName }}
          </div>

          <!-- Nav links vertical -->
          <nav
            class="flex flex-1 flex-col gap-1 px-4 py-6"
            aria-label="Sections de la page"
          >
            <a
              v-for="link in navLinks"
              :key="link.href"
              :href="link.href"
              class="rounded-lg px-4 py-3 text-base font-medium text-[var(--color-crepuscule-900)] transition-colors hover:bg-[var(--color-neutral-50)] hover:text-[var(--color-brand-primary)]"
              @click="closeMobile"
            >
              {{ link.label }}
            </a>
          </nav>

          <!-- Footer CTA -->
          <div class="space-y-3 border-t border-[var(--color-crepuscule-100)] px-6 py-5">
            <UButton
              :to="ctaTo"
              block
              class="rounded-lg bg-[var(--color-brand-accent)] px-5 py-3 text-sm font-semibold text-white hover:bg-[var(--color-sunset-600)]"
              @click="closeMobile"
            >
              {{ ctaLabel }}
            </UButton>
            <NuxtLink
              v-if="showLogin"
              :to="loginTo"
              class="block text-center text-sm text-[var(--color-crepuscule-700)] underline-offset-4 hover:underline"
              @click="closeMobile"
            >
              Se connecter
            </NuxtLink>
          </div>
        </div>
      </template>
    </USlideover>
  </header>
</template>

<style scoped>
/* Underline animation on desktop nav links */
.essentiel-nav-link::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: -6px;
  height: 2px;
  background-color: var(--color-brand-accent);
  transform: scaleX(0);
  transform-origin: left;
  transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.essentiel-nav-link:hover::after {
  transform: scaleX(1);
}

@media (prefers-reduced-motion: reduce) {
  .essentiel-nav-link::after {
    transition: none;
  }
}
</style>
