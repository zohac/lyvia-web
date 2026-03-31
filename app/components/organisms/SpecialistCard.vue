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
  <div class="specialist-card group relative w-full overflow-hidden rounded-3xl p-6 shadow-lg transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl">
    <!-- Radial glow background -->
    <div
      class="absolute inset-0 -z-0"
      style="background: radial-gradient(circle at 20% 50%, rgba(212,149,106,0.08) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(122,107,142,0.06) 0%, transparent 50%);"
    />

    <!-- Decorative blurs — hover amplified -->
    <div
      class="absolute -bottom-10 -right-10 size-36 rounded-full bg-gradient-to-br from-[#d4956a]/15 to-[#e89560]/10 blur-3xl transition-all duration-700 group-hover:scale-150"
      aria-hidden="true"
    />
    <div
      class="absolute -left-10 -top-10 size-36 rounded-full bg-gradient-to-br from-[#7a6b8e]/10 to-[#5b4b6e]/5 blur-3xl transition-all duration-700 group-hover:scale-150"
      aria-hidden="true"
    />

    <div class="relative z-10 flex flex-col gap-5">
      <!-- Header: avatar + badges -->
      <div class="flex items-start justify-between">
        <!-- Avatar -->
        <div class="transition-transform duration-500 group-hover:scale-105">
          <div
            v-if="provider.profilePhotoUrl"
            class="size-20 overflow-hidden rounded-full border-4 border-white shadow-md"
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
            class="grid size-20 place-items-center rounded-full border-4 border-white bg-gradient-to-br from-[#5b4b6e] to-[#7a6b8e] text-xl font-bold text-white shadow-md"
          >
            {{ initials }}
          </div>
        </div>

        <!-- Specialty badges -->
        <div class="flex max-w-[60%] flex-wrap justify-end gap-1.5">
          <span
            v-for="s in topSpecialties"
            :key="s"
            class="rounded-full bg-white/80 px-2.5 py-1 text-xs font-medium text-[#5b4b6e] shadow-sm transition-all duration-300 hover:bg-white hover:shadow-md"
          >
            {{ s }}
          </span>
        </div>
      </div>

      <!-- Name + city -->
      <div class="space-y-1.5">
        <h3 class="font-serif text-2xl font-bold text-[#3d3250] transition-colors duration-300">
          {{ provider.displayName }}
        </h3>
        <div
          v-if="provider.city"
          class="flex items-center gap-1.5 text-sm text-[#7a6b8e]"
        >
          <UIcon
            name="i-lucide-map-pin"
            class="size-4"
          />
          <span>{{ provider.city }}</span>
        </div>
      </div>

      <!-- Bio in glass card -->
      <div
        v-if="truncatedBio"
        class="rounded-2xl bg-white/60 p-4 backdrop-blur-sm transition-all duration-500 group-hover:bg-white/80"
      >
        <p class="text-sm leading-relaxed text-[#5a5068]">
          {{ truncatedBio }}
        </p>
      </div>

      <!-- CTAs -->
      <div class="flex flex-col gap-2">
        <NuxtLink
          :to="profileUrl"
          :external="!!provider.customDomain"
          :target="provider.customDomain ? '_blank' : undefined"
          :rel="provider.customDomain ? 'noopener noreferrer' : undefined"
          class="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#5b4b6e] to-[#7a6b8e] py-3 text-sm font-semibold text-white shadow-md transition-all duration-300 hover:from-[#4a3d5e] hover:to-[#6d5c82] hover:shadow-lg"
        >
          <span>Voir le profil</span>
          <UIcon
            name="i-lucide-arrow-right"
            class="size-4 transition-transform duration-300 group-hover:translate-x-0.5"
          />
        </NuxtLink>
        <NuxtLink
          :to="bookingUrl"
          :external="!!provider.customDomain"
          :target="provider.customDomain ? '_blank' : undefined"
          :rel="provider.customDomain ? 'noopener noreferrer' : undefined"
          class="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-[#5b4b6e]/20 bg-white/60 py-2.5 text-sm font-medium text-[#5b4b6e] transition-all duration-300 hover:bg-[#5b4b6e]/5"
        >
          <UIcon
            name="i-lucide-calendar"
            class="size-4"
          />
          <span>Réserver un appel gratuit</span>
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<style scoped>
.specialist-card {
  background: linear-gradient(135deg, #fdf8f4 0%, #f8f0ec 30%, #f3edf7 70%, #faf6fb 100%);
}
</style>
