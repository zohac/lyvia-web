<script setup lang="ts">
import type { PublicTenantResponse } from '../../features/onboarding/api/onboarding.contract'

defineProps<{
  tenant: PublicTenantResponse
  ctaTo: string
  ctaLabel?: string
}>()
</script>

<template>
  <section
    id="essence"
    class="relative flex min-h-[100svh] items-center justify-center overflow-hidden px-6 py-24 sm:px-12 lg:px-20"
  >
    <div
      aria-hidden="true"
      class="pointer-events-none absolute inset-0"
    >
      <div class="absolute inset-0 bg-[radial-gradient(circle_at_10%_15%,rgba(212,184,160,0.30),transparent_58%)]" />
      <div class="absolute inset-0 bg-[radial-gradient(circle_at_90%_70%,rgba(181,192,163,0.18),transparent_55%)]" />
    </div>

    <div class="relative z-10 w-full max-w-[1200px] grid gap-12 lg:grid-cols-2 lg:items-center">
      <div class="order-2 grid gap-8 text-center lg:order-1 lg:text-left">
        <h1 class="font-serif text-5xl italic leading-[1.1] text-[color:var(--color-brand-primary)] sm:text-6xl lg:text-7xl xl:text-8xl">
          Naviguez la
          <br>
          <span
            class="not-italic text-transparent bg-clip-text"
            :style="{ backgroundImage: 'linear-gradient(90deg,var(--color-kaora-500),var(--color-kaora-700))' }"
          >
            ménopause
          </span>
          <br>
          avec confiance.
        </h1>

        <p class="mx-auto max-w-lg text-lg font-light leading-[var(--leading-relaxed)] text-[color:var(--color-brand-secondary)] sm:text-xl lg:mx-0">
          Une expérience sereine pour les femmes qui se redécouvrent. Loin des clichés médicaux, un sanctuaire pour votre équilibre.
        </p>

        <div class="grid gap-4 pt-2 sm:flex sm:justify-center lg:justify-start">
          <NuxtLink
            :to="ctaTo"
            class="group inline-flex items-center justify-center rounded-full bg-[color:var(--color-accent-main)] px-8 py-4 text-base font-bold text-[color:var(--color-accent-contrast)] shadow-floating transition-base hover:brightness-110"
          >
            <span class="flex items-center gap-2">
              {{ ctaLabel ?? 'Appel découverte gratuit' }}
              <Icon
                name="lucide:arrow-right"
                size="18"
                class="transition-transform group-hover:translate-x-1"
                aria-hidden="true"
              />
            </span>
          </NuxtLink>

          <a
            href="#parcours"
            class="inline-flex items-center justify-center gap-2 rounded-full px-8 py-4 font-medium text-[color:var(--color-brand-primary)] hover:text-[color:var(--color-brand-accent)] transition-base"
          >
            <Icon
              name="lucide:play-circle"
              size="20"
              aria-hidden="true"
            />
            Voir le manifeste
          </a>
        </div>

        <p class="text-sm text-[color:var(--color-brand-muted)]">
          Fuseau : {{ tenant.timezone }} · Sans engagement.
        </p>
      </div>

      <div class="order-1 relative flex h-[50vh] items-center justify-center lg:order-2 lg:h-[80vh]">
        <div
          class="blob-shape absolute inset-0 bg-cover bg-center opacity-95 shadow-floating transition-all duration-[1200ms] ease-out hover:rotate-2 scale-95 hover:scale-100"
          style="background-image:url('/images/coach-hero-texture.svg')"
          aria-hidden="true"
        />
        <div class="pointer-events-none absolute -bottom-10 -left-10 grid h-32 w-32 place-items-center rounded-full bg-white/35 shadow-soft backdrop-blur-md">
          <span class="font-serif text-xs uppercase tracking-widest text-[color:var(--color-brand-primary)]">
            Sérénité
          </span>
        </div>
      </div>
    </div>

    <div class="pointer-events-none absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce text-[color:var(--color-brand-muted)]">
      <div class="flex flex-col items-center gap-2">
        <span class="text-xs uppercase tracking-widest">
          Explorer
        </span>
        <Icon
          name="lucide:chevron-down"
          size="18"
          aria-hidden="true"
        />
      </div>
    </div>
  </section>
</template>
