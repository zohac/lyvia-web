<script setup lang="ts">
import type { PublicTenantResponse } from '../../features/onboarding/api/onboarding.contract'
import CoachHeroProfile from '../organisms/CoachHeroProfile.vue'

defineProps<{
  tenant: PublicTenantResponse
  ctaTo: string
}>()
</script>

<template>
  <div class="bg-[color:var(--color-surface-page)]">
    <div class="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
      <CoachHeroProfile
        :tenant="tenant"
        :cta-to="ctaTo"
      />
    </div>

    <!-- Empathy / Problem-Solution -->
    <section class="mx-auto w-full max-w-6xl px-4 pb-12 sm:px-6 sm:pb-16">
      <div class="rounded-[var(--radius-organic)] bg-[color:var(--color-surface-card)] p-10 shadow-[var(--shadow-card)]">
        <h2 class="text-center font-serif text-3xl italic tracking-tight text-[color:var(--color-brand-primary)]">
          Vous ne vous reconnaissez plus ?
        </h2>
        <p class="mx-auto mt-3 max-w-2xl text-center text-[color:var(--color-brand-secondary)]">
          Une approche douce, structurée, et réaliste — pour retrouver de la clarté et avancer sans pression.
        </p>

        <div class="mt-10 grid gap-6 md:grid-cols-3">
          <div class="grid gap-2 rounded-[var(--radius-input)] bg-[color:var(--color-surface-highlight)] p-6">
            <p class="font-semibold text-[color:var(--color-brand-primary)]">
              Le corps
            </p>
            <p class="text-sm leading-[var(--leading-relaxed)] text-[color:var(--color-brand-secondary)]">
              Fatigue, dérèglements, sommeil… on remet de l’ordre dans l’essentiel.
            </p>
          </div>
          <div class="grid gap-2 rounded-[var(--radius-input)] bg-[color:var(--color-surface-highlight)] p-6">
            <p class="font-semibold text-[color:var(--color-brand-primary)]">
              L’esprit
            </p>
            <p class="text-sm leading-[var(--leading-relaxed)] text-[color:var(--color-brand-secondary)]">
              Charge mentale, anxiété, irritabilité… on pose un cadre apaisant.
            </p>
          </div>
          <div class="grid gap-2 rounded-[var(--radius-input)] bg-[color:var(--color-surface-highlight)] p-6">
            <p class="font-semibold text-[color:var(--color-brand-primary)]">
              La solution
            </p>
            <p class="text-sm leading-[var(--leading-relaxed)] text-[color:var(--color-brand-secondary)]">
              Des actions simples, des habitudes soutenables, et un suivi humain.
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- About -->
    <section class="mx-auto w-full max-w-6xl px-4 pb-12 sm:px-6 sm:pb-16">
      <div class="grid gap-10 lg:grid-cols-2 lg:items-center">
        <div class="relative overflow-hidden rounded-[var(--radius-organic)] bg-[color:var(--color-surface-card)] p-8 shadow-[var(--shadow-card)]">
          <div
            aria-hidden="true"
            class="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(213,184,160,0.25),transparent_55%)]"
          />
          <div class="relative grid gap-4">
            <h2 class="font-serif text-3xl italic tracking-tight text-[color:var(--color-brand-primary)]">
              Je suis {{ tenant.brand.displayName }}.
            </h2>
            <p class="text-[color:var(--color-brand-secondary)]">
              Ici, la bio et les spécialités seront branchées dès que l’API les expose. En V0, on privilégie une page claire, rassurante, et orientée action.
            </p>
            <blockquote class="border-l-4 border-[color:var(--color-brand-solid)] pl-6 font-serif text-xl italic text-[color:var(--color-brand-primary)]">
              « Mon objectif est de vous aider à retrouver un rythme qui vous ressemble, pas de vous imposer une perfection. »
            </blockquote>
          </div>
        </div>

        <div class="grid gap-4">
          <h3 class="font-serif text-2xl italic text-[color:var(--color-brand-primary)]">
            Comment nous allons avancer ensemble
          </h3>
          <ol class="grid gap-4">
            <li class="flex gap-4 rounded-[var(--radius-input)] bg-[color:var(--color-surface-card)] p-6 shadow-[var(--shadow-card)]">
              <div class="grid h-10 w-10 place-items-center rounded-full bg-[rgba(213,184,160,0.22)] font-bold text-[color:var(--color-brand-primary)]">
                1
              </div>
              <div class="grid gap-1">
                <p class="font-semibold text-[color:var(--color-brand-primary)]">
                  L’appel (offert)
                </p>
                <p class="text-sm text-[color:var(--color-brand-secondary)]">
                  On fait connaissance, on clarifie votre besoin, et on répond à vos questions.
                </p>
              </div>
            </li>
            <li class="flex gap-4 rounded-[var(--radius-input)] bg-[color:var(--color-surface-card)] p-6 shadow-[var(--shadow-card)]">
              <div class="grid h-10 w-10 place-items-center rounded-full bg-[rgba(213,184,160,0.22)] font-bold text-[color:var(--color-brand-primary)]">
                2
              </div>
              <div class="grid gap-1">
                <p class="font-semibold text-[color:var(--color-brand-primary)]">
                  Le plan
                </p>
                <p class="text-sm text-[color:var(--color-brand-secondary)]">
                  Si c’est pertinent, on construit une trajectoire simple et réaliste.
                </p>
              </div>
            </li>
            <li class="flex gap-4 rounded-[var(--radius-input)] bg-[color:var(--color-surface-card)] p-6 shadow-[var(--shadow-card)]">
              <div class="grid h-10 w-10 place-items-center rounded-full bg-[rgba(213,184,160,0.22)] font-bold text-[color:var(--color-brand-primary)]">
                3
              </div>
              <div class="grid gap-1">
                <p class="font-semibold text-[color:var(--color-brand-primary)]">
                  Le suivi
                </p>
                <p class="text-sm text-[color:var(--color-brand-secondary)]">
                  Un accompagnement progressif, avec des ajustements et des ressources utiles.
                </p>
              </div>
            </li>
          </ol>
        </div>
      </div>
    </section>

    <!-- CTA close -->
    <section class="mx-auto w-full max-w-6xl px-4 pb-16 sm:px-6 sm:pb-24">
      <div class="grid gap-6 rounded-[var(--radius-organic)] bg-[rgba(213,184,160,0.22)] p-10 shadow-[var(--shadow-card)]">
        <h2 class="font-serif text-3xl italic tracking-tight text-[color:var(--color-brand-primary)]">
          Prête à faire le premier pas ?
        </h2>
        <p class="max-w-2xl text-[color:var(--color-brand-secondary)]">
          Réservez votre appel découverte offert. Sans engagement, en toute simplicité.
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
