<script setup lang="ts">
import { useProviderAccount } from '~/features/account/useProviderAccount'
import { useProviderSeo } from '~/features/seo/useProviderSeo'
import { apiFetch } from '~/services/api/apiFetch'
import type { ProviderAccountResponse } from '~/features/account/api/provider-account.contract'
import { SLUG_REGEX } from '~/utils/validation-regex'
import MoleculesGooglePreview from '~/components/molecules/GooglePreview.vue'

definePageMeta({
  layout: 'provider',
  middleware: 'auth-provider',
  pageTitle: 'SEO'
})

const toast = useToast()

// ──────────────────────────────────────────────
// Parallel initial fetches
// ──────────────────────────────────────────────
const providerAccount = useProviderAccount()
const seo = useProviderSeo()

await Promise.all([
  providerAccount.fetchAccount(),
  seo.fetchSeo()
])

// ──────────────────────────────────────────────
// Host for URL preview
// ──────────────────────────────────────────────
const host = computed(() => useRequestURL().origin)

// ──────────────────────────────────────────────
// Section 1 — Coach-slug
// ──────────────────────────────────────────────
const slugValue = ref(providerAccount.account.value?.slug ?? '')
const slugSaving = ref(false)
const slugError = ref<string | null>(null)

const savedSlug = ref(providerAccount.account.value?.slug ?? '')
const isSlugDirty = computed(() => slugValue.value !== savedSlug.value)

const slugFormatError = computed(() => {
  if (!slugValue.value || SLUG_REGEX.test(slugValue.value)) return null
  return 'Format invalide. Utilisez des lettres minuscules, chiffres et tirets (ex: marie-dupont).'
})

watch(
  () => providerAccount.account.value,
  (account) => {
    if (!account) return
    slugValue.value = account.slug
    savedSlug.value = account.slug
  }
)

async function saveSlug() {
  if (slugSaving.value) return

  slugSaving.value = true
  slugError.value = null

  try {
    await apiFetch<ProviderAccountResponse>('/provider/account', {
      method: 'PATCH',
      body: { slug: slugValue.value }
    })
    await providerAccount.fetchAccount()
    toast.add({ title: 'URL mise à jour', color: 'success' })
  } catch (e: unknown) {
    const err = e as { data?: { code?: string } }
    if (err.data?.code === 'SLUG_ALREADY_TAKEN') {
      slugError.value = 'Ce slug est déjà utilisé par un autre coach'
    } else if (err.data?.code === 'SLUG_INVALID') {
      slugError.value = 'Format invalide. Utilisez des lettres minuscules, chiffres et tirets.'
    } else {
      slugError.value = 'Impossible de mettre à jour le slug'
    }
  } finally {
    slugSaving.value = false
  }
}

// ──────────────────────────────────────────────
// Section 2 — Page profil SEO (coach_profile)
// ──────────────────────────────────────────────
const profileEntry = computed(() => seo.getEntry('coach_profile'))

const profileTitle = ref(profileEntry.value?.title ?? '')
const profileDescription = ref(profileEntry.value?.description ?? '')
const profileOgImage = ref(profileEntry.value?.ogImageUrl ?? '')
const profileCanonical = ref(profileEntry.value?.canonicalUrl ?? '')

const savedProfile = ref({
  title: profileTitle.value,
  description: profileDescription.value,
  ogImageUrl: profileOgImage.value,
  canonicalUrl: profileCanonical.value
})

watch(
  () => seo.getEntry('coach_profile'),
  (entry) => {
    if (!entry) return
    profileTitle.value = entry.title ?? ''
    profileDescription.value = entry.description ?? ''
    profileOgImage.value = entry.ogImageUrl ?? ''
    profileCanonical.value = entry.canonicalUrl ?? ''
    savedProfile.value = {
      title: entry.title ?? '',
      description: entry.description ?? '',
      ogImageUrl: entry.ogImageUrl ?? '',
      canonicalUrl: entry.canonicalUrl ?? ''
    }
  }
)

const isProfileDirty = computed(() =>
  profileTitle.value !== savedProfile.value.title
  || profileDescription.value !== savedProfile.value.description
  || profileOgImage.value !== savedProfile.value.ogImageUrl
  || profileCanonical.value !== savedProfile.value.canonicalUrl
)

const profileSaving = ref(false)

async function saveProfile() {
  if (profileSaving.value) return

  profileSaving.value = true
  const ok = await seo.updateSeo('coach_profile', {
    title: profileTitle.value || null,
    description: profileDescription.value || null,
    ogImageUrl: profileOgImage.value || null,
    canonicalUrl: profileCanonical.value || null
  })
  profileSaving.value = false

  if (ok) {
    toast.add({ title: 'Métadonnées SEO mises à jour', color: 'success' })
  } else {
    toast.add({
      title: 'Erreur',
      description: seo.error.value ?? 'Impossible de sauvegarder.',
      color: 'error'
    })
  }
}

// ──────────────────────────────────────────────
// Section 3 — Page booking SEO (coach_booking)
// ──────────────────────────────────────────────
const bookingEntry = computed(() => seo.getEntry('coach_booking'))

const bookingTitle = ref(bookingEntry.value?.title ?? '')
const bookingDescription = ref(bookingEntry.value?.description ?? '')
const bookingOgImage = ref(bookingEntry.value?.ogImageUrl ?? '')
const bookingCanonical = ref(bookingEntry.value?.canonicalUrl ?? '')

const savedBooking = ref({
  title: bookingTitle.value,
  description: bookingDescription.value,
  ogImageUrl: bookingOgImage.value,
  canonicalUrl: bookingCanonical.value
})

watch(
  () => seo.getEntry('coach_booking'),
  (entry) => {
    if (!entry) return
    bookingTitle.value = entry.title ?? ''
    bookingDescription.value = entry.description ?? ''
    bookingOgImage.value = entry.ogImageUrl ?? ''
    bookingCanonical.value = entry.canonicalUrl ?? ''
    savedBooking.value = {
      title: entry.title ?? '',
      description: entry.description ?? '',
      ogImageUrl: entry.ogImageUrl ?? '',
      canonicalUrl: entry.canonicalUrl ?? ''
    }
  }
)

const isBookingDirty = computed(() =>
  bookingTitle.value !== savedBooking.value.title
  || bookingDescription.value !== savedBooking.value.description
  || bookingOgImage.value !== savedBooking.value.ogImageUrl
  || bookingCanonical.value !== savedBooking.value.canonicalUrl
)

const bookingSaving = ref(false)

async function saveBooking() {
  if (bookingSaving.value) return

  bookingSaving.value = true
  const ok = await seo.updateSeo('coach_booking', {
    title: bookingTitle.value || null,
    description: bookingDescription.value || null,
    ogImageUrl: bookingOgImage.value || null,
    canonicalUrl: bookingCanonical.value || null
  })
  bookingSaving.value = false

  if (ok) {
    toast.add({ title: 'Métadonnées SEO mises à jour', color: 'success' })
  } else {
    toast.add({
      title: 'Erreur',
      description: seo.error.value ?? 'Impossible de sauvegarder.',
      color: 'error'
    })
  }
}

// ──────────────────────────────────────────────
// Global loading state + retry
// ──────────────────────────────────────────────
const isLoading = computed(() => providerAccount.loading.value || seo.loading.value)
const loadError = computed(() => providerAccount.error.value || seo.error.value)

async function retryLoad() {
  await Promise.all([
    providerAccount.fetchAccount(),
    seo.fetchSeo()
  ])
}
</script>

<template>
  <div class="mx-auto max-w-3xl space-y-8">
    <!-- Page Header -->
    <section class="relative pl-6">
      <div class="absolute left-0 top-2 h-[90%] w-1.5 rounded-full bg-gradient-to-b from-[color:var(--color-brand-solid)] via-[rgba(212,184,160,0.35)] to-transparent opacity-70" />
      <div class="grid gap-2">
        <h1 class="font-serif text-3xl italic leading-[var(--leading-tight)] text-[color:var(--color-brand-primary)] sm:text-4xl">
          Référencement
        </h1>
        <p class="text-base font-medium text-[color:var(--color-brand-secondary)]">
          Optimisez le SEO de vos pages publiques
        </p>
      </div>
    </section>

    <!-- Global error + retry -->
    <div
      v-if="loadError"
      class="rounded-2xl border border-red-200 bg-red-50 p-8 text-center"
    >
      <UIcon
        name="lucide:alert-circle"
        size="48"
        class="mx-auto mb-4 text-red-500"
      />
      <p class="text-lg font-medium text-red-800">
        Impossible de charger la configuration
      </p>
      <p class="mt-2 text-sm text-[color:var(--color-brand-secondary)]">
        {{ loadError }}
      </p>
      <UButton
        color="neutral"
        variant="outline"
        class="mt-6 rounded-full"
        :loading="isLoading"
        @click="retryLoad"
      >
        <UIcon
          name="lucide:refresh-cw"
          size="16"
        />
        Réessayer
      </UButton>
    </div>

    <!-- Loading skeleton -->
    <div
      v-else-if="isLoading"
      class="space-y-6"
    >
      <USkeleton
        v-for="i in 3"
        :key="i"
        class="h-48 rounded-2xl"
      />
    </div>

    <template v-else>
      <!-- Section 1 — Coach-slug -->
      <section class="relative overflow-hidden rounded-2xl border border-[rgba(28,25,23,0.10)] bg-white/75 p-6 shadow-soft backdrop-blur sm:p-8">
        <div class="mb-6 flex items-start gap-4">
          <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[color:var(--color-crepuscule-100)]">
            <UIcon
              name="lucide:link"
              size="20"
              class="text-[color:var(--color-crepuscule-600)]"
            />
          </div>
          <div>
            <h2 class="font-serif text-xl italic text-[color:var(--color-brand-primary)] sm:text-2xl">
              URL de votre profil
            </h2>
            <p class="mt-1 text-sm text-[color:var(--color-brand-secondary)]">
              Personnalisez l'adresse de votre page publique
            </p>
          </div>
        </div>

        <div class="space-y-4">
          <UFormField
            label="Coach-slug"
            hint="minuscules, chiffres et tirets"
            :error="slugFormatError ?? slugError ?? undefined"
          >
            <UInput
              v-model="slugValue"
              placeholder="sophie-coach-bien-etre"
              class="w-full sm:w-96"
            />
          </UFormField>

          <div class="rounded-xl bg-[color:var(--color-crepuscule-50)] px-4 py-3">
            <p class="text-sm text-[color:var(--color-brand-secondary)]">
              Votre profil sera accessible à :
            </p>
            <p class="mt-1 font-mono text-sm font-medium text-[color:var(--color-brand-primary)]">
              {{ host }}/coach/{{ slugValue || '...' }}
            </p>
          </div>

          <div class="flex justify-end">
            <UButton
              color="primary"
              :loading="slugSaving"
              :disabled="!isSlugDirty || !!slugFormatError"
              @click="saveSlug"
            >
              Enregistrer
            </UButton>
          </div>
        </div>
      </section>

      <!-- Section 2 — Page profil SEO -->
      <section class="relative overflow-hidden rounded-2xl border border-[rgba(28,25,23,0.10)] bg-white/75 p-6 shadow-soft backdrop-blur sm:p-8">
        <div class="mb-6 flex items-start gap-4">
          <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[color:var(--color-crepuscule-100)]">
            <UIcon
              name="lucide:user"
              size="20"
              class="text-[color:var(--color-crepuscule-600)]"
            />
          </div>
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-2">
              <h2 class="font-serif text-xl italic text-[color:var(--color-brand-primary)] sm:text-2xl">
                Page profil
              </h2>
              <UBadge
                v-if="profileEntry?.hasAdminOverride"
                color="warning"
                variant="subtle"
              >
                Géré par l'admin
              </UBadge>
            </div>
            <p class="mt-1 text-sm text-[color:var(--color-brand-secondary)]">
              Métadonnées SEO de /coach/{{ savedSlug }}
            </p>
          </div>
        </div>

        <UAlert
          v-if="profileEntry?.hasAdminOverride"
          color="warning"
          variant="soft"
          title="Gestion centralisée"
          description="Les métadonnées de cette page sont gérées par l'administrateur."
          icon="i-lucide-shield"
          class="mb-6"
        />

        <div class="space-y-4">
          <UFormField label="Titre SEO">
            <template #hint>
              {{ profileTitle?.length ?? 0 }}/70
            </template>
            <UInput
              v-model="profileTitle"
              :disabled="profileEntry?.hasAdminOverride"
              maxlength="70"
              class="w-full"
            />
          </UFormField>

          <UFormField label="Description SEO">
            <template #hint>
              {{ profileDescription?.length ?? 0 }}/160
            </template>
            <UTextarea
              v-model="profileDescription"
              :disabled="profileEntry?.hasAdminOverride"
              maxlength="160"
              :rows="3"
              class="w-full"
            />
          </UFormField>

          <UFormField label="URL image OG">
            <UInput
              v-model="profileOgImage"
              :disabled="profileEntry?.hasAdminOverride"
              placeholder="https://..."
              class="w-full"
            />
          </UFormField>

          <UFormField label="URL canonique">
            <UInput
              v-model="profileCanonical"
              :disabled="profileEntry?.hasAdminOverride"
              placeholder="/coach/votre-slug"
              class="w-full"
            />
          </UFormField>

          <MoleculesGooglePreview
            :title="profileTitle || `${providerAccount.account.value?.firstname ?? ''} ${providerAccount.account.value?.lastname ?? ''} — Coach`"
            :description="profileDescription || providerAccount.account.value?.bio || ''"
            :url="`${host}/coach/${savedSlug}`"
          />

          <div class="flex justify-end">
            <UButton
              color="primary"
              :loading="profileSaving"
              :disabled="!isProfileDirty || profileEntry?.hasAdminOverride"
              @click="saveProfile"
            >
              Enregistrer
            </UButton>
          </div>
        </div>
      </section>

      <!-- Section 3 — Page booking SEO -->
      <section class="relative overflow-hidden rounded-2xl border border-[rgba(28,25,23,0.10)] bg-white/75 p-6 shadow-soft backdrop-blur sm:p-8">
        <div class="mb-6 flex items-start gap-4">
          <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[color:var(--color-crepuscule-100)]">
            <UIcon
              name="lucide:calendar-check"
              size="20"
              class="text-[color:var(--color-crepuscule-600)]"
            />
          </div>
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-2">
              <h2 class="font-serif text-xl italic text-[color:var(--color-brand-primary)] sm:text-2xl">
                Page réservation
              </h2>
              <UBadge
                v-if="bookingEntry?.hasAdminOverride"
                color="warning"
                variant="subtle"
              >
                Géré par l'admin
              </UBadge>
            </div>
            <p class="mt-1 text-sm text-[color:var(--color-brand-secondary)]">
              Métadonnées SEO de /coach/{{ savedSlug }}/onboarding/discovery
            </p>
          </div>
        </div>

        <UAlert
          v-if="bookingEntry?.hasAdminOverride"
          color="warning"
          variant="soft"
          title="Gestion centralisée"
          description="Les métadonnées de cette page sont gérées par l'administrateur."
          icon="i-lucide-shield"
          class="mb-6"
        />

        <div class="space-y-4">
          <UFormField label="Titre SEO">
            <template #hint>
              {{ bookingTitle?.length ?? 0 }}/70
            </template>
            <UInput
              v-model="bookingTitle"
              :disabled="bookingEntry?.hasAdminOverride"
              maxlength="70"
              class="w-full"
            />
          </UFormField>

          <UFormField label="Description SEO">
            <template #hint>
              {{ bookingDescription?.length ?? 0 }}/160
            </template>
            <UTextarea
              v-model="bookingDescription"
              :disabled="bookingEntry?.hasAdminOverride"
              maxlength="160"
              :rows="3"
              class="w-full"
            />
          </UFormField>

          <UFormField label="URL image OG">
            <UInput
              v-model="bookingOgImage"
              :disabled="bookingEntry?.hasAdminOverride"
              placeholder="https://..."
              class="w-full"
            />
          </UFormField>

          <UFormField label="URL canonique">
            <UInput
              v-model="bookingCanonical"
              :disabled="bookingEntry?.hasAdminOverride"
              placeholder="/coach/votre-slug/onboarding/discovery"
              class="w-full"
            />
          </UFormField>

          <MoleculesGooglePreview
            :title="bookingTitle || `Réserver — ${providerAccount.account.value?.firstname ?? ''} ${providerAccount.account.value?.lastname ?? ''}`"
            :description="bookingDescription || 'Réservez votre séance découverte gratuite'"
            :url="`${host}/coach/${savedSlug}/onboarding/discovery`"
          />

          <div class="flex justify-end">
            <UButton
              color="primary"
              :loading="bookingSaving"
              :disabled="!isBookingDirty || bookingEntry?.hasAdminOverride"
              @click="saveBooking"
            >
              Enregistrer
            </UButton>
          </div>
        </div>
      </section>
    </template>
  </div>
</template>
