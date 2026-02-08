<script setup lang="ts">
import type { PublicTenantResponse } from '../../features/onboarding/api/onboarding.contract'

defineProps<{
  tenant: PublicTenantResponse
  ctaTo: string
  ctaLabel?: string
}>()
</script>

<template>
  <!-- Elegant light hero - warm and welcoming -->
  <section
    id="essence"
    class="relative flex min-h-[100svh] items-center overflow-hidden bg-[#f5f0eb]"
  >
    <!-- Gradient atmosphere - soft warm accents -->
    <div
      aria-hidden="true"
      class="pointer-events-none absolute inset-0"
    >
      <!-- Top-right warm glow -->
      <div
        class="absolute -right-[20%] -top-[10%] h-[80vh] w-[80vh] rounded-full"
        style="background: radial-gradient(circle, rgba(212, 149, 106, 0.12), transparent 60%); filter: blur(100px);"
      />
      <!-- Bottom-left violet mist -->
      <div
        class="absolute -bottom-[20%] -left-[15%] h-[70vh] w-[70vh] rounded-full"
        style="background: radial-gradient(circle, rgba(91, 75, 110, 0.08), transparent 60%); filter: blur(80px);"
      />
    </div>

    <!-- Main content - editorial layout -->
    <div class="relative z-10 w-full px-6 py-20 sm:px-12 lg:px-20">
      <div class="mx-auto max-w-7xl">
        <div class="grid gap-12 lg:grid-cols-12 lg:gap-8">
          <!-- Left column - Typography driven -->
          <div class="flex flex-col justify-center lg:col-span-7">
            <!-- Coach name as subtle label -->
            <p class="mb-6 text-sm font-medium uppercase tracking-[0.3em] text-[#d4956a]">
              {{ tenant.brand.displayName }}
            </p>

            <!-- Main headline - extra large, editorial -->
            <h1 class="font-serif text-[clamp(3rem,8vw,6rem)] leading-[0.95] tracking-tight text-[#2d2438]">
              <span class="block">Comprendre</span>
              <span class="block text-[#5b4b6e]">la ménopause,</span>
              <span class="block">
                retrouver
                <em class="relative font-normal not-italic">
                  l'équilibre
                  <span class="absolute -bottom-2 left-0 h-1 w-full bg-gradient-to-r from-[#d4956a] to-transparent" />
                </em>
              </span>
            </h1>

            <!-- Subtle tagline -->
            <p class="mt-10 max-w-lg text-lg leading-relaxed text-[#4a4255]">
              Un accompagnement global, humain et bienveillant pour traverser la ménopause avec plus de sérénité.
            </p>

            <!-- CTA - warm accent button -->
            <div class="mt-12 flex items-center gap-8">
              <UButton
                :to="ctaTo"
                size="xl"
                class="group rounded-full border-2 border-[#d4956a] bg-[#d4956a] px-8 py-4 font-semibold text-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#c47a4a] hover:shadow-lg"
              >
                <span class="flex items-center gap-3">
                  {{ ctaLabel ?? 'Réserver mon appel gratuit' }}
                  <span class="inline-block transition-transform duration-300 group-hover:translate-x-1">→</span>
                </span>
              </UButton>

              <span class="hidden text-sm text-[#857d8c] sm:block">
                15 min · Gratuit · Sans engagement
              </span>
            </div>
          </div>

          <!-- Right column - Visual accent -->
          <div class="relative hidden lg:col-span-5 lg:flex lg:items-center lg:justify-end">
            <div class="relative">
              <!-- Ghost shape - offset gradient shadow -->
              <div
                class="hero-photo-shape absolute h-[50vh] w-80 translate-x-4 translate-y-4 bg-gradient-to-br from-[#5b4b6e]/20 to-[#d4956a]/15"
                aria-hidden="true"
              />
              <!-- Photo in organic shape -->
              <div class="hero-photo-shape relative h-[50vh] w-80 overflow-hidden shadow-2xl shadow-[#5b4b6e]/15">
                <img
                  src="/images/sophie_jouan.jpeg"
                  alt="Sophie Jouan, coach spécialisée ménopause"
                  class="h-full w-full object-cover object-top"
                  decoding="async"
                  loading="eager"
                >
                <!-- Soft gradient overlay on edges -->
                <div
                  class="pointer-events-none absolute inset-0"
                  style="background: linear-gradient(160deg, rgba(91, 75, 110, 0.08) 0%, transparent 40%, rgba(212, 149, 106, 0.06) 100%);"
                />
              </div>
              <!-- Overlapping accents -->
              <div
                class="absolute -bottom-8 -left-12 h-32 w-32 rounded-full border border-[#5b4b6e]/20"
                style="animation: pulse-slow 4s ease-in-out infinite;"
              />
              <div
                class="absolute -right-4 top-1/4 h-20 w-20 rounded-full bg-[#d4956a]/15"
                style="animation: pulse-slow 4s ease-in-out 2s infinite;"
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Scroll indicator - minimal -->
    <div class="absolute bottom-8 left-1/2 z-10 -translate-x-1/2">
      <div
        class="h-12 w-px bg-gradient-to-b from-transparent via-[#5b4b6e]/40 to-transparent"
        style="animation: scroll-fade 2s ease-in-out infinite;"
      />
    </div>
  </section>
</template>

<style scoped>
.hero-photo-shape {
  border-radius: 40% 60% 70% 30% / 40% 50% 60% 50%;
}

@keyframes pulse-slow {
  0%, 100% {
    transform: scale(1);
    opacity: 0.6;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.3;
  }
}

@keyframes scroll-fade {
  0%, 100% {
    opacity: 0.3;
    transform: translateX(-50%) scaleY(1);
  }
  50% {
    opacity: 0.8;
    transform: translateX(-50%) scaleY(1.2);
  }
}
</style>
