<script setup lang="ts">
/**
 * CoachVisuelBio — Section Qui suis-je pour le template Visuel.
 *
 * Design : Card élégante avec coins arrondis 32px.
 * À gauche : photo secondaire, portrait ou image d'ambiance de secours.
 * Cas sans photo : repli responsive harmonieux.
 * À droite : titre, qualifications, certifications pilules et texte de présentation.
 */
import type { PublicProviderProfile } from '~/features/seo/api/public-provider-profile.contract'
import { useScrollReveal } from '~/composables/useScrollReveal'

const props = defineProps<{
  coachProfile: PublicProviderProfile | null
  coachName: string
  eyebrow?: string
  title?: string
}>()

const { reveal } = useScrollReveal()

const FALLBACK_BIO = [
  'Spécialiste de l\'accompagnement des femmes pendant la transition de la ménopause, je vous propose un espace d\'écoute bienveillant et des solutions naturelles adaptées à votre quotidien.'
]

const bioParagraphs = computed<string[]>(() => {
  const long = props.coachProfile?.longBio
  if (long?.trim()) return long.split('\n\n').filter(Boolean)
  const bio = props.coachProfile?.bio
  if (bio?.trim()) return [bio.trim()]
  return FALLBACK_BIO
})

const credentialLine = computed(() => {
  const creds = props.coachProfile?.credentials ?? []
  const city = props.coachProfile?.city
  const parts: string[] = []
  if (creds.length && creds[0]?.title) parts.push(creds[0].title)
  if (city) parts.push(`${city} & visio`)
  else parts.push('100 % en visio')
  return parts.join(' · ')
})

const photoSrc = computed(() => {
  return (
    props.coachProfile?.secondaryPhotoUrl
    || props.coachProfile?.imageUrl
    || '/images/templates/visuel/bio-default.webp'
  )
})
const displayedCredentials = computed(() => {
  return props.coachProfile?.credentials ?? []
})
</script>

<template>
  <section
    id="qui-suis-je"
    v-bind="reveal()"
    class="scroll-reveal bg-[color:var(--color-surface-page)] px-6 py-20 sm:px-12 sm:py-28 lg:px-16"
  >
    <div class="mx-auto max-w-6xl">
      <div class="overflow-hidden rounded-3xl border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface-card)] shadow-xl lg:grid lg:grid-cols-12">
        <!-- Photo gauche -->
        <div class="relative min-h-[320px] lg:col-span-5 lg:min-h-[480px]">
          <img
            :src="photoSrc"
            :alt="coachName"
            class="h-full w-full object-cover object-top"
            loading="lazy"
            width="480"
            height="560"
            @error="($event.target as HTMLImageElement).src = '/images/templates/visuel/bio-default.webp'"
          >
        </div>

        <!-- Contenu bio droite -->
        <div class="flex flex-col justify-center p-8 sm:p-12 lg:col-span-7 lg:p-16">
          <span class="text-xs font-bold uppercase tracking-[0.2em] text-[color:var(--color-brand-primary)]">
            {{ eyebrow || 'Qui suis-je' }}
          </span>

          <h2 class="mt-3 font-serif text-3xl font-semibold leading-tight text-[color:var(--color-text-primary)] sm:text-4xl">
            {{ title || coachName }}
          </h2>

          <p class="mt-2 text-base font-semibold text-[color:var(--color-brand-accent)]">
            {{ credentialLine }}
          </p>

          <div class="mt-6 space-y-4 text-base leading-relaxed text-[color:var(--color-brand-secondary)]">
            <p
              v-for="(para, idx) in bioParagraphs"
              :key="idx"
            >
              {{ para }}
            </p>
          </div>

          <!-- Badges certifications & parcours -->
          <div class="mt-8 flex flex-wrap gap-2.5">
            <span
              v-for="(cred, i) in displayedCredentials"
              :key="i"
              class="inline-flex items-center gap-1.5 rounded-full border border-[color:var(--color-brand-primary)]/20 bg-[color:var(--color-brand-primary)]/5 px-3.5 py-1.5 text-xs font-semibold text-[color:var(--color-brand-primary)]"
            >
              <UIcon
                name="i-lucide-award"
                class="size-3.5 text-[color:var(--color-brand-accent)]"
              />
              {{ cred.title }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
