<script setup lang="ts">
import type { PublicProgramListItem } from '~/features/programs/api/programs.contract'
import type { CoachPricingProps } from '~/features/coach/types/coach-page.types'
import { formatCurrency } from '~/features/analytics/helpers/format-kpi'
import { formatProgramInstallments } from '~/features/programs/domain/programs'
import { getActiveConsultationPricePlans } from '~/features/consultation/domain/pricing'
import { useScrollReveal } from '~/composables/useScrollReveal'
import ProgramCheckoutModal from '~/components/organisms/ProgramCheckoutModal.vue'

const props = defineProps<CoachPricingProps>()

const { reveal } = useScrollReveal()

const activePlans = computed(() => getActiveConsultationPricePlans(props.plans))

// Checkout modal state (AC-3: interactive checkout integrated in pricing)
const checkoutModalOpen = ref(false)
const selectedProgram = ref<PublicProgramListItem | null>(null)

/**
 * CTA logic per program — mirrors ProgramCard.vue matrix (CR-1 fix).
 *
 * discoveryGate=true  + !authenticated → "Prendre un appel découverte" → booking URL
 * discoveryGate=true  + authenticated  → "Choisir ce programme"        → checkout
 * discoveryGate=false + !authenticated → "Choisir ce programme"        → login
 * discoveryGate=false + authenticated  → "Choisir ce programme"        → checkout
 */
function getProgramCta(program: PublicProgramListItem) {
  if (program.discoveryGate && !props.isAuthenticated) {
    return {
      label: 'Prendre un appel découverte',
      to: props.ctaTo ?? '/',
      action: null as (() => void) | null
    }
  }

  if (!props.isAuthenticated) {
    const redirect = props.currentPath ? encodeURIComponent(`${props.currentPath}#tarifs`) : ''
    return {
      label: 'Choisir ce programme',
      to: redirect ? `/login?redirect=${redirect}` : '/login',
      action: null as (() => void) | null
    }
  }

  return {
    label: 'Choisir ce programme',
    to: undefined as string | undefined,
    action: () => {
      selectedProgram.value = program
      checkoutModalOpen.value = true
    }
  }
}
</script>

<template>
  <section
    v-bind="reveal()"
    class="scroll-reveal bg-white px-6 py-24 sm:px-12 lg:px-20"
  >
    <div class="mx-auto max-w-6xl">
      <!-- Parent-provided H2 (P-Y5) -->
      <slot name="header" />

      <!-- Discovery card — featured, gradient border wrapper -->
      <div
        v-bind="reveal({ delay: 100 })"
        class="scroll-reveal rounded-2xl bg-gradient-to-br from-[#5b4b6e]/20 via-[#d4956a]/20 to-[#5b4b6e]/10 p-px"
      >
        <div class="discovery-card group relative rounded-2xl bg-white p-8 transition-all duration-300 sm:p-10">
          <!-- Glow blob -->
          <div
            class="discovery-card-glow absolute -right-10 -top-10 size-32 rounded-full bg-gradient-to-br from-[#e89560] to-[#d4956a] opacity-0"
            aria-hidden="true"
          />

          <div class="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div class="max-w-xl">
              <div class="flex flex-wrap items-center gap-3">
                <div class="grid size-12 place-items-center rounded-xl bg-gradient-to-br from-[#ebe7ef] to-[#f5f3f7] transition-all duration-300 group-hover:from-[#fbeade] group-hover:to-[#fdf6f1]">
                  <UIcon
                    name="i-lucide-phone"
                    class="size-5 text-[#5b4b6e] transition-colors duration-300 group-hover:text-[#d4956a]"
                  />
                </div>
                <h3 class="font-serif text-2xl text-[#2d2438]">
                  Appel découverte
                </h3>
              </div>
              <p class="mt-4 text-base leading-relaxed text-[#4a4255]">
                Avant de commencer l'accompagnement, je vous propose un appel découverte gratuit.
                Cet échange de {{ discoveryDurationMinutes }} minutes vous permet de m'expliquer ce que vous traversez
                actuellement, de poser vos questions et de voir ensemble si cet accompagnement
                correspond à vos besoins et à vos attentes.
              </p>
            </div>

            <div class="flex shrink-0 flex-col items-center gap-3 sm:items-end">
              <span class="font-serif text-4xl font-bold text-[#2d2438]">
                Gratuit
              </span>
              <span class="rounded-full bg-[#d4956a]/10 px-4 py-1.5 text-sm font-medium text-[#d4956a]">
                {{ discoveryDurationMinutes }} min · Sans engagement
              </span>
              <UButton
                :to="ctaTo"
                class="mt-1 rounded-full bg-gradient-to-r from-[#d4956a] to-[#e89560] px-6 text-sm font-semibold text-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
              >
                Réserver mon appel
              </UButton>
            </div>
          </div>
        </div>
      </div>

      <!-- Programs — B2B feature cards with interactive checkout (AC-3) -->
      <div
        v-if="programs.length > 0"
        class="mt-12"
      >
        <p
          v-bind="reveal({ delay: 200 })"
          class="scroll-reveal mb-8 text-center text-xs font-bold uppercase tracking-[0.25em] text-[#5b4b6e]"
        >
          Programmes d'accompagnement
        </p>
        <div class="flex flex-wrap justify-center gap-6">
          <article
            v-for="(program, index) in programs"
            :key="program.id"
            v-bind="reveal({ delay: 250 + index * 100 })"
            class="pricing-card scroll-reveal group relative w-full overflow-hidden rounded-2xl border border-[#ebe7ef] bg-white p-8 transition-all duration-300 md:w-[calc(50%-0.75rem)] lg:w-[calc(33.333%-1rem)]"
          >
            <!-- Glow blob -->
            <div
              class="pricing-card-glow absolute -right-8 -top-8 size-24 rounded-full bg-gradient-to-br from-[#e89560] to-[#d4956a] opacity-0"
              aria-hidden="true"
            />

            <div class="relative">
              <span class="inline-flex items-center gap-1.5 rounded-full border border-[#ebe7ef] bg-[#f5f3f7] px-3 py-1 text-xs font-medium text-[#5b4b6e]">
                <UIcon
                  name="i-lucide-calendar-check"
                  class="size-3.5"
                />
                {{ program.totalSessions }} séances · {{ program.validityMonths }} mois
              </span>

              <h4 class="mt-5 font-serif text-xl text-[#2d2438]">
                {{ program.name }}
              </h4>
              <p class="mt-3 text-sm leading-relaxed text-[#4a4255]">
                {{ program.description }}
              </p>

              <div class="mt-8 border-t border-[#ebe7ef] pt-6">
                <p class="font-serif text-3xl font-bold text-[#2d2438]">
                  {{ formatCurrency(program.priceCents) }}
                </p>
                <p
                  v-if="formatProgramInstallments(program)"
                  class="mt-1 text-sm text-[#857d8c]"
                >
                  ou {{ formatProgramInstallments(program) }}
                </p>
              </div>

              <!-- Discovery gate badge (CR-1: mirrors ProgramCard.vue) -->
              <div
                v-if="program.discoveryGate"
                class="mt-4"
              >
                <span class="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700 ring-1 ring-amber-200">
                  <UIcon
                    name="i-lucide-phone-call"
                    class="size-3.5"
                  />
                  Appel découverte requis
                </span>
              </div>

              <!-- CTA per program (CR-1: discoveryGate-aware matrix) -->
              <UButton
                :to="getProgramCta(program).to"
                class="mt-6 w-full rounded-full bg-gradient-to-r from-[#5b4b6e] to-[#4d3f5c] text-sm font-semibold text-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
                @click="getProgramCta(program).action?.()"
              >
                {{ getProgramCta(program).label }}
              </UButton>
            </div>
          </article>
        </div>
      </div>

      <!-- Consultation plans — list view with B2B hover pattern -->
      <div
        v-if="activePlans.length > 0"
        class="mt-12"
      >
        <p
          v-bind="reveal({ delay: 350 })"
          class="scroll-reveal mb-8 text-center text-xs font-bold uppercase tracking-[0.25em] text-[#5b4b6e]"
        >
          Séances de consultation
        </p>
        <div class="mx-auto max-w-3xl space-y-4">
          <article
            v-for="(plan, index) in activePlans"
            :key="plan.id"
            v-bind="reveal({ delay: 400 + index * 80 })"
            class="pricing-card scroll-reveal group relative flex items-center justify-between overflow-hidden rounded-2xl border border-[#ebe7ef] bg-white p-6 transition-all duration-300"
          >
            <div
              class="pricing-card-glow absolute -right-6 -top-6 size-20 rounded-full bg-gradient-to-br from-[#e89560] to-[#d4956a] opacity-0"
              aria-hidden="true"
            />
            <div class="relative flex items-center gap-4">
              <div class="grid size-10 place-items-center rounded-xl bg-gradient-to-br from-[#ebe7ef] to-[#f5f3f7] transition-all duration-300 group-hover:from-[#fbeade] group-hover:to-[#fdf6f1]">
                <UIcon
                  name="i-lucide-clock"
                  class="size-5 text-[#5b4b6e] transition-colors duration-300 group-hover:text-[#d4956a]"
                />
              </div>
              <div>
                <h4 class="font-serif text-lg text-[#2d2438]">
                  {{ plan.label }}
                </h4>
                <p class="text-sm text-[#857d8c]">
                  {{ plan.durationMinutes }} min
                </p>
              </div>
            </div>
            <span class="relative font-serif text-2xl font-bold text-[#2d2438]">
              {{ formatCurrency(plan.amountCents) }}
            </span>
          </article>
        </div>
      </div>
    </div>
  </section>

  <!-- Checkout modal (AC-3) -->
  <ProgramCheckoutModal
    v-model:open="checkoutModalOpen"
    :program="selectedProgram"
  />
</template>

<style scoped>
.discovery-card:hover {
  box-shadow: 0 12px 32px rgba(91, 75, 110, 0.12);
}

.discovery-card:hover .discovery-card-glow {
  opacity: 0.12;
  transition: opacity 0.4s;
}

.pricing-card:hover {
  border-color: #d7cfdf;
  box-shadow: 0 8px 24px rgba(91, 75, 110, 0.1);
  transform: translateY(-4px);
}

.pricing-card:hover .pricing-card-glow {
  opacity: 0.15;
  transition: opacity 0.4s;
}

@media (prefers-reduced-motion: reduce) {
  .pricing-card:hover {
    transform: none;
  }
}
</style>
