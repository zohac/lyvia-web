<script setup lang="ts">
import type { PublicTenantResponse } from '../../features/onboarding/api/onboarding.contract'
import CoachHeroProfile from '../organisms/CoachHeroProfile.vue'
import PrimaryButton from '../atoms/PrimaryButton.vue'

defineProps<{
  tenant: PublicTenantResponse
  ctaTo: string
}>()
</script>

<template>
  <div class="bg-[color:var(--color-surface-page)]">
    <CoachHeroProfile
      :tenant="tenant"
      :cta-to="ctaTo"
      :cta-label="'Appel découverte gratuit'"
    />

    <!-- Sophie / Guide -->
    <section
      id="sophie"
      class="relative py-24 sm:py-32"
    >
      <div class="mx-auto w-full max-w-[1000px] px-6">
        <div class="flex flex-col items-center gap-12 md:flex-row md:gap-20">
          <div class="w-full md:w-1/2">
            <div class="relative mx-auto aspect-[4/5] w-full max-w-md">
              <div
                aria-hidden="true"
                class="absolute inset-0 -translate-x-4 translate-y-4 rounded-full bg-[rgba(212,184,160,0.22)] blur-3xl"
              />
              <div
                class="relative h-full w-full blob-shape-2 bg-cover bg-center shadow-floating"
                style="background-image:url('/images/coach-portrait-placeholder.svg')"
                aria-hidden="true"
              />

              <div class="absolute -bottom-6 -right-4 max-w-[280px] rounded-2xl bg-white/90 p-6 shadow-floating backdrop-blur-md">
                <Icon
                  name="lucide:quote"
                  size="34"
                  class="text-[color:var(--color-brand-accent)]"
                  aria-hidden="true"
                />
                <p class="mt-2 font-serif text-sm italic leading-[var(--leading-relaxed)] text-[color:var(--color-brand-primary)]">
                  Mon manifeste : transformer cette transition en une renaissance personnelle.
                </p>
              </div>
            </div>
          </div>

          <div class="w-full md:w-1/2 grid gap-6">
            <h2 class="font-serif text-4xl text-[color:var(--color-brand-primary)] md:text-5xl">
              {{ tenant.brand.displayName }},
              <span class="italic text-[color:var(--color-brand-accent)]">votre guide</span>
            </h2>
            <p class="text-lg font-light leading-[var(--leading-relaxed)] text-[color:var(--color-brand-secondary)]">
              Une approche holistique, simple et humaine : écoute active, rituels soutenables, et un cadre apaisant pour traverser la ménopause avec clarté.
            </p>
            <p class="text-base leading-[var(--leading-relaxed)] text-[color:var(--color-brand-muted)]">
              Bio, spécialités et preuves sociales seront branchées dès que l’API les expose. En V0, on privilégie le parcours et la confiance.
            </p>

            <div class="pt-2">
              <a
                href="#parcours"
                class="inline-flex items-center gap-2 font-bold text-[color:var(--color-brand-accent)] hover:gap-4 transition-base"
              >
                Découvrir mon histoire
                <Icon
                  name="lucide:arrow-right"
                  size="16"
                  aria-hidden="true"
                />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Journey -->
    <section
      id="parcours"
      class="relative overflow-hidden px-6 py-24 sm:py-32"
    >
      <div
        aria-hidden="true"
        class="pointer-events-none absolute top-0 left-1/2 hidden h-full w-px -translate-x-1/2 bg-[linear-gradient(to_bottom,transparent,rgba(212,184,160,0.45),transparent)] md:block"
      />

      <div class="mx-auto flex w-full max-w-[960px] flex-col gap-24">
        <div class="text-center">
          <span class="text-xs font-bold uppercase tracking-widest text-[color:var(--color-brand-accent)]">
            La méthode Kaora
          </span>
          <h2 class="mt-4 font-serif text-4xl text-[color:var(--color-brand-primary)] sm:text-5xl">
            Le Parcours
            <span class="italic text-[color:var(--color-brand-accent)]">Serein</span>
          </h2>
        </div>

        <div class="flex flex-col items-center gap-8 md:flex-row md:gap-16 group">
          <div class="order-2 w-full md:order-1 md:w-1/2 md:text-right">
            <h3 class="font-serif text-2xl text-[color:var(--color-brand-primary)] transition-base group-hover:text-[color:var(--color-brand-accent)] md:text-3xl">
              Immersion & écoute
            </h3>
            <p class="mt-2 text-[color:var(--color-brand-secondary)]">
              Un temps suspendu pour déposer vos charges et définir vos aspirations profondes.
            </p>
          </div>
          <div class="order-1 md:order-2">
            <div class="relative grid h-16 w-16 place-items-center rounded-full border-2 border-[color:var(--color-brand-solid)] bg-white shadow-floating">
              <span class="font-serif text-xl font-bold text-[color:var(--color-brand-accent)]">01</span>
            </div>
          </div>
          <div class="order-3 w-full md:w-1/2" />
        </div>

        <div class="flex flex-col items-center gap-8 md:flex-row md:gap-16 group">
          <div class="order-3 hidden w-full md:order-1 md:block md:w-1/2" />
          <div class="order-1 md:order-2">
            <div class="relative grid h-16 w-16 place-items-center rounded-full border-2 border-[color:var(--color-brand-solid)] bg-white shadow-floating">
              <span class="font-serif text-xl font-bold text-[color:var(--color-brand-accent)]">02</span>
            </div>
          </div>
          <div class="order-2 w-full md:order-3 md:w-1/2 md:text-left">
            <h3 class="font-serif text-2xl text-[color:var(--color-brand-primary)] transition-base group-hover:text-[color:var(--color-brand-accent)] md:text-3xl">
              Harmonisation naturelle
            </h3>
            <p class="mt-2 text-[color:var(--color-brand-secondary)]">
              Mise en place de rituels sur-mesure, adaptés à votre rythme biologique unique.
            </p>
          </div>
        </div>

        <div class="flex flex-col items-center gap-8 md:flex-row md:gap-16 group">
          <div class="order-2 w-full md:order-1 md:w-1/2 md:text-right">
            <h3 class="font-serif text-2xl text-[color:var(--color-brand-primary)] transition-base group-hover:text-[color:var(--color-brand-accent)] md:text-3xl">
              Épanouissement continu
            </h3>
            <p class="mt-2 text-[color:var(--color-brand-secondary)]">
              Un suivi bienveillant pour ancrer ces changements dans la durée.
            </p>
          </div>
          <div class="order-1 md:order-2">
            <div class="relative grid h-16 w-16 place-items-center rounded-full border-2 border-[color:var(--color-brand-solid)] bg-white shadow-floating">
              <span class="font-serif text-xl font-bold text-[color:var(--color-brand-accent)]">03</span>
            </div>
          </div>
          <div class="order-3 w-full md:w-1/2" />
        </div>
      </div>
    </section>

    <!-- Testimonials -->
    <section class="bg-[rgba(28,25,23,0.04)] py-24">
      <div class="mx-auto w-full max-w-[1200px] px-6">
        <h2 class="font-serif text-3xl text-center text-[color:var(--color-brand-primary)] md:text-4xl">
          Échos de
          <span class="italic text-[color:var(--color-brand-accent)]">métamorphoses</span>
        </h2>

        <div class="mt-16 flex gap-6 overflow-x-auto pb-8 no-scrollbar md:justify-center">
          <div class="min-w-[300px] md:min-w-[350px] rounded-2xl rounded-tr-[4rem] bg-white/90 p-8 shadow-soft transition-all duration-500 hover:shadow-floating">
            <div class="mb-6 flex items-center gap-4">
              <div class="grid h-12 w-12 place-items-center rounded-full bg-[rgba(212,184,160,0.22)] font-semibold text-[color:var(--color-brand-primary)]">
                I
              </div>
              <div>
                <p class="font-bold text-[color:var(--color-brand-primary)]">
                  Isabelle
                </p>
                <p class="text-xs font-medium text-[color:var(--color-brand-accent)]">
                  52 ans
                </p>
              </div>
            </div>
            <p class="font-serif text-xl italic leading-[var(--leading-relaxed)] text-[color:var(--color-brand-secondary)]">
              “Une révélation douce et puissante. Je ne subis plus mon corps, je l'écoute enfin.”
            </p>
          </div>

          <div class="min-w-[300px] md:min-w-[350px] rounded-2xl rounded-tl-[4rem] bg-white/90 p-8 shadow-soft transition-all duration-500 hover:shadow-floating md:mt-8">
            <div class="mb-6 flex items-center gap-4">
              <div class="grid h-12 w-12 place-items-center rounded-full bg-[rgba(212,184,160,0.22)] font-semibold text-[color:var(--color-brand-primary)]">
                C
              </div>
              <div>
                <p class="font-bold text-[color:var(--color-brand-primary)]">
                  Claire
                </p>
                <p class="text-xs font-medium text-[color:var(--color-brand-accent)]">
                  49 ans
                </p>
              </div>
            </div>
            <p class="font-serif text-xl italic leading-[var(--leading-relaxed)] text-[color:var(--color-brand-secondary)]">
              “Kaora a changé ma perception de moi-même. C'est le luxe nécessaire pour mon équilibre.”
            </p>
          </div>

          <div class="min-w-[300px] md:min-w-[350px] rounded-2xl rounded-br-[4rem] bg-white/90 p-8 shadow-soft transition-all duration-500 hover:shadow-floating">
            <div class="mb-6 flex items-center gap-4">
              <div class="grid h-12 w-12 place-items-center rounded-full bg-[rgba(212,184,160,0.22)] font-semibold text-[color:var(--color-brand-primary)]">
                V
              </div>
              <div>
                <p class="font-bold text-[color:var(--color-brand-primary)]">
                  Véronique
                </p>
                <p class="text-xs font-medium text-[color:var(--color-brand-accent)]">
                  55 ans
                </p>
              </div>
            </div>
            <p class="font-serif text-xl italic leading-[var(--leading-relaxed)] text-[color:var(--color-brand-secondary)]">
              “Loin des cliniques froides, j'ai trouvé ici une chaleur humaine et une expertise rare.”
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- Final CTA -->
    <section class="px-6 py-16">
      <div class="mx-auto max-w-[1200px] text-center">
        <Icon
          name="lucide:sparkles"
          size="28"
          class="mx-auto text-[color:var(--color-brand-accent)] opacity-70"
          aria-hidden="true"
        />
        <h2 class="mt-6 font-serif text-2xl text-[color:var(--color-brand-primary)] md:text-3xl">
          Prête pour votre
          <span class="italic text-[color:var(--color-brand-accent)]">renaissance</span>
          ?
        </h2>
        <div class="mx-auto mt-8 max-w-[22rem]">
          <PrimaryButton
            :to="ctaTo"
            label="Réserver mon appel gratuit"
          />
        </div>
      </div>
    </section>
  </div>
</template>
