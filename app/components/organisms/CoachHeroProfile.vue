<script setup lang="ts">
import type { PublicTenantResponse } from '../../features/onboarding/api/onboarding.contract'
import PrimaryButton from '../atoms/PrimaryButton.vue'

const props = defineProps<{
  tenant: PublicTenantResponse
  ctaTo: string
  ctaLabel?: string
}>()

const coachName = computed(() => props.tenant.brand.displayName)

const initials = computed(() => {
  const name = coachName.value.trim()
  if (!name) return 'C'
  const parts = name.split(/\s+/).filter(Boolean)
  const first = parts.at(0)?.[0] ?? 'C'
  const second = parts.length > 1 ? parts.at(-1)?.[0] : parts.at(0)?.[1]
  return `${first}${second ?? ''}`.toUpperCase()
})
</script>

<template>
  <section class="grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
    <div class="grid gap-7">
      <div class="grid gap-4">
        <span class="text-xs font-bold uppercase tracking-widest text-[color:var(--color-brand-muted)]">
          Coaching & bien-être
        </span>

        <h1 class="font-serif text-[2.5rem] italic leading-[1.05] tracking-[-0.02em] text-[color:var(--color-brand-primary)] sm:text-[3.75rem]">
          Vivez votre parcours avec
          <span class="text-[color:var(--color-brand-accent)]">sérénité</span>.
        </h1>

        <p class="max-w-xl text-[1.125rem] leading-[var(--leading-relaxed)] text-[color:var(--color-brand-secondary)]">
          Un accompagnement humain, clair et structuré. Réservez un appel découverte offert pour faire le point et voir comment avancer ensemble.
        </p>
      </div>

      <div class="grid gap-4 sm:flex sm:items-center sm:gap-6">
        <div class="w-full sm:w-auto sm:min-w-[18rem]">
          <PrimaryButton
            :to="ctaTo"
            :label="ctaLabel ?? 'Réserver mon appel découverte (offert)'"
          />
        </div>

        <div class="grid gap-2 text-sm text-[color:var(--color-brand-secondary)]">
          <p class="font-semibold text-[color:var(--color-brand-primary)]">
            ⭐ 5.0/5
            <span class="text-[color:var(--color-brand-muted)]">(exemple V0)</span>
          </p>
          <p>
            Fuseau : {{ tenant.timezone }} · Sans engagement.
          </p>
        </div>
      </div>
    </div>

    <div class="grid place-items-center">
      <div class="relative w-full max-w-[460px] overflow-hidden rounded-[var(--radius-organic)] border border-[rgba(255,255,255,0.6)] bg-[color:var(--color-surface-card)] shadow-[var(--shadow-card)]">
        <div
          aria-hidden="true"
          class="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(213,184,160,0.35),transparent_60%)]"
        />
        <div class="relative grid gap-4 p-8">
          <div class="flex items-center gap-4">
            <div
              class="grid h-16 w-16 place-items-center rounded-full bg-[rgba(213,184,160,0.22)] font-serif text-2xl italic text-[color:var(--color-brand-primary)]"
              aria-hidden="true"
            >
              {{ initials }}
            </div>

            <div class="min-w-0">
              <p class="truncate font-serif text-2xl italic text-[color:var(--color-brand-primary)]">
                {{ coachName }}
              </p>
              <p class="text-sm text-[color:var(--color-brand-muted)]">
                Profil public (V0)
              </p>
            </div>
          </div>

          <p class="text-sm leading-[var(--leading-relaxed)] text-[color:var(--color-brand-secondary)]">
            Photo & présentation détaillées seront branchées dès que l’API expose bio/spécialités.
          </p>
        </div>
      </div>
    </div>
  </section>
</template>
