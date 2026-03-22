<script setup lang="ts">
import { usePublicHeaderState } from '../../features/public/state/public-header.state'

const headerState = usePublicHeaderState()

const showNavLinks = computed(() => headerState.value.navLinks.length > 0)
const isDockHeader = computed(() => headerState.value.layoutStyle === 'dock')
const useKeovaLogoImage = computed(
  () => headerState.value.showBrandIcon && headerState.value.variant !== 'white-label'
)
const useCustomLogoImage = computed(
  () => headerState.value.variant === 'white-label' && !!headerState.value.brandLogoSrc
)
const isMarketingVariant = computed(() => headerState.value.variant === 'marketing')
const isCoachVariant = computed(() => headerState.value.variant === 'coach')
const isWhiteLabelVariant = computed(() => headerState.value.variant === 'white-label')
const useIconOnlyLogin = computed(() => isCoachVariant.value || isWhiteLabelVariant.value)

// Mobile menu state
const isMobileMenuOpen = ref(false)

function closeMobileMenu() {
  isMobileMenuOpen.value = false
}
</script>

<template>
  <!-- Dock-style floating header -->
  <template v-if="isDockHeader">
    <nav
      class="fixed left-0 right-0 top-6 z-50 flex justify-center px-4"
      aria-label="Navigation principale"
    >
      <div
        :class="[
          'dock-bar flex w-full max-w-5xl items-center justify-between gap-6 rounded-full px-6 py-3 shadow-lg',
          isMarketingVariant
            ? 'border border-white/30 bg-white/70 backdrop-blur-xl'
            : 'border border-white/40 bg-white/80 backdrop-blur-xl'
        ]"
      >
        <!-- Brand -->
        <ULink
          :to="headerState.brandTo"
          class="inline-flex items-center gap-2 transition-all duration-300"
          aria-label="Accueil"
        >
          <template v-if="useKeovaLogoImage">
            <NuxtImg
              src="/images/keova-logo.png"
              alt=""
              class="h-7 w-auto sm:h-8"
              aria-hidden="true"
              loading="eager"
            />
            <span class="sr-only">
              Keova
            </span>
          </template>
          <template v-else-if="useCustomLogoImage">
            <NuxtImg
              :src="headerState.brandLogoSrc"
              :alt="headerState.brandLabel"
              class="h-16 w-auto"
              loading="eager"
            />
          </template>
          <span
            v-else
            class="font-serif text-xl tracking-tight text-[#3d3250]"
          >
            {{ headerState.brandLabel }}
          </span>
        </ULink>

        <!-- Nav links (desktop) -->
        <div
          v-if="showNavLinks"
          class="hidden items-center gap-1 md:flex"
        >
          <ULink
            v-for="link in headerState.navLinks"
            :key="link.href"
            :to="link.href"
            class="nav-link rounded-full px-4 py-2 text-sm font-medium text-[#4a4255] transition-all duration-200 hover:bg-[#5b4b6e]/8 hover:text-[#5b4b6e]"
          >
            {{ link.label }}
          </ULink>
        </div>

        <!-- Actions -->
        <div class="flex items-center gap-3">
          <!-- Login: icon-only on coach/white-label variant, full text otherwise -->
          <ULink
            :to="headerState.loginTo"
            :class="[
              'hidden transition-colors duration-200 hover:text-[#3d3250] md:inline-flex',
              useIconOnlyLogin
                ? 'grid size-9 place-items-center rounded-full text-[#5b4b6e] hover:bg-[#5b4b6e]/8'
                : 'text-sm font-medium text-[#5b4b6e]'
            ]"
            :aria-label="useIconOnlyLogin ? headerState.loginLabel : undefined"
          >
            <UIcon
              v-if="useIconOnlyLogin"
              name="i-lucide-user-circle"
              class="size-5"
            />
            <template v-else>
              {{ headerState.loginLabel }}
            </template>
          </ULink>

          <!-- CTA — branded gradient for marketing, solid for coach -->
          <ULink
            :to="headerState.ctaTo"
            :class="[
              'dock-cta group inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-white hover:text-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg',
              isMarketingVariant
                ? 'bg-gradient-to-r from-[#5b4b6e] to-[#7a6b8e]'
                : 'bg-gradient-to-r from-[#5b4b6e] to-[#4d3f5c]'
            ]"
          >
            {{ headerState.ctaLabel }}
            <UIcon
              v-if="isMarketingVariant"
              name="i-lucide-arrow-right"
              class="size-4 transition-transform duration-300 group-hover:translate-x-0.5"
            />
          </ULink>

          <!-- Mobile hamburger -->
          <button
            class="grid size-10 place-items-center rounded-full text-[#4a4255] transition-colors duration-200 hover:bg-[#5b4b6e]/8 md:hidden"
            :aria-expanded="isMobileMenuOpen"
            aria-label="Menu"
            @click="isMobileMenuOpen = !isMobileMenuOpen"
          >
            <UIcon
              :name="isMobileMenuOpen ? 'i-lucide-x' : 'i-lucide-menu'"
              class="size-5"
            />
          </button>
        </div>
      </div>

      <!-- Mobile dropdown -->
      <Transition name="mobile-menu">
        <div
          v-if="isMobileMenuOpen && showNavLinks"
          class="absolute left-4 right-4 top-full mt-2 overflow-hidden rounded-2xl border border-white/40 bg-white/90 shadow-xl backdrop-blur-xl md:hidden"
        >
          <div class="flex flex-col p-3">
            <ULink
              v-for="link in headerState.navLinks"
              :key="link.href"
              :to="link.href"
              class="rounded-xl px-4 py-3 text-sm font-medium text-[#4a4255] transition-colors duration-200 hover:bg-[#f5f3f7] hover:text-[#5b4b6e]"
              @click="closeMobileMenu"
            >
              {{ link.label }}
            </ULink>
            <div class="my-2 h-px bg-[#ebe7ef]" />
            <ULink
              :to="headerState.loginTo"
              class="rounded-xl px-4 py-3 text-sm font-medium text-[#5b4b6e] transition-colors duration-200 hover:bg-[#f5f3f7]"
              @click="closeMobileMenu"
            >
              {{ headerState.loginLabel }}
            </ULink>
            <!-- Mobile CTA full-width (coach/white-label variant) -->
            <ULink
              v-if="useIconOnlyLogin"
              :to="headerState.ctaTo"
              class="mt-2 inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#d4956a] to-[#e89560] px-6 py-3 text-sm font-semibold text-white shadow-md"
              @click="closeMobileMenu"
            >
              {{ headerState.ctaLabel }}
              <UIcon
                name="i-lucide-arrow-right"
                class="size-4"
              />
            </ULink>
          </div>
        </div>
      </Transition>
    </nav>
  </template>

  <!-- Classic sticky header -->
  <header
    v-else
    class="sticky top-0 z-40 border-b border-[#ebe7ef]"
  >
    <div class="bg-white/90 backdrop-blur-lg">
      <div class="mx-auto flex h-20 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
        <!-- Brand -->
        <ULink
          :to="headerState.brandTo"
          class="inline-flex items-center gap-3 transition-all duration-300"
          aria-label="Accueil"
        >
          <template v-if="useKeovaLogoImage">
            <NuxtImg
              src="/images/keova-logo.png"
              alt=""
              class="h-8 w-auto sm:h-9"
              aria-hidden="true"
              loading="eager"
            />
            <span class="sr-only">
              Keova
            </span>
          </template>
          <template v-else-if="useCustomLogoImage">
            <NuxtImg
              :src="headerState.brandLogoSrc"
              :alt="headerState.brandLabel"
              class="h-16 w-auto"
              loading="eager"
            />
          </template>
          <span
            v-else
            class="font-serif text-2xl tracking-tight text-[#3d3250]"
          >
            {{ headerState.brandLabel }}
          </span>
        </ULink>

        <!-- Nav links -->
        <nav
          v-if="showNavLinks"
          class="hidden items-center gap-8 md:flex"
          aria-label="Navigation"
        >
          <ULink
            v-for="link in headerState.navLinks"
            :key="link.href"
            :to="link.href"
            class="text-sm font-semibold text-[#857d8c] transition-colors duration-200 hover:text-[#5b4b6e]"
          >
            {{ link.label }}
          </ULink>
        </nav>

        <!-- Actions -->
        <div class="flex items-center gap-3">
          <ULink
            :to="headerState.loginTo"
            class="hidden rounded-full px-4 py-2 text-sm font-semibold text-[#5b4b6e] transition-colors duration-200 hover:text-[#3d3250] md:inline-flex"
          >
            {{ headerState.loginLabel }}
          </ULink>

          <UButton
            :to="headerState.ctaTo"
            size="lg"
            class="rounded-full bg-gradient-to-r from-[#d4956a] to-[#e89560] px-6 py-3 font-bold text-white shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl"
          >
            {{ headerState.ctaLabel }}
          </UButton>
        </div>
      </div>
    </div>
  </header>
</template>

<style scoped>
/* --- Dock bar polish --- */
.dock-bar {
  transition: background-color 0.3s, box-shadow 0.3s;
}

/* --- Nav link hover pill --- */
.nav-link {
  position: relative;
}

/* --- CTA glow on hover --- */
.dock-cta {
  position: relative;
}

.dock-cta::after {
  content: '';
  position: absolute;
  inset: -2px;
  border-radius: 9999px;
  background: linear-gradient(135deg, rgba(91, 75, 110, 0.4), rgba(212, 149, 106, 0.3));
  filter: blur(8px);
  opacity: 0;
  transition: opacity 0.3s;
  z-index: -1;
}

.dock-cta:hover::after {
  opacity: 1;
}

/* --- Mobile menu transitions --- */
.mobile-menu-enter-active {
  transition: opacity 0.2s ease, transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

.mobile-menu-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}

.mobile-menu-enter-from {
  opacity: 0;
  transform: translateY(-8px) scale(0.98);
}

.mobile-menu-leave-to {
  opacity: 0;
  transform: translateY(-4px) scale(0.99);
}
</style>
