<script setup lang="ts">
export interface FeaturedProvider {
  slug: string
  displayName: string
  firstName: string
  lastName: string
  bio: string | null
  specialties: string[]
  city: string | null
  profilePhotoUrl: string | null
  profilePhotoAlt: string | null
  customDomain: string | null
  discoveryDurationMinutes: number
}

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
</script>

<template>
  <div class="group flex flex-col overflow-hidden rounded-2xl border border-[#e8e2ed] bg-white shadow-sm transition-shadow duration-300 hover:shadow-md">
    <!-- Photo or initials -->
    <div class="flex items-center gap-4 p-5 pb-3">
      <div
        v-if="provider.profilePhotoUrl"
        class="size-14 shrink-0 overflow-hidden rounded-full"
      >
        <img
          :src="provider.profilePhotoUrl"
          :alt="provider.profilePhotoAlt || provider.displayName"
          class="size-full object-cover"
          loading="lazy"
        >
      </div>
      <div
        v-else
        class="grid size-14 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#5b4b6e] to-[#7a6b8e] text-lg font-semibold text-white"
      >
        {{ initials }}
      </div>
      <div class="min-w-0">
        <h3 class="truncate font-serif text-lg font-semibold text-[#3d3250]">
          {{ provider.displayName }}
        </h3>
        <p
          v-if="provider.city"
          class="flex items-center gap-1 text-sm text-[#857d8c]"
        >
          <UIcon
            name="i-lucide-map-pin"
            class="size-3.5"
          />
          {{ provider.city }}
        </p>
      </div>
    </div>

    <!-- Specialties -->
    <div
      v-if="topSpecialties.length"
      class="flex flex-wrap gap-1.5 px-5"
    >
      <span
        v-for="s in topSpecialties"
        :key="s"
        class="rounded-full bg-[#f5f0fa] px-2.5 py-0.5 text-xs font-medium text-[#5b4b6e]"
      >
        {{ s }}
      </span>
    </div>

    <!-- Bio -->
    <p
      v-if="truncatedBio"
      class="flex-1 px-5 pt-3 text-sm leading-relaxed text-[#6b6177]"
    >
      {{ truncatedBio }}
    </p>

    <!-- CTA -->
    <div class="mt-auto p-5 pt-4">
      <NuxtLink
        :to="profileUrl"
        :external="!!provider.customDomain"
        :target="provider.customDomain ? '_blank' : undefined"
        class="inline-flex w-full items-center justify-center gap-2 rounded-full border border-[#5b4b6e] px-4 py-2.5 text-sm font-semibold text-[#5b4b6e] transition-colors duration-200 hover:bg-[#5b4b6e] hover:text-white"
      >
        Voir le profil
        <UIcon
          name="i-lucide-arrow-right"
          class="size-4 transition-transform duration-200 group-hover:translate-x-0.5"
        />
      </NuxtLink>
    </div>
  </div>
</template>
