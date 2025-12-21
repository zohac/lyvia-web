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
  <section class="grid gap-10 lg:grid-cols-2 lg:items-center">
    <div class="grid gap-6">
      <div class="grid gap-3">
        <p class="text-sm font-semibold uppercase tracking-[0.14em] text-[color:var(--color-brand-secondary)]">
          Appel découverte • Offert • Sans engagement
        </p>
        <h1 class="font-serif text-[2.25rem] font-bold leading-[var(--leading-tight)] tracking-[-0.01em] text-[color:var(--color-brand-primary)] sm:text-[3rem]">
          Réservez votre appel découverte avec {{ coachName }}
        </h1>
        <p class="max-w-xl text-[1.125rem] leading-[var(--leading-relaxed)] text-[color:var(--color-brand-secondary)]">
          15 minutes pour faire le point, poser vos questions, et voir si l’accompagnement vous correspond — en toute simplicité.
        </p>
      </div>

      <div class="grid gap-3 sm:max-w-[22rem]">
        <PrimaryButton
          :to="ctaTo"
          :label="ctaLabel ?? 'Réserver mon appel découverte (offert)'"
        />

        <p class="text-sm leading-[var(--leading-relaxed)] text-[color:var(--color-brand-secondary)]">
          Fuseau : {{ tenant.timezone }} · Aucune carte bancaire demandée.
        </p>
      </div>
    </div>

    <div class="grid place-items-center">
      <div class="w-full max-w-[420px] rounded-[var(--radius-lg)] border border-[color:var(--color-brand-subtle)] bg-[color:var(--color-surface-card)] p-6 shadow-[var(--shadow-card)]">
        <div class="grid gap-4 sm:grid-cols-[92px_1fr] sm:items-center">
          <div
            class="grid h-[92px] w-[92px] place-items-center rounded-full bg-[color:var(--color-surface-highlight)] font-serif text-[1.75rem] font-bold text-[color:var(--color-brand-primary)]"
            aria-hidden="true"
          >
            {{ initials }}
          </div>

          <div class="grid gap-1">
            <p class="text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--color-brand-secondary)]">
              Profil coach
            </p>
            <p class="font-serif text-[1.5rem] font-semibold leading-[var(--leading-tight)] text-[color:var(--color-brand-primary)]">
              {{ coachName }}
            </p>
            <p class="text-sm text-[color:var(--color-brand-secondary)]">
              Photo & bio détaillées à venir (V0).
            </p>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
