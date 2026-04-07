<script setup lang="ts">
/**
 * CoachPageEssentiel — Template "Essentiel" pour pages coach (YC2.2).
 *
 * Version minimaliste du template coach : Hero + À propos + Tarifs + CTA final
 * + disclaimer médical. Pas de sections Piliers / Benefits / Educational /
 * How it works / Problem statement. Destiné aux coachs qui veulent une page
 * sobre ou qui n'ont pas rempli le contenu riche JSONB.
 *
 * Sert également de template **fallback** dans `useCoachPageTemplate` quand
 * le templateCode est inconnu ou absent (AC-4 de YC2.2).
 *
 * Même signature de props que `CoachPageSignature.vue` : les deux templates
 * sont interchangeables via le composable `useCoachPageTemplate`.
 *
 * YC2.3 étendra / polira le design de ce template.
 */
import type { PublicTenantResponse } from '~/features/onboarding/api/onboarding.contract'
import type { PublicProviderProfile } from '~/features/seo/api/public-provider-profile.contract'
import type { PublicProgramListItem } from '~/features/programs/api/programs.contract'
import type { ConsultationPricePlan } from '~/features/consultation/api/consultation.contract'
import { useScrollReveal } from '~/composables/useScrollReveal'
import CoachHeroProfile from '~/components/organisms/CoachHeroProfile.vue'
import CoachPricing from '~/components/organisms/CoachPricing.vue'
import StickyCtaMobile from '~/components/molecules/StickyCtaMobile.vue'

const props = defineProps<{
  tenant: PublicTenantResponse
  ctaTo: string
  coachProfile: PublicProviderProfile | null
  publicPrograms: PublicProgramListItem[]
  consultationPlans: ConsultationPricePlan[]
  isAuthenticated: boolean
  currentPath: string
}>()

const { reveal, isReady } = useScrollReveal()

const coachName = computed(() => props.tenant.brand.displayName?.trim() || 'Votre spécialiste')
const discoveryDuration = computed(() => props.coachProfile?.discoveryDurationMinutes ?? 15)
const hasPricing = computed(() => props.consultationPlans.length > 0 || props.publicPrograms.length > 0)

const heroProps = computed(() => ({
  displayName: coachName.value,
  heroHeadline: props.coachProfile?.heroHeadline ?? null,
  credentials: props.coachProfile?.credentials ?? [],
  city: props.coachProfile?.city ?? null,
  profilePhotoUrl: props.coachProfile?.imageUrl ?? null,
  heroPhotoUrl: props.coachProfile?.heroImageUrl ?? null,
  profilePhotoAlt: props.coachProfile?.imageUrl ? `${coachName.value}, spécialiste accompagnement ménopause` : null,
  discoveryDurationMinutes: props.coachProfile?.discoveryDurationMinutes ?? 15,
  urgencyText: props.coachProfile?.urgencyText ?? null,
  ctaTo: props.ctaTo
}))
</script>

<template>
  <div
    class="min-h-screen"
    :class="{ 'js-scroll-ready': isReady }"
  >
    <!-- ==================== 1. HERO ==================== -->
    <CoachHeroProfile v-bind="heroProps" />

    <!-- ==================== 2. À PROPOS (sobre) ==================== -->
    <section
      id="qui-suis-je"
      v-bind="reveal()"
      class="scroll-reveal bg-[color:var(--color-surface-card)] px-6 py-24 sm:px-12 lg:px-20"
    >
      <div class="mx-auto max-w-3xl">
        <span class="mb-6 inline-block text-xs font-bold uppercase tracking-[0.25em] text-[var(--color-brand-primary)]">
          Qui suis-je
        </span>

        <h2 class="font-serif text-4xl leading-tight text-[var(--color-crepuscule-950)]">
          {{ coachName }}
        </h2>

        <p
          v-if="coachProfile?.credentials?.length || coachProfile?.city"
          class="mt-4 text-lg text-[var(--color-brand-accent)]"
        >
          <template v-if="coachProfile?.credentials?.length">
            {{ coachProfile.credentials[0]?.title }}
          </template>
          <template v-if="coachProfile?.credentials?.length && coachProfile?.city">
            ·
          </template>
          <template v-if="coachProfile?.city">
            {{ coachProfile.city }}
          </template>
        </p>

        <div class="mt-8 space-y-6 text-base leading-relaxed text-[var(--color-crepuscule-700)]">
          <template v-if="coachProfile?.longBio">
            <p
              v-for="(paragraph, i) in coachProfile.longBio.split('\n\n').filter(Boolean)"
              :key="i"
            >
              {{ paragraph }}
            </p>
          </template>
          <template v-else-if="coachProfile?.bio">
            <p>{{ coachProfile.bio }}</p>
          </template>
          <template v-else>
            <p>
              Spécialiste en accompagnement bien-être, je propose un suivi personnalisé
              et adapté à chaque étape de votre parcours.
            </p>
          </template>
        </div>
      </div>
    </section>

    <!-- ==================== 3. TARIFS & PROGRAMMES ==================== -->
    <div id="tarifs">
      <CoachPricing
        v-if="hasPricing"
        :plans="consultationPlans"
        :programs="publicPrograms"
        :discovery-duration-minutes="discoveryDuration"
        :cta-to="ctaTo"
        :is-authenticated="isAuthenticated"
        :current-path="currentPath"
      >
        <template #header>
          <span class="inline-block border-b-2 border-[var(--color-brand-accent)] pb-2 text-xs font-bold uppercase tracking-[0.25em] text-[var(--color-brand-primary)]">
            Tarifs
          </span>
          <h2 class="mt-6 mb-12 font-serif text-4xl leading-tight text-[var(--color-crepuscule-950)] lg:text-5xl">
            Tarifs des séances
          </h2>
        </template>
      </CoachPricing>
    </div>

    <!-- ==================== 4. CTA FINAL ==================== -->
    <section
      v-bind="reveal()"
      class="scroll-reveal relative overflow-hidden bg-gradient-to-br from-[var(--color-brand-primary)] to-[var(--color-crepuscule-800)] px-6 py-24 sm:px-12 lg:px-20"
    >
      <div class="relative mx-auto max-w-3xl text-center">
        <h2 class="font-serif text-4xl leading-tight text-white lg:text-5xl">
          Réservez votre
          <span class="block text-[var(--color-sunset-300)]">séance découverte gratuite</span>
        </h2>

        <p class="mx-auto mt-8 max-w-lg text-lg text-[var(--color-crepuscule-200)]">
          Un premier échange de {{ discoveryDuration }} minutes, gratuit et sans engagement.
        </p>

        <div class="mt-12">
          <UButton
            :to="ctaTo"
            size="xl"
            data-final-cta
            class="group rounded-full border-2 border-[var(--color-brand-accent)] bg-[var(--color-brand-accent)] px-10 py-5 font-semibold text-white transition-all duration-300 hover:bg-transparent hover:text-[var(--color-sunset-300)]"
          >
            <span class="flex items-center gap-3">
              Je prends rendez-vous avec {{ coachName }}
              <span class="transition-transform duration-300 group-hover:translate-x-1">→</span>
            </span>
          </UButton>
        </div>

        <p class="mt-8 text-sm text-[var(--color-crepuscule-400)]">
          Fuseau horaire : {{ tenant.timezone }}
        </p>
      </div>
    </section>

    <!-- ==================== 5. DISCLAIMER MÉDICAL ==================== -->
    <AtomsMedicalDisclaimer />

    <!-- Spacer for mobile sticky CTA -->
    <div class="h-16 md:hidden" />

    <StickyCtaMobile
      cta-label="Réserver mon appel gratuit →"
      :cta-to="ctaTo"
    />
  </div>
</template>

<style scoped>
.js-scroll-ready .scroll-reveal:not(.is-visible) {
  opacity: 0;
  transform: translateY(24px);
}

.scroll-reveal {
  transition: opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1), transform 0.7s cubic-bezier(0.16, 1, 0.3, 1);
  will-change: opacity, transform;
}

.scroll-reveal.is-visible {
  opacity: 1;
  transform: translateY(0);
}

@media (prefers-reduced-motion: reduce) {
  .js-scroll-ready .scroll-reveal:not(.is-visible) {
    opacity: 1;
    transform: none;
    transition: none;
  }

  .scroll-reveal {
    transition: none;
  }
}
</style>
