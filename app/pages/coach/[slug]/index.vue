<script setup lang="ts">
import type { PublicTenantResponse } from '../../../features/onboarding/api/onboarding.contract'
import { ApiFetchError } from '../../../services/api/api-error'
import { apiFetch } from '../../../services/api/apiFetch'
import { setPublicHeader } from '../../../features/public/state/public-header.state'
import CoachPublicPageTemplate from '../../../components/templates/CoachPublicPageTemplate.vue'

definePageMeta({
  layout: 'public',
  publicLayout: {
    fullBleed: true
  }
})

const route = useRoute()
const slug = computed(() => String(route.params.slug ?? '').trim())

if (!slug.value) {
  throw createError({ statusCode: 404, statusMessage: 'Coach introuvable' })
}

const { data: tenant } = await useAsyncData<PublicTenantResponse>(`public-tenant:${slug.value}`, async () => {
  try {
    return await apiFetch<PublicTenantResponse>('/public/tenant', {
      method: 'GET',
      withAuth: false,
      query: { slug: slug.value }
    })
  } catch (err: unknown) {
    if (err instanceof ApiFetchError && err.apiError.code === 'TENANT_NOT_FOUND') {
      throw createError({ statusCode: 404, statusMessage: 'Coach introuvable' })
    }
    throw err
  }
})

if (!tenant.value) {
  throw createError({ statusCode: 404, statusMessage: 'Coach introuvable' })
}

const requiredTenant = computed(() => tenant.value as PublicTenantResponse)

const ctaTo = computed(() => `/coach/${tenant.value?.slug ?? slug.value}/onboarding/discovery`)
const brandName = computed(() => tenant.value?.brand.displayName?.trim() || 'Coach')

useSeoMeta({
  title: () =>
    `${brandName.value} — Accompagnement péri-ménopause & ménopause | Appel gratuit 15 min`,
  description: () =>
    `${brandName.value} accompagne les femmes en péri-ménopause et ménopause avec une approche globale : alimentation, stress, sommeil et activité physique. Appel découverte gratuit 15 min, sans engagement.`,
  ogTitle: () =>
    `${brandName.value} — Coaching ménopause & péri-ménopause`,
  ogDescription: () =>
    'Vous traversez la péri-ménopause ou la ménopause ? Fatigue, insomnies, prise de poids, irritabilité… Bénéficiez d’un accompagnement global et personnalisé. Réservez votre appel gratuit de 15 min.',
  ogType: 'website',
  twitterCard: 'summary_large_image'
})

watchEffect(() => {
  setPublicHeader({
    variant: 'coach',
    layoutStyle: 'dock',
    brandLabel: 'Kaora',
    brandTo: '/',
    showBrandIcon: true,
    navLinks: [
      { label: 'L\'Essence', href: '#essence' },
      { label: 'Accompagnement', href: '#accompagnement' },
      { label: 'Sophie', href: '#qui-suis-je' }
    ],
    loginLabel: 'Se connecter',
    loginTo: '/login',
    ctaLabel: 'Réserver',
    ctaTo: ctaTo.value
  })
})
</script>

<template>
  <CoachPublicPageTemplate
    :tenant="requiredTenant"
    :cta-to="ctaTo"
  />
</template>
