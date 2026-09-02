<script setup lang="ts">
/**
 * CoachVisuelHeader — Header sticky pour le template Visuel.
 *
 * Positionnement : sticky top-0, z-40, edge to edge.
 * Style :
 *   - Au repos (en haut du hero) : fond translucide sombre avec backdrop-blur
 *   - Au scroll (> 10px) : fond plus opaque avec ombre portée
 *   - Logo Keova avec filtre brightness pour ressortir parfaitement sur fond sombre
 *   - Typo blanche avec légers ombrages et bouton CTA de réservation sticky
 *   - Mobile : burger ouvrant un USlideover Nuxt UI v4.
 */
export interface CoachVisuelHeaderNavLink {
  label: string
  href: string
}

const props = defineProps<{
  coachName: string
  navLinks: CoachVisuelHeaderNavLink[]
  ctaLabel: string
  ctaTo: string
  loginTo?: string
  isAuthenticated?: boolean
}>()

const isMobileOpen = ref(false)

function closeMobile() {
  isMobileOpen.value = false
}

// Scroll elevation
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
    class="sticky top-0 z-40 w-full -mb-18 sm:-mb-20 transition-all duration-300"
    :class="[
      hasScrolled
        ? 'border-b border-white/10 bg-neutral-950/85 shadow-lg backdrop-blur-md'
        : 'border-b border-transparent bg-gradient-to-b from-black/60 via-black/25 to-transparent'
    ]"
    aria-label="Navigation principale"
  >
    <div class="mx-auto flex h-18 max-w-7xl items-center justify-between gap-4 px-6 sm:h-20 sm:px-12 lg:px-16">
      <!-- Brand zone — logo Keova (filtré pour fond sombre) + séparateur + nom de la coach -->
      <NuxtLink
        to="/"
        class="flex items-center gap-3.5 whitespace-nowrap transition-opacity hover:opacity-90"
        aria-label="Accueil"
      >
        <img
          src="/images/keova-logo.webp"
          alt="Keova"
          class="h-8 w-auto brightness-0 invert drop-shadow-md sm:h-9"
        >
        <span
          class="h-5 w-px bg-white/30"
          aria-hidden="true"
        />
        <span class="font-serif text-lg font-medium italic text-white drop-shadow-sm sm:text-xl">
          {{ coachName }}
        </span>
      </NuxtLink>

      <!-- Navigation ancres (Desktop) -->
      <nav
        v-if="navLinks.length"
        class="hidden items-center gap-1 sm:flex"
        aria-label="Sections de la page"
      >
        <a
          v-for="link in navLinks"
          :key="link.href"
          :href="link.href"
          class="rounded-full px-4 py-2 text-sm font-medium text-white/85 backdrop-blur-xs transition-colors duration-200 hover:bg-white/10 hover:text-white"
        >
          {{ link.label }}
        </a>
      </nav>

      <!-- Actions CTA -->
      <div class="flex items-center gap-3">
        <UButton
          v-if="showLogin"
          :to="loginTo"
          color="neutral"
          variant="ghost"
          icon="i-lucide-user"
          size="sm"
          aria-label="Se connecter"
          class="hidden text-white hover:bg-white/10 sm:inline-flex"
        />

        <UButton
          :to="ctaTo"
          color="secondary"
          variant="solid"
          size="sm"
          class="shadow-lg shadow-black/20"
        >
          {{ ctaLabel }}
        </UButton>

        <!-- Burger mobile -->
        <UButton
          color="neutral"
          variant="ghost"
          icon="i-lucide-menu"
          size="md"
          :aria-expanded="isMobileOpen"
          aria-label="Ouvrir le menu"
          class="text-white hover:bg-white/10 sm:hidden"
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

          <!-- Coach name -->
          <div class="border-b border-[color:var(--color-border-subtle)] px-6 py-3 text-sm font-medium text-[color:var(--color-brand-secondary)]">
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
