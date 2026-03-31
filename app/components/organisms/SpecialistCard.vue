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
  return bio.length > 120 ? `${bio.slice(0, 117)}...` : bio
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
  <div class="specialist-card group relative w-full max-w-xs overflow-hidden rounded-[2rem] pb-6 pt-8 transition-all duration-500 hover:-translate-y-3 hover:shadow-[0_32px_80px_rgba(91,75,110,0.18)]">
    <!-- Warm glow behind card on hover -->
    <div
      class="pointer-events-none absolute -inset-4 -z-10 rounded-[3rem] opacity-0 transition-opacity duration-700 group-hover:opacity-100"
      style="background: radial-gradient(ellipse at 50% 40%, rgba(212,149,106,0.15), transparent 70%); filter: blur(30px);"
      aria-hidden="true"
    />

    <!-- === PHOTO HERO — the person IS the card === -->
    <div class="flex flex-col items-center px-6">
      <div class="relative">
        <!-- Glow ring on hover -->
        <div
          class="absolute -inset-2 rounded-full opacity-0 transition-all duration-600 group-hover:opacity-100"
          style="background: conic-gradient(from 180deg, rgba(212,149,106,0.4), rgba(122,107,142,0.3), rgba(212,149,106,0.4)); filter: blur(8px);"
          aria-hidden="true"
        />
        <!-- Avatar -->
        <div
          v-if="provider.profilePhotoUrl"
          class="relative size-36 overflow-hidden rounded-full border-4 border-white shadow-xl transition-transform duration-500 group-hover:scale-105 sm:size-40"
        >
          <NuxtImg
            :src="provider.profilePhotoUrl"
            :alt="provider.profilePhotoAlt || provider.displayName"
            class="size-full object-cover"
            loading="lazy"
            :width="160"
            :height="160"
          />
        </div>
        <div
          v-else
          class="relative grid size-36 place-items-center rounded-full border-4 border-white bg-gradient-to-br from-[#d4956a] to-[#7a6b8e] text-4xl font-bold text-white shadow-xl transition-transform duration-500 group-hover:scale-105 sm:size-40"
        >
          {{ initials }}
        </div>
      </div>

      <!-- Name — big, serif, warm on hover -->
      <h3 class="mt-5 text-center font-serif text-2xl font-bold leading-tight text-[#3d3250] transition-colors duration-300 group-hover:text-[#d4956a]">
        {{ provider.displayName }}
      </h3>

      <!-- City -->
      <div
        v-if="provider.city"
        class="mt-1.5 flex items-center gap-1 text-sm text-[#857d8c]"
      >
        <UIcon
          name="i-lucide-map-pin"
          class="size-3.5"
        />
        <span>{{ provider.city }}</span>
      </div>
    </div>

    <!-- Divider -->
    <div class="mx-8 my-5 h-px bg-gradient-to-r from-transparent via-[#d4956a]/20 to-transparent" />

    <!-- Specialties — floating pills -->
    <div class="flex flex-wrap justify-center gap-1.5 px-5">
      <span
        v-for="(s, i) in topSpecialties"
        :key="s"
        class="rounded-full border border-[#d4956a]/12 bg-[#d4956a]/6 px-3 py-1 text-xs font-medium text-[#6b5a4e] transition-all duration-300 hover:-translate-y-0.5 hover:border-[#d4956a]/25 hover:shadow-sm"
        :style="{ transitionDelay: `${i * 40}ms` }"
      >
        {{ s }}
      </span>
    </div>

    <!-- Bio — compact -->
    <p
      v-if="truncatedBio"
      class="mx-6 mt-4 text-center text-sm leading-relaxed text-[#6b6177]"
    >
      {{ truncatedBio }}
    </p>

    <!-- CTAs -->
    <div class="mx-5 mt-5 flex flex-col gap-2">
      <NuxtLink
        :to="profileUrl"
        :external="!!provider.customDomain"
        :target="provider.customDomain ? '_blank' : undefined"
        :rel="provider.customDomain ? 'noopener noreferrer' : undefined"
        class="group/cta relative flex w-full cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-full bg-gradient-to-r from-[#d4956a] to-[#c8845e] py-3 text-sm font-semibold text-white shadow-md shadow-[#d4956a]/20 transition-all duration-300 hover:shadow-lg hover:shadow-[#d4956a]/30 hover:brightness-105 active:scale-[0.97]"
      >
        <span class="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-600 group-hover/cta:translate-x-full" />
        <span class="relative flex items-center gap-2">
          Voir le profil
          <UIcon
            name="i-lucide-arrow-right"
            class="size-4 transition-transform duration-300 group-hover/cta:translate-x-0.5"
          />
        </span>
      </NuxtLink>
      <NuxtLink
        :to="bookingUrl"
        :external="!!provider.customDomain"
        :target="provider.customDomain ? '_blank' : undefined"
        :rel="provider.customDomain ? 'noopener noreferrer' : undefined"
        class="flex w-full cursor-pointer items-center justify-center gap-2 rounded-full border border-[#d4956a]/15 bg-white/50 py-2.5 text-sm font-medium text-[#5b4b6e] backdrop-blur-sm transition-all duration-300 hover:border-[#d4956a]/30 hover:text-[#d4956a]"
      >
        <UIcon
          name="i-lucide-phone"
          class="size-3.5"
        />
        <span>Appel gratuit · 15 min</span>
      </NuxtLink>
    </div>
  </div>
</template>

<style scoped>
.specialist-card {
  background: linear-gradient(
    170deg,
    rgba(255, 255, 255, 0.92) 0%,
    rgba(253, 248, 244, 0.95) 40%,
    rgba(250, 246, 251, 0.92) 100%
  );
  box-shadow:
    0 8px 32px rgba(91, 75, 110, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.7);
  border: 1px solid rgba(212, 149, 106, 0.1);
}
</style>
