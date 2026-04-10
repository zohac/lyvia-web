<script setup lang="ts">
/**
 * CoachPageHub — Fiche synthétique pour la plateforme (YC2.4).
 *
 * Affichée sur keova.fr/coach/:slug quand le coach possède un domaine
 * white-label vérifié. But : éviter le contenu dupliqué (NFR-Y9) entre
 * la page plateforme et la page WL complète.
 *
 * Contenu affiché : photo, nom, titre/spécialité, bio courte (150 chars),
 * credentials, ville — et 2 CTAs proéminents :
 *   1. "Découvrir le site de {firstName}" → domaine WL
 *   2. "Réserver un appel découverte"     → booking WL ou plateforme
 *
 * Ce composant ne gère PAS de sections configurables (pas de sectionsConfig),
 * car c'est une fiche de redirection, pas une page de contenu.
 */
import type { PublicProviderProfile } from '~/features/seo/api/public-provider-profile.contract'
import { useCoachLink } from '~/composables/useCoachLink'

const props = defineProps<{
  profile: PublicProviderProfile
  domain: string
}>()

const links = computed(() => useCoachLink({
  slug: props.profile.slug,
  domain: props.domain
}))

const firstName = computed(() => props.profile.firstName || props.profile.displayName)

const bioShort = computed(() => {
  const source = props.profile.bio || ''
  if (source.length <= 150) return source
  return source.slice(0, 147).trimEnd() + '...'
})

const mainSpecialty = computed(() => props.profile.specialties?.[0] ?? null)

const credentialChips = computed(() => props.profile.credentials?.slice(0, 3) ?? [])
</script>

<template>
  <div class="min-h-screen bg-[color:var(--color-surface-page)]">
    <section class="px-6 py-24 sm:px-12 lg:px-20">
      <div class="mx-auto max-w-2xl text-center">
        <!-- Photo -->
        <div class="mx-auto mb-8 size-32 overflow-hidden rounded-full border-2 border-[color:var(--color-border-subtle)] shadow-sm">
          <NuxtImg
            v-if="profile.imageUrl"
            :src="profile.imageUrl"
            :alt="`${profile.displayName}, spécialiste accompagnement ménopause`"
            class="h-full w-full object-cover object-top"
            width="128"
            height="128"
            loading="eager"
          />
          <div
            v-else
            class="flex h-full w-full items-center justify-center bg-gradient-to-br from-[color:var(--color-surface-highlight)] to-[color:var(--color-surface-page)]"
          >
            <span class="font-serif text-4xl text-[color:var(--color-brand-primary)]/30">
              {{ profile.displayName.charAt(0) }}
            </span>
          </div>
        </div>

        <!-- Nom -->
        <h1 class="font-serif text-3xl leading-tight text-[color:var(--color-text-primary)] lg:text-4xl">
          {{ profile.displayName }}
        </h1>

        <!-- Spécialité -->
        <p
          v-if="mainSpecialty"
          class="mt-2 text-base text-[color:var(--color-brand-accent)]"
        >
          {{ mainSpecialty }}
        </p>

        <!-- Ville -->
        <p
          v-if="profile.city"
          class="mt-2 flex items-center justify-center gap-1.5 text-sm text-[color:var(--color-brand-secondary)]"
        >
          <UIcon
            name="i-lucide-map-pin"
            class="size-4 text-[color:var(--color-brand-accent)]"
          />
          {{ profile.city }}
          <template v-if="profile.region">
            · {{ profile.region }}
          </template>
        </p>

        <!-- Credentials -->
        <div
          v-if="credentialChips.length"
          class="mt-5 flex flex-wrap justify-center gap-2"
        >
          <span
            v-for="cred in credentialChips"
            :key="cred.title"
            class="inline-flex items-center gap-1.5 rounded-full border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface-card)] px-3 py-1.5 text-xs text-[color:var(--color-brand-secondary)]"
          >
            <UIcon
              v-if="cred.verified"
              name="i-lucide-badge-check"
              class="size-3.5 text-[color:var(--color-brand-accent)]"
            />
            {{ cred.title }}
          </span>
        </div>

        <!-- Bio courte -->
        <p
          v-if="bioShort"
          class="mx-auto mt-6 max-w-lg text-base leading-relaxed text-[color:var(--color-brand-secondary)]"
        >
          {{ bioShort }}
        </p>

        <!-- 2 CTAs -->
        <div class="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <UButton
            :to="links.site"
            color="secondary"
            variant="solid"
            size="xl"
            trailing-icon="i-lucide-arrow-right"
            external
          >
            Découvrir le site de {{ firstName }}
          </UButton>
          <UButton
            :to="links.booking"
            color="neutral"
            variant="outline"
            size="xl"
            external
          >
            Réserver un appel découverte
          </UButton>
        </div>
      </div>
    </section>

    <!-- Disclaimer médical (toujours visible — FR-Y9) -->
    <AtomsMedicalDisclaimer />
  </div>
</template>
