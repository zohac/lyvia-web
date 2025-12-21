<script setup lang="ts">
import type { PublicTenantResponse } from '../../features/onboarding/api/onboarding.contract'
import CoachHeroProfile from '../organisms/CoachHeroProfile.vue'

defineProps<{
  tenant: PublicTenantResponse
  ctaTo: string
}>()
</script>

<template>
  <div class="min-h-[100svh] bg-[color:var(--color-surface-page)]">
    <div class="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
      <CoachHeroProfile
        :tenant="tenant"
        :cta-to="ctaTo"
      />
    </div>

    <section class="border-y border-[color:var(--color-brand-subtle)] bg-[color:var(--color-surface-card)]">
      <div class="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
        <h2 class="font-serif text-[1.75rem] font-semibold leading-[var(--leading-tight)] text-[color:var(--color-brand-primary)]">
          Un premier pas simple, rassurant, humain
        </h2>

        <div class="mt-8 grid gap-4 sm:grid-cols-3">
          <div class="rounded-[var(--radius-lg)] border border-[color:var(--color-brand-subtle)] bg-white p-6 shadow-[var(--shadow-card)]">
            <h3 class="font-serif text-[1.25rem] font-semibold text-[color:var(--color-brand-primary)]">
              1. On fait connaissance
            </h3>
            <p class="mt-2 text-[color:var(--color-brand-secondary)]">
              Un échange gratuit pour comprendre votre besoin et clarifier vos objectifs.
            </p>
          </div>
          <div class="rounded-[var(--radius-lg)] border border-[color:var(--color-brand-subtle)] bg-white p-6 shadow-[var(--shadow-card)]">
            <h3 class="font-serif text-[1.25rem] font-semibold text-[color:var(--color-brand-primary)]">
              2. On pose un plan
            </h3>
            <p class="mt-2 text-[color:var(--color-brand-secondary)]">
              Si c’est pertinent, vous repartez avec une direction claire et des prochaines étapes.
            </p>
          </div>
          <div class="rounded-[var(--radius-lg)] border border-[color:var(--color-brand-subtle)] bg-white p-6 shadow-[var(--shadow-card)]">
            <h3 class="font-serif text-[1.25rem] font-semibold text-[color:var(--color-brand-primary)]">
              3. Zéro pression
            </h3>
            <p class="mt-2 text-[color:var(--color-brand-secondary)]">
              Sans engagement. Vous choisissez de continuer uniquement si vous vous sentez en confiance.
            </p>
          </div>
        </div>
      </div>
    </section>

    <section class="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
      <div class="grid gap-6 rounded-[var(--radius-lg)] border border-[color:var(--color-brand-subtle)] bg-[color:var(--color-surface-card)] p-8 shadow-[var(--shadow-card)] sm:p-10">
        <h2 class="font-serif text-[1.75rem] font-semibold leading-[var(--leading-tight)] text-[color:var(--color-brand-primary)]">
          Prête à faire le premier pas ?
        </h2>
        <p class="max-w-2xl text-[1.125rem] leading-[var(--leading-relaxed)] text-[color:var(--color-brand-secondary)]">
          Réservez votre appel découverte gratuit. En cas d’indisponibilité, choisissez simplement un autre créneau.
        </p>

        <div class="max-w-[22rem]">
          <PrimaryButton
            :to="ctaTo"
            label="Réserver mon appel découverte (offert)"
          />
        </div>
      </div>
    </section>
  </div>
</template>
