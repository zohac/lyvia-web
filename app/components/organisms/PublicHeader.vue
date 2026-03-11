<script setup lang="ts">
import { usePublicHeaderState } from '../../features/public/state/public-header.state'

const headerState = usePublicHeaderState()

const showNavLinks = computed(() => headerState.value.navLinks.length > 0)
const isDockHeader = computed(() => headerState.value.layoutStyle === 'dock')
const useKaoraLogoImage = computed(
  () => headerState.value.showBrandIcon && headerState.value.variant !== 'white-label'
)
const useCustomLogoImage = computed(
  () => headerState.value.variant === 'white-label' && !!headerState.value.brandLogoSrc
)
</script>

<template>
  <!-- Dock-style floating header -->
  <template v-if="isDockHeader">
    <nav
      class="fixed left-0 right-0 top-6 z-50 flex justify-center px-4"
      aria-label="Navigation principale"
    >
      <div class="flex w-full max-w-5xl items-center justify-between gap-6 rounded-full border border-white/40 bg-white/80 px-6 py-3 shadow-lg backdrop-blur-xl">
        <!-- Brand -->
        <ULink
          :to="headerState.brandTo"
          class="inline-flex items-center gap-2 transition-all duration-300"
          aria-label="Accueil"
        >
          <template v-if="useKaoraLogoImage">
            <NuxtImg
              src="/images/kaora-logo.png"
              alt=""
              class="h-7 w-auto sm:h-8"
              aria-hidden="true"
              decoding="async"
              loading="eager"
            />
            <span class="sr-only">
              Kaora
            </span>
          </template>
          <template v-else-if="useCustomLogoImage">
            <NuxtImg
              :src="headerState.brandLogoSrc"
              :alt="headerState.brandLabel"
              class="h-16 w-auto"
              decoding="async"
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

        <!-- Nav links -->
        <div
          v-if="showNavLinks"
          class="hidden items-center gap-6 md:flex"
        >
          <ULink
            v-for="link in headerState.navLinks"
            :key="link.href"
            :to="link.href"
            class="text-sm font-medium text-[#857d8c] transition-colors duration-200 hover:text-[#5b4b6e]"
          >
            {{ link.label }}
          </ULink>
        </div>

        <!-- Actions -->
        <div class="flex items-center gap-3">
          <ULink
            :to="headerState.loginTo"
            class="hidden text-sm font-medium text-[#5b4b6e] transition-colors duration-200 hover:text-[#3d3250] md:inline-flex"
          >
            {{ headerState.loginLabel }}
          </ULink>

          <UButton
            :to="headerState.ctaTo"
            size="md"
            class="rounded-full bg-gradient-to-r from-[#5b4b6e] to-[#4d3f5c] px-5 py-2 text-sm font-semibold text-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
          >
            {{ headerState.ctaLabel }}
          </UButton>
        </div>
      </div>
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
          <template v-if="useKaoraLogoImage">
            <NuxtImg
              src="/images/kaora-logo.png"
              alt=""
              class="h-8 w-auto sm:h-9"
              aria-hidden="true"
              decoding="async"
              loading="eager"
            />
            <span class="sr-only">
              Kaora
            </span>
          </template>
          <template v-else-if="useCustomLogoImage">
            <NuxtImg
              :src="headerState.brandLogoSrc"
              :alt="headerState.brandLabel"
              class="h-16 w-auto"
              decoding="async"
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
