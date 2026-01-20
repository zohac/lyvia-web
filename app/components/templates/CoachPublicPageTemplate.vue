<script setup lang="ts">
import type { PublicTenantResponse } from '../../features/onboarding/api/onboarding.contract'
import CoachHeroProfile from '../organisms/CoachHeroProfile.vue'

defineProps<{
  tenant: PublicTenantResponse
}>()
</script>

<template>
  <div class="min-h-screen">
    <!-- Hero - Dark cinematic -->
    <CoachHeroProfile
      :tenant="tenant"
      :cta-to="`/c/${tenant.slug}/discovery`"
    />

    <!-- Section: Manifeste - Full-width pull quote -->
    <section class="relative overflow-hidden bg-[#f5f0eb] px-6 py-32 sm:px-12 lg:px-20">
      <!-- Decorative line -->
      <div class="absolute left-0 top-0 h-px w-full bg-gradient-to-r from-transparent via-[#d4956a]/30 to-transparent" />

      <div class="mx-auto max-w-5xl">
        <blockquote class="relative">
          <!-- Large quotation mark -->
          <span
            class="absolute -left-4 -top-8 font-serif text-[12rem] leading-none text-[#d4956a]/10 lg:-left-16"
            aria-hidden="true"
          >"</span>

          <p class="relative font-serif text-[clamp(1.5rem,4vw,3rem)] leading-[1.3] text-[#2d2438]">
            La ménopause n'est pas une maladie à soigner.
            <br class="hidden sm:block">
            C'est une <em class="text-[#5b4b6e]">métamorphose</em> à accompagner.
          </p>

          <footer class="mt-12 flex items-center gap-4">
            <div class="h-px w-12 bg-[#d4956a]" />
            <cite class="text-sm font-medium not-italic tracking-wide text-[#857d8c]">
              {{ tenant.brand.displayName }}
            </cite>
          </footer>
        </blockquote>
      </div>
    </section>

    <!-- Section: L'Approche - Asymmetric layout -->
    <section
      id="approche"
      class="relative bg-[#f5f0eb]"
    >
      <!-- Wavy divider top -->
      <div class="absolute -top-px left-0 right-0 h-16 overflow-hidden">
        <svg
          class="absolute bottom-0 w-full text-white"
          viewBox="0 0 1440 54"
          fill="currentColor"
          preserveAspectRatio="none"
        >
          <path d="M0 22L60 27C120 32 240 42 360 44C480 46 600 40 720 35C840 30 960 26 1080 28C1200 30 1320 38 1380 42L1440 46V54H1380C1320 54 1200 54 1080 54C960 54 840 54 720 54C600 54 480 54 360 54C240 54 120 54 60 54H0V22Z" />
        </svg>
      </div>

      <div class="bg-white px-6 py-32 sm:px-12 lg:px-20">
        <div class="mx-auto max-w-7xl">
          <!-- Section label -->
          <div class="mb-16">
            <span class="inline-block border-b-2 border-[#d4956a] pb-2 text-xs font-bold uppercase tracking-[0.25em] text-[#5b4b6e]">
              L'approche
            </span>
          </div>

          <!-- Staggered content blocks -->
          <div class="grid gap-24 lg:grid-cols-12">
            <!-- Main content - offset left -->
            <div class="lg:col-span-7 lg:col-start-1">
              <h2 class="font-serif text-4xl leading-tight text-[#2d2438] lg:text-5xl">
                Une écoute
                <span class="block text-[#5b4b6e]">au-delà des symptômes</span>
              </h2>

              <div class="mt-12 space-y-8 text-lg leading-relaxed text-[#4a4255]">
                <p>
                  Les bouffées de chaleur, l'insomnie, les fluctuations d'humeur — ce ne sont que la surface.
                  En dessous, il y a une femme qui traverse une transition profonde.
                </p>
                <p class="text-[#857d8c]">
                  Mon rôle est de vous accompagner dans cette traversée, pas de vous donner des recettes miracles.
                  Ensemble, nous explorons ce qui émerge, ce qui se transforme, ce qui demande attention.
                </p>
              </div>
            </div>

            <!-- Visual accent - offset right -->
            <div class="relative lg:col-span-4 lg:col-start-9">
              <!-- Vertical accent line -->
              <div class="absolute -left-8 top-0 hidden h-full w-px bg-gradient-to-b from-[#d4956a] via-[#d4956a]/20 to-transparent lg:block" />

              <!-- Stats or highlights -->
              <div class="space-y-12">
                <div>
                  <span class="font-serif text-5xl text-[#d4956a]">10+</span>
                  <p class="mt-2 text-sm text-[#857d8c]">
                    années d'accompagnement
                  </p>
                </div>
                <div>
                  <span class="font-serif text-5xl text-[#5b4b6e]">200+</span>
                  <p class="mt-2 text-sm text-[#857d8c]">
                    femmes accompagnées
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Section: Le Parcours - Vertical storytelling -->
    <section
      id="parcours"
      class="relative overflow-hidden bg-[#2d2438] px-6 py-32 text-white sm:px-12 lg:px-20"
    >
      <!-- Background texture -->
      <div class="parcours-texture pointer-events-none absolute inset-0 opacity-[0.02]" />

      <div class="relative mx-auto max-w-5xl">
        <!-- Section header -->
        <div class="mb-20 text-center">
          <span class="mb-6 inline-block rounded-full border border-[#d4956a]/30 px-6 py-2 text-xs font-medium uppercase tracking-[0.2em] text-[#d4956a]">
            Le parcours
          </span>
          <h2 class="font-serif text-4xl leading-tight text-white lg:text-5xl">
            Trois temps
            <span class="block text-[#b9aac7]">pour se retrouver</span>
          </h2>
        </div>

        <!-- Journey steps - vertical, not grid -->
        <div class="relative">
          <!-- Central vertical line -->
          <div class="absolute left-8 top-0 hidden h-full w-px bg-gradient-to-b from-[#d4956a] via-[#5b4b6e] to-[#d4956a]/20 lg:left-1/2 lg:block" />

          <div class="space-y-24">
            <!-- Step 1 -->
            <div class="relative lg:flex lg:items-center">
              <!-- Number marker -->
              <div class="absolute left-0 top-0 flex size-16 items-center justify-center rounded-full border border-[#d4956a]/30 bg-[#2d2438] font-serif text-2xl text-[#d4956a] lg:left-1/2 lg:-translate-x-1/2">
                01
              </div>
              <!-- Content -->
              <div class="pl-24 lg:w-1/2 lg:pl-0 lg:pr-20 lg:text-right">
                <h3 class="font-serif text-2xl text-white">
                  Accueil
                </h3>
                <p class="mt-4 text-[#b9aac7]">
                  Un premier échange pour comprendre où vous en êtes, ce que vous traversez, ce que vous espérez.
                  Sans jugement, sans agenda caché.
                </p>
              </div>
            </div>

            <!-- Step 2 -->
            <div class="relative lg:flex lg:flex-row-reverse lg:items-center">
              <!-- Number marker -->
              <div class="absolute left-0 top-0 flex size-16 items-center justify-center rounded-full border border-[#5b4b6e]/50 bg-[#2d2438] font-serif text-2xl text-[#9685ab] lg:left-1/2 lg:-translate-x-1/2">
                02
              </div>
              <!-- Content -->
              <div class="pl-24 lg:w-1/2 lg:pl-20 lg:pr-0 lg:text-left">
                <h3 class="font-serif text-2xl text-white">
                  Exploration
                </h3>
                <p class="mt-4 text-[#b9aac7]">
                  Des séances régulières pour explorer ensemble vos ressources, vos besoins, les ajustements possibles.
                  À votre rythme.
                </p>
              </div>
            </div>

            <!-- Step 3 -->
            <div class="relative lg:flex lg:items-center">
              <!-- Number marker -->
              <div class="absolute left-0 top-0 flex size-16 items-center justify-center rounded-full border border-[#d4956a]/30 bg-[#2d2438] font-serif text-2xl text-[#d4956a] lg:left-1/2 lg:-translate-x-1/2">
                03
              </div>
              <!-- Content -->
              <div class="pl-24 lg:w-1/2 lg:pl-0 lg:pr-20 lg:text-right">
                <h3 class="font-serif text-2xl text-white">
                  Intégration
                </h3>
                <p class="mt-4 text-[#b9aac7]">
                  Vous repartez avec des outils concrets, une meilleure connaissance de vous-même,
                  et la confiance pour naviguer cette nouvelle étape.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Section: Témoignages - Editorial vertical -->
    <section class="relative bg-white px-6 py-32 sm:px-12 lg:px-20">
      <div class="mx-auto max-w-4xl">
        <!-- Section header - centered -->
        <div class="mb-20 text-center">
          <span class="mb-4 inline-block text-xs font-bold uppercase tracking-[0.25em] text-[#d4956a]">
            Témoignages
          </span>
          <h2 class="font-serif text-4xl leading-tight text-[#2d2438]">
            Leurs mots,
            <span class="text-[#5b4b6e]">leur vérité</span>
          </h2>
        </div>

        <!-- Testimonials - vertical stack with editorial styling -->
        <div class="space-y-16">
          <!-- Testimonial 1 - Featured quote -->
          <article class="relative border-l-2 border-[#d4956a] pl-8 lg:pl-12">
            <span
              class="absolute -left-0 top-0 font-serif text-6xl leading-none text-[#d4956a]"
              aria-hidden="true"
            >"</span>
            <blockquote class="font-serif text-xl leading-relaxed text-[#2d2438] lg:text-2xl">
              Je ne cherchais pas à "guérir" de la ménopause. Je cherchais quelqu'un qui comprenne
              que ce n'était pas une maladie. J'ai trouvé bien plus.
            </blockquote>
            <footer class="mt-6 flex items-center gap-3">
              <div class="h-px w-8 bg-[#d4956a]/40" />
              <cite class="text-sm not-italic text-[#857d8c]">
                <span class="font-medium text-[#2d2438]">Marie-Claire</span>, 52 ans
              </cite>
            </footer>
          </article>

          <!-- Divider -->
          <div class="flex items-center justify-center gap-4">
            <div class="h-px w-16 bg-[#d7cfdf]" />
            <div class="size-2 rotate-45 bg-[#d4956a]/30" />
            <div class="h-px w-16 bg-[#d7cfdf]" />
          </div>

          <!-- Testimonial 2 -->
          <article class="relative border-l-2 border-[#5b4b6e]/30 pl-8 lg:pl-12">
            <blockquote class="font-serif text-lg leading-relaxed text-[#4a4255] lg:text-xl">
              Les séances m'ont aidée à voir cette période différemment.
              Pas comme une fin, mais comme un passage.
            </blockquote>
            <footer class="mt-6 flex items-center gap-3">
              <div class="h-px w-8 bg-[#5b4b6e]/30" />
              <cite class="text-sm not-italic text-[#857d8c]">
                <span class="font-medium text-[#2d2438]">Sophie</span>, 48 ans
              </cite>
            </footer>
          </article>

          <!-- Testimonial 3 -->
          <article class="relative border-l-2 border-[#5b4b6e]/30 pl-8 lg:pl-12">
            <blockquote class="font-serif text-lg leading-relaxed text-[#4a4255] lg:text-xl">
              Enfin quelqu'un qui écoute vraiment, sans vouloir tout médicamentaliser.
            </blockquote>
            <footer class="mt-6 flex items-center gap-3">
              <div class="h-px w-8 bg-[#5b4b6e]/30" />
              <cite class="text-sm not-italic text-[#857d8c]">
                <span class="font-medium text-[#2d2438]">Anne</span>, 55 ans
              </cite>
            </footer>
          </article>
        </div>
      </div>
    </section>

    <!-- Section: CTA Final - Warm invitation -->
    <section class="relative overflow-hidden bg-gradient-to-br from-[#5b4b6e] to-[#3d3250] px-6 py-32 sm:px-12 lg:px-20">
      <!-- Subtle warm accent -->
      <div
        class="pointer-events-none absolute -right-[20%] top-1/2 h-[60vh] w-[60vh] -translate-y-1/2 rounded-full"
        style="background: radial-gradient(circle, rgba(212, 149, 106, 0.15), transparent 60%); filter: blur(80px);"
      />

      <div class="relative mx-auto max-w-3xl text-center">
        <h2 class="font-serif text-4xl leading-tight text-white lg:text-5xl">
          Prête à explorer
          <span class="block text-[#f0b48f]">ce nouveau chapitre ?</span>
        </h2>

        <p class="mx-auto mt-8 max-w-lg text-lg text-[#d7cfdf]">
          Un premier échange de 30 minutes, gratuit et sans engagement,
          pour voir si nous sommes faites pour cheminer ensemble.
        </p>

        <div class="mt-12">
          <UButton
            :to="`/c/${tenant.slug}/discovery`"
            size="xl"
            class="group rounded-full border-2 border-[#d4956a] bg-[#d4956a] px-10 py-5 font-semibold text-white transition-all duration-300 hover:bg-transparent hover:text-[#f0b48f]"
          >
            <span class="flex items-center gap-3">
              Réserver mon appel découverte
              <span class="transition-transform duration-300 group-hover:translate-x-1">→</span>
            </span>
          </UButton>
        </div>

        <!-- Trust note -->
        <p class="mt-8 text-sm text-[#9685ab]">
          Fuseau horaire : {{ tenant.timezone }}
        </p>
      </div>
    </section>
  </div>
</template>

<style scoped>
.parcours-texture {
  background-image: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
}
</style>
