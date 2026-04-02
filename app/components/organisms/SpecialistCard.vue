<script setup lang="ts">
import type { FeaturedProvider } from '~/features/seo/api/featured-provider.contract'

export type { FeaturedProvider } from '~/features/seo/api/featured-provider.contract'

const props = defineProps<{
  provider: FeaturedProvider
}>()

const initials = computed(() => {
  const f = props.provider.firstName?.[0] || ''
  const l = props.provider.lastName?.[0] || ''
  return `${f}${l}`.toUpperCase()
})

const topSpecialties = computed(() => props.provider.specialties.slice(0, 3))

const truncatedBio = computed(() => {
  const bio = props.provider.bio || ''
  return bio.length > 100 ? `${bio.slice(0, 97)}...` : bio
})

const profileUrl = computed(() =>
  props.provider.customDomain
    ? `https://${props.provider.customDomain}`
    : `/coach/${props.provider.slug}`
)

const bookingUrl = computed(() =>
  props.provider.customDomain
    ? `https://${props.provider.customDomain}/onboarding/discovery`
    : `/coach/${props.provider.slug}/onboarding/discovery`
)
</script>

<template>
  <div class="specialist-card group relative h-[460px] w-full max-w-sm cursor-pointer overflow-hidden rounded-[2rem]">
    <!-- === PHOTO — full bleed, the person IS the card === -->
    <div class="absolute inset-0">
      <NuxtImg
        v-if="provider.profilePhotoUrl"
        :src="provider.profilePhotoUrl"
        :alt="provider.profilePhotoAlt || provider.displayName"
        class="size-full object-cover transition-all duration-700 will-change-transform group-hover:scale-110"
        loading="lazy"
        :width="400"
        :height="460"
      />
      <!-- Fallback: gradient + initials -->
      <div
        v-else
        class="flex size-full items-center justify-center bg-gradient-to-br from-[#5b4b6e] via-[#7a6b8e] to-[#d4956a]"
      >
        <span class="text-7xl font-bold text-white/80">{{ initials }}</span>
      </div>
    </div>

    <!-- Gradient overlay — always visible at bottom, expands on hover -->
    <div class="absolute inset-0 bg-gradient-to-t from-[#221d28] via-[#221d28]/60 to-transparent opacity-80 transition-opacity duration-500 group-hover:opacity-95" />

    <!-- === CONTENT — positioned at bottom, slides up on hover === -->
    <div class="absolute inset-x-0 bottom-0 flex flex-col p-6 transition-all duration-500">
      <!-- Specialties — hidden by default, appear on hover -->
      <div class="mb-3 flex flex-wrap gap-1.5 opacity-0 transition-all duration-500 group-hover:opacity-100">
        <span
          v-for="s in topSpecialties"
          :key="s"
          class="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium text-white/90 backdrop-blur-sm"
        >
          {{ s }}
        </span>
      </div>

      <!-- Name — always visible, big serif -->
      <h3 class="font-serif text-3xl font-bold leading-tight text-white drop-shadow-lg transition-all duration-500 sm:text-4xl">
        {{ provider.displayName }}
      </h3>

      <!-- City — always visible -->
      <div
        v-if="provider.city"
        class="mt-1.5 flex items-center gap-1.5 text-sm text-white/70"
      >
        <UIcon
          name="i-lucide-map-pin"
          class="size-3.5"
        />
        <span>{{ provider.city }}</span>
      </div>

      <!-- Bio — hidden, slides in on hover -->
      <p
        v-if="truncatedBio"
        class="mt-3 max-h-0 overflow-hidden text-sm leading-relaxed text-white/70 transition-all duration-500 group-hover:max-h-24"
      >
        {{ truncatedBio }}
      </p>

      <!-- CTAs — hidden, slide in on hover -->
      <div class="mt-4 flex max-h-0 gap-2.5 overflow-hidden transition-all duration-500 group-hover:max-h-16">
        <NuxtLink
          :to="profileUrl"
          :external="!!provider.customDomain"
          :target="provider.customDomain ? '_blank' : undefined"
          :rel="provider.customDomain ? 'noopener noreferrer' : undefined"
          class="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-full bg-[color:var(--color-surface-card)] py-3 text-sm font-semibold text-[#3d3250] shadow-lg transition-all duration-300 hover:bg-[#d4956a] hover:text-white active:scale-95"
        >
          Voir le profil
          <UIcon
            name="i-lucide-arrow-right"
            class="size-4"
          />
        </NuxtLink>
        <NuxtLink
          :to="bookingUrl"
          :external="!!provider.customDomain"
          :target="provider.customDomain ? '_blank' : undefined"
          :rel="provider.customDomain ? 'noopener noreferrer' : undefined"
          class="flex cursor-pointer items-center justify-center gap-2 rounded-full border border-white/25 bg-white/10 px-5 py-3 text-sm font-medium text-white backdrop-blur-sm transition-all duration-300 hover:border-white/50 hover:bg-white/20 active:scale-95"
        >
          <UIcon
            name="i-lucide-phone"
            class="size-3.5"
          />
          Appel gratuit
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<style scoped>
.specialist-card {
  box-shadow:
    0 8px 40px rgba(34, 29, 40, 0.2),
    0 2px 8px rgba(34, 29, 40, 0.1);
  transition:
    transform 0.5s cubic-bezier(0.16, 1, 0.3, 1),
    box-shadow 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}

.specialist-card:hover {
  transform: translateY(-8px);
  box-shadow:
    0 24px 80px rgba(34, 29, 40, 0.3),
    0 8px 24px rgba(212, 149, 106, 0.1);
}

@media (prefers-reduced-motion: reduce) {
  .specialist-card,
  .specialist-card * {
    transition-duration: 0ms !important;
  }
}
</style>
