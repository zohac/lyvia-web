<script setup lang="ts">
import type { PublicTenantResponse } from '../../features/onboarding/api/onboarding.contract'

defineProps<{
  tenant: PublicTenantResponse
  ctaTo: string
  ctaLabel?: string
}>()
</script>

<template>
  <!-- Cinematic full-screen hero - dark immersive experience -->
  <section
    id="essence"
    class="relative flex min-h-[100svh] items-end overflow-hidden bg-[#1a161e]"
  >
    <!-- Gradient atmosphere - sunset hues bleeding from edges -->
    <div
      aria-hidden="true"
      class="pointer-events-none absolute inset-0"
    >
      <!-- Top-right warm glow -->
      <div
        class="absolute -right-[20%] -top-[10%] h-[80vh] w-[80vh] rounded-full"
        style="background: radial-gradient(circle, rgba(212, 149, 106, 0.15), transparent 60%); filter: blur(100px);"
      />
      <!-- Bottom-left violet mist -->
      <div
        class="absolute -bottom-[20%] -left-[15%] h-[70vh] w-[70vh] rounded-full"
        style="background: radial-gradient(circle, rgba(122, 107, 142, 0.2), transparent 60%); filter: blur(80px);"
      />
      <!-- Film grain overlay -->
      <div
        class="absolute inset-0 opacity-[0.03]"
        style="background-image: url('data:image/svg+xml,%3Csvg viewBox=&quot;0 0 256 256&quot; xmlns=&quot;http://www.w3.org/2000/svg&quot;%3E%3Cfilter id=&quot;noise&quot;%3E%3CfeTurbulence type=&quot;fractalNoise&quot; baseFrequency=&quot;0.9&quot; numOctaves=&quot;4&quot; stitchTiles=&quot;stitch&quot;/%3E%3C/filter%3E%3Crect width=&quot;100%25&quot; height=&quot;100%25&quot; filter=&quot;url(%23noise)&quot;/%3E%3C/svg%3E');"
      />
    </div>

    <!-- Main content - editorial layout -->
    <div class="relative z-10 w-full px-6 pb-20 pt-32 sm:px-12 lg:px-20">
      <div class="mx-auto max-w-7xl">
        <div class="grid gap-12 lg:grid-cols-12 lg:gap-8">
          <!-- Left column - Typography driven -->
          <div class="flex flex-col justify-end lg:col-span-7">
            <!-- Coach name as subtle label -->
            <p class="mb-6 text-sm font-medium uppercase tracking-[0.3em] text-[#d4956a]">
              {{ tenant.brand.displayName }}
            </p>

            <!-- Main headline - extra large, editorial -->
            <h1 class="font-serif text-[clamp(3rem,8vw,6rem)] leading-[0.95] tracking-tight text-white">
              <span class="block">Traverser</span>
              <span class="block text-[#b9aac7]">la ménopause</span>
              <span class="block">
                avec
                <em class="relative font-normal not-italic">
                  douceur
                  <span class="absolute -bottom-2 left-0 h-1 w-full bg-gradient-to-r from-[#d4956a] to-transparent" />
                </em>
              </span>
            </h1>

            <!-- Subtle tagline -->
            <p class="mt-10 max-w-md text-lg leading-relaxed text-[#857d8c]">
              Un espace de transformation pour les femmes qui refusent de simplement "gérer" cette étape de leur vie.
            </p>

            <!-- CTA - understated elegance -->
            <div class="mt-12 flex items-center gap-8">
              <UButton
                :to="ctaTo"
                size="xl"
                class="group border border-[#d4956a]/30 bg-transparent px-8 py-4 font-medium text-[#d4956a] transition-all duration-500 hover:border-[#d4956a] hover:bg-[#d4956a]/10"
              >
                <span class="flex items-center gap-3">
                  {{ ctaLabel ?? 'Réserver un appel' }}
                  <span class="inline-block transition-transform duration-500 group-hover:translate-x-1">→</span>
                </span>
              </UButton>

              <span class="hidden text-sm text-[#5b4b6e] sm:block">
                30 min · Gratuit · Sans engagement
              </span>
            </div>
          </div>

          <!-- Right column - Visual accent -->
          <div class="relative hidden lg:col-span-5 lg:flex lg:items-end lg:justify-end">
            <!-- Abstract shape instead of photo placeholder -->
            <div class="relative">
              <!-- Organic shape with gradient -->
              <div
                class="h-[50vh] w-80 rounded-[40%_60%_70%_30%/40%_50%_60%_50%]"
                style="background: linear-gradient(160deg, rgba(91, 75, 110, 0.4) 0%, rgba(212, 149, 106, 0.2) 100%); backdrop-filter: blur(1px);"
              />
              <!-- Overlapping accent -->
              <div
                class="absolute -bottom-8 -left-12 h-32 w-32 rounded-full border border-[#d4956a]/20"
                style="animation: pulse-slow 4s ease-in-out infinite;"
              />
              <div
                class="absolute -right-4 top-1/4 h-20 w-20 rounded-full bg-[#d4956a]/10"
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
        class="h-12 w-px bg-gradient-to-b from-transparent via-[#5b4b6e] to-transparent"
        style="animation: scroll-fade 2s ease-in-out infinite;"
      />
    </div>
  </section>
</template>

<style scoped>
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
