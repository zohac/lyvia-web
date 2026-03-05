<script setup lang="ts">
import { useProviderAccount } from '../../features/account/useProviderAccount'
import { useProviderSeo } from '../../features/seo/useProviderSeo'
import { apiFetch } from '../../services/api/apiFetch'
import type { ProviderAccountResponse } from '../../features/account/api/provider-account.contract'
import MoleculesGooglePreview from '../../components/molecules/GooglePreview.vue'

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

const SLUG_REGEX = /^[a-z0-9-]+$/
const slugFormatError = computed(() => {
  if (!slugValue.value || SLUG_REGEX.test(slugValue.value)) return null
  return 'Format invalide. Utilisez des lettres minuscules, chiffres et tirets.'
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
    // Direct apiFetch to capture specific error codes (updateAccount swallows errors)
    await apiFetch<ProviderAccountResponse>('/provider/account', {
      method: 'PATCH',
      body: { slug: slugValue.value }
    })
    // Re-sync composable state (watcher updates savedSlug automatically)
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
  <div class="mx-auto max-w-3xl space-y-10">
    <!-- Page header -->
    <header>
      <h1 class="text-2xl font-semibold text-stone-900 sm:text-3xl">
        SEO
      </h1>
      <p class="mt-1 text-stone-500">
        Optimisez le référencement de vos pages publiques
      </p>
    </header>

    <!-- Global error + retry -->
    <div
      v-if="loadError"
      class="space-y-4"
    >
      <UAlert
        color="error"
        variant="soft"
        title="Impossible de charger la configuration"
        :description="loadError"
        icon="i-lucide-alert-circle"
      />
      <div class="flex justify-center">
        <UButton
          color="neutral"
          variant="soft"
          :loading="isLoading"
          @click="retryLoad"
        >
          Réessayer
        </UButton>
      </div>
    </div>

    <!-- Loading skeleton -->
    <div
      v-else-if="isLoading"
      class="space-y-8"
    >
      <USkeleton class="h-48 w-full rounded-lg" />
      <USkeleton class="h-64 w-full rounded-lg" />
      <USkeleton class="h-64 w-full rounded-lg" />
    </div>

    <template v-else>
      <!-- ═══════════════════════════════════════════ -->
      <!-- Section 1 — Coach-slug                     -->
      <!-- ═══════════════════════════════════════════ -->
      <section class="space-y-4">
        <h2 class="text-xl font-semibold text-stone-900">
          URL de votre profil
        </h2>

        <UFormField
          label="Coach-slug"
          hint="Lettres minuscules, chiffres et tirets uniquement"
          :error="slugFormatError ?? slugError ?? undefined"
        >
          <UInput
            v-model="slugValue"
            placeholder="sophie-coach-bien-etre"
            class="w-full sm:w-96"
          />
        </UFormField>

        <p class="text-sm text-stone-500">
          Votre profil sera accessible à :
          <span class="font-medium text-stone-700">{{ host }}/coach/{{ slugValue }}</span>
        </p>

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
      </section>

      <USeparator />

      <!-- ═══════════════════════════════════════════ -->
      <!-- Section 2 — Page profil SEO                -->
      <!-- ═══════════════════════════════════════════ -->
      <section class="space-y-4">
        <div class="flex items-center gap-2">
          <h2 class="text-xl font-semibold text-stone-900">
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
        <p class="text-sm text-stone-500">
          Métadonnées SEO de votre page /coach/{{ savedSlug }}
        </p>

        <UAlert
          v-if="profileEntry?.hasAdminOverride"
          color="warning"
          variant="soft"
          title="Gestion centralisée"
          description="Les métadonnées de cette page sont gérées par l'administrateur."
          icon="i-lucide-shield"
        />

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
      </section>

      <USeparator />

      <!-- ═══════════════════════════════════════════ -->
      <!-- Section 3 — Page booking SEO               -->
      <!-- ═══════════════════════════════════════════ -->
      <section class="space-y-4">
        <div class="flex items-center gap-2">
          <h2 class="text-xl font-semibold text-stone-900">
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
        <p class="text-sm text-stone-500">
          Métadonnées SEO de votre page /coach/{{ savedSlug }}/onboarding/discovery
        </p>

        <UAlert
          v-if="bookingEntry?.hasAdminOverride"
          color="warning"
          variant="soft"
          title="Gestion centralisée"
          description="Les métadonnées de cette page sont gérées par l'administrateur."
          icon="i-lucide-shield"
        />

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
      </section>
    </template>
  </div>
</template>
