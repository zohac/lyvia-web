<script setup lang="ts">
import '~/assets/css/auth.css'

import LegalFooterLinks from '../components/atoms/LegalFooterLinks.vue'

useCommonLayoutHead({ noindex: true })
</script>

<template>
  <div class="min-h-[100svh] bg-[#f9f8fa] text-[#221d28]">
    <div class="flex min-h-[100svh] flex-col lg:grid lg:grid-cols-2 lg:items-stretch">
      <!-- Form side -->
      <main class="flex flex-1 flex-col px-6 py-14 lg:px-16">
        <div class="flex flex-1 items-center justify-center">
          <div class="w-full max-w-md">
            <slot />
          </div>
        </div>
        <footer class="pt-8 lg:hidden">
          <LegalFooterLinks />
        </footer>
      </main>

      <!-- Visual side - Crépuscule gradient with floating elements -->
      <aside class="hidden p-4 lg:block">
        <div class="relative h-full w-full overflow-hidden rounded-l-[2.5rem] bg-gradient-to-br from-[#4d3f5c] via-[#3d3250] to-[#352c44]">
          <!-- Ambient gradient orbs -->
          <div
            class="absolute -right-[20%] -top-[10%] h-[60vh] w-[60vh] rounded-full opacity-40"
            style="background: radial-gradient(circle, rgba(212, 149, 106, 0.5), transparent 70%); filter: blur(60px);"
          />
          <div
            class="absolute -bottom-[15%] -left-[10%] h-[50vh] w-[50vh] rounded-full opacity-30"
            style="background: radial-gradient(circle, rgba(122, 107, 142, 0.6), transparent 70%); filter: blur(50px);"
          />

          <!-- Subtle grid pattern -->
          <div
            class="absolute inset-0 opacity-[0.03]"
            style="background-image: linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px); background-size: 40px 40px;"
          />

          <!-- Floating decorative cards -->
          <div class="absolute right-12 top-16 animate-float">
            <div class="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-md">
              <div class="flex items-center gap-3">
                <div class="grid size-10 place-items-center rounded-full bg-gradient-to-br from-[#d4956a] to-[#e89560]">
                  <UIcon
                    name="i-lucide-calendar-check"
                    class="size-5 text-white"
                  />
                </div>
                <div class="text-white">
                  <p class="text-xs text-white/70">
                    Nouveau RDV
                  </p>
                  <p class="font-medium">
                    14h00 — Marie
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div class="absolute left-8 top-1/3 animate-float-delayed">
            <div class="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-md">
              <div class="flex items-center gap-3">
                <div class="grid size-10 place-items-center rounded-full bg-gradient-to-br from-[#4ade80] to-[#4a8b6e]">
                  <UIcon
                    name="i-lucide-check"
                    class="size-5 text-white"
                  />
                </div>
                <div class="text-white">
                  <p class="text-xs text-white/70">
                    Paiement reçu
                  </p>
                  <p class="font-medium">
                    85 €
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div class="absolute bottom-1/4 right-16 animate-float-slow">
            <div class="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-md">
              <div class="flex items-center gap-3">
                <div class="grid size-10 place-items-center rounded-full bg-gradient-to-br from-[#9685ab] to-[#7a6b8e]">
                  <UIcon
                    name="i-lucide-users"
                    class="size-5 text-white"
                  />
                </div>
                <div class="text-white">
                  <p class="text-xs text-white/70">
                    Clientes actives
                  </p>
                  <p class="font-medium">
                    24 ce mois
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- Quote at bottom -->
          <div class="absolute bottom-20 left-12 right-12 max-w-lg">
            <UIcon
              name="i-lucide-quote"
              class="mb-4 size-8 text-[#d4956a]"
            />
            <p class="font-serif text-2xl leading-relaxed text-white/90">
              La simplicité est un luxe. Keova vous aide à la préserver.
            </p>
            <p class="mt-6 text-xs font-bold uppercase tracking-[0.25em] text-white/50">
              Keova — Calm Tech
            </p>
          </div>

          <!-- Legal footer -->
          <div class="absolute bottom-6 left-12 right-12">
            <LegalFooterLinks class="[&_a:hover]:text-white [&_a]:text-white/40" />
          </div>
        </div>
      </aside>
    </div>
    <ClientOnly>
      <LazyOrganismsCookieConsentBanner />
    </ClientOnly>
  </div>
</template>

<style scoped>
.animate-float {
  animation: float 6s ease-in-out infinite;
}

.animate-float-delayed {
  animation: float 6s ease-in-out 2s infinite;
}

.animate-float-slow {
  animation: float 8s ease-in-out 1s infinite;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-12px);
  }
}
</style>
