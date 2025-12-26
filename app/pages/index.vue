<script setup lang="ts">
import type { PublicTenantResponse } from '../features/onboarding/api/onboarding.contract'
import { ApiFetchError } from '../services/api/api-error'
import { apiFetch } from '../services/api/apiFetch'
import CoachPublicPageTemplate from '../components/templates/CoachPublicPageTemplate.vue'
import MarketingLandingB2B from '../components/templates/MarketingLandingB2B.vue'

definePageMeta({
  layout: 'public',
  publicLayout: {
    fullBleed: true,
    hideHeader: true,
    hideFooter: true
  }
})

const { data: tenant } = await useAsyncData<PublicTenantResponse | null>('public-tenant-home', async () => {
  try {
    return await apiFetch<PublicTenantResponse>('/public/tenant', {
      method: 'GET',
      withAuth: false
    })
  } catch (err: unknown) {
    if (err instanceof ApiFetchError && (err.apiError.code === 'TENANT_NOT_FOUND' || err.apiError.code === 'SLUG_REQUIRED')) {
      return null
    }
    return null
  }
}, { default: () => null })

useSeoMeta({
  title: () => tenant.value?.brand.displayName ? `${tenant.value.brand.displayName} — Appel découverte` : 'Livia — Coaching Platform',
  description: () =>
    tenant.value
      ? 'Réservez un appel découverte gratuit, sans engagement.'
      : 'Réservez vos rendez-vous, payez en ligne en toute sécurité, et accédez à des contenus utiles — dans une interface apaisante pensée pour durer.'
})

const currentYear = new Date().getFullYear()
</script>

<template>
  <div v-if="tenant">
    <header class="sticky top-0 z-40 border-b border-[color:var(--color-brand-subtle)]">
      <div class="glass-panel">
        <div class="mx-auto flex h-20 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
          <NuxtLink
            to="/"
            class="font-serif text-2xl italic tracking-tight transition-base"
            aria-label="Accueil"
          >
            {{ tenant.brand.displayName }}
          </NuxtLink>

          <div class="flex items-center gap-3">
            <NuxtLink
              to="/login"
              class="hidden rounded-full px-4 py-2 text-sm font-semibold text-[color:var(--color-brand-muted)] hover:text-[color:var(--color-brand-primary)] md:inline-flex transition-base"
            >
              Espace cliente
            </NuxtLink>

            <NuxtLink
              to="/onboarding/discovery"
              class="inline-flex h-11 items-center justify-center rounded-full bg-[color:var(--color-accent-main)] px-6 text-sm font-bold text-[color:var(--color-accent-contrast)] shadow-[var(--shadow-floating)] transition-base hover:brightness-110 active:scale-[0.99]"
            >
              Prendre RDV
            </NuxtLink>
          </div>
        </div>
      </div>
    </header>

    <CoachPublicPageTemplate
      :tenant="tenant"
      cta-to="/onboarding/discovery"
    />

    <footer class="border-t border-[color:var(--color-brand-subtle)] bg-[color:var(--color-surface-card)]">
      <div class="mx-auto flex w-full max-w-6xl flex-col gap-2 px-4 py-10 text-center text-sm text-[color:var(--color-brand-muted)] sm:px-6">
        <p class="font-semibold uppercase tracking-widest">
          © {{ currentYear }} {{ tenant.brand.displayName }}
        </p>
      </div>
    </footer>
  </div>

  <MarketingLandingB2B v-else />
</template>
