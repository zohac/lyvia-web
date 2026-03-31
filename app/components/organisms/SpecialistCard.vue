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
  return bio.length > 150 ? `${bio.slice(0, 147)}...` : bio
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
  <div class="specialist-card group relative w-full max-w-sm overflow-hidden rounded-[2rem] border border-white/40 p-7 backdrop-blur-md transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_24px_64px_rgba(91,75,110,0.15)]">
    <!-- Animated warm glow on hover -->
    <div
      class="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full opacity-0 transition-all duration-700 group-hover:opacity-100"
      style="background: radial-gradient(circle, rgba(212,149,106,0.25), transparent 70%); filter: blur(40px);"
      aria-hidden="true"
    />
    <div
      class="pointer-events-none absolute -bottom-12 -left-12 size-40 rounded-full opacity-0 transition-all duration-700 group-hover:opacity-100"
      style="background: radial-gradient(circle, rgba(122,107,142,0.15), transparent 70%); filter: blur(40px);"
      aria-hidden="true"
    />

    <div class="relative z-10 flex flex-col gap-5">
      <!-- Avatar with glow ring -->
      <div class="flex items-start justify-between">
        <div class="relative">
          <!-- Glow ring — visible on hover -->
          <div
            class="absolute -inset-1 rounded-full bg-gradient-to-br from-[#d4956a] to-[#7a6b8e] opacity-0 blur-sm transition-opacity duration-500 group-hover:opacity-50"
            aria-hidden="true"
          />
          <div
            v-if="provider.profilePhotoUrl"
            class="relative size-20 overflow-hidden rounded-full border-[3px] border-white shadow-lg transition-transform duration-500 group-hover:scale-110"
          >
            <NuxtImg
              :src="provider.profilePhotoUrl"
              :alt="provider.profilePhotoAlt || provider.displayName"
              class="size-full object-cover"
              loading="lazy"
              :width="80"
              :height="80"
            />
          </div>
          <div
            v-else
            class="relative grid size-20 place-items-center rounded-full border-[3px] border-white bg-gradient-to-br from-[#d4956a] to-[#7a6b8e] text-xl font-bold text-white shadow-lg transition-transform duration-500 group-hover:scale-110"
          >
            {{ initials }}
          </div>
        </div>

        <!-- Specialty badges — float up on hover -->
        <div class="flex max-w-[55%] flex-wrap justify-end gap-1.5">
          <span
            v-for="(s, i) in topSpecialties"
            :key="s"
            class="rounded-full border border-[#d4956a]/15 bg-white/90 px-3 py-1 text-xs font-medium text-[#5b4b6e] shadow-sm backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
            :style="{ transitionDelay: `${i * 50}ms` }"
          >
            {{ s }}
          </span>
        </div>
      </div>

      <!-- Name + city -->
      <div class="space-y-1">
        <h3 class="font-serif text-2xl font-bold text-[#3d3250] transition-colors duration-300 group-hover:text-[#d4956a]">
          {{ provider.displayName }}
        </h3>
        <div
          v-if="provider.city"
          class="flex items-center gap-1.5 text-sm text-[#7a6b8e]"
        >
          <UIcon
            name="i-lucide-map-pin"
            class="size-3.5"
          />
          <span>{{ provider.city }}</span>
        </div>
      </div>

      <!-- Bio — glass inset -->
      <div
        v-if="truncatedBio"
        class="rounded-xl bg-white/50 p-4 shadow-inner shadow-black/[0.02] backdrop-blur-sm transition-all duration-500 group-hover:bg-white/70"
      >
        <p class="text-sm leading-relaxed text-[#5a5068]">
          {{ truncatedBio }}
        </p>
      </div>

      <!-- CTAs — warm primary + ghost secondary -->
      <div class="flex flex-col gap-2.5">
        <NuxtLink
          :to="profileUrl"
          :external="!!provider.customDomain"
          :target="provider.customDomain ? '_blank' : undefined"
          :rel="provider.customDomain ? 'noopener noreferrer' : undefined"
          class="group/cta relative flex w-full cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-[#d4956a] to-[#c8845e] py-3.5 text-sm font-semibold text-white shadow-md shadow-[#d4956a]/20 transition-all duration-300 hover:shadow-lg hover:shadow-[#d4956a]/30 hover:brightness-105 active:scale-[0.98]"
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
          class="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-[#d4956a]/20 bg-white/60 py-3 text-sm font-medium text-[#5b4b6e] backdrop-blur-sm transition-all duration-300 hover:border-[#d4956a]/40 hover:bg-[#d4956a]/5 hover:text-[#d4956a]"
        >
          <UIcon
            name="i-lucide-calendar"
            class="size-4"
          />
          <span>Appel gratuit · 15 min</span>
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<style scoped>
.specialist-card {
  background: linear-gradient(
    145deg,
    rgba(255, 255, 255, 0.85) 0%,
    rgba(253, 248, 244, 0.9) 35%,
    rgba(243, 237, 247, 0.85) 70%,
    rgba(250, 246, 251, 0.9) 100%
  );
  box-shadow:
    0 4px 24px rgba(91, 75, 110, 0.06),
    inset 0 1px 0 rgba(255, 255, 255, 0.6);
}
</style>
