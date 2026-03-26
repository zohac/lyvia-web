<script setup lang="ts">
import {
  COOKIE_CONSENT_MAX_AGE,
  COOKIE_CONSENT_NAME,
  getAcceptConsentValue,
  getBannerMode,
  hasGoogleAdsConfig,
  shouldShowConsentBanner,
  toConsentSignals,
  type ConsentValue
} from '~/features/consent/consent-logic'
import CookieSettingsModal from '~/components/molecules/CookieSettingsModal.vue'

const consent = useCookie<ConsentValue>(COOKIE_CONSENT_NAME, {
  maxAge: COOKIE_CONSENT_MAX_AGE,
  sameSite: 'lax',
  secure: true
})

const showBanner = ref(false)
const showSettings = ref(false)

// Detect if Google Ads is active (set by google-ads.client.ts plugin)
const googleAdsId = useState<string | null>('googleAdsId', () => null)
const gtag = useState<((...args: unknown[]) => void) | null>('gtag', () => null)
const hasAds = computed(() => hasGoogleAdsConfig(googleAdsId.value))
const bannerMode = computed(() => getBannerMode(hasAds.value))

// Only show banner client-side after hydration if no consent is stored
onMounted(() => {
  if (shouldShowConsentBanner(consent.value)) {
    showBanner.value = true
  }
})

function updateConsent(granted: boolean) {
  if (gtag.value) {
    gtag.value('consent', 'update', toConsentSignals(granted))
  }
}

function acceptAll() {
  consent.value = getAcceptConsentValue(hasAds.value)
  updateConsent(true)
  showBanner.value = false
}

function rejectAds() {
  consent.value = 'essential'
  updateConsent(false)
  showBanner.value = false
}

function acknowledge() {
  consent.value = 'acknowledged'
  showBanner.value = false
}

function openSettings() {
  showSettings.value = true
}

function onSettingsSaved() {
  showBanner.value = false
}
</script>

<template>
  <Transition
    enter-active-class="transition-all duration-300 ease-out"
    enter-from-class="translate-y-full opacity-0"
    enter-to-class="translate-y-0 opacity-100"
    leave-active-class="transition-all duration-200 ease-in"
    leave-from-class="translate-y-0 opacity-100"
    leave-to-class="translate-y-full opacity-0"
  >
    <div
      v-if="showBanner"
      class="fixed inset-x-0 bottom-0 z-50 p-4"
    >
      <div class="mx-auto max-w-xl rounded-[var(--radius-lg)] border border-[color:var(--color-brand-subtle)] bg-[color:var(--color-surface-card)] p-5 shadow-lg">
        <div class="flex flex-col gap-4">
          <div>
            <p class="text-sm leading-relaxed text-[color:var(--color-brand-primary)]">
              <template v-if="hasAds">
                Ce site utilise des cookies essentiels et, avec votre accord, des cookies publicitaires pour mesurer l'efficacit&eacute; de nos campagnes.
              </template>
              <template v-else>
                Ce site utilise uniquement des cookies essentiels au fonctionnement du service (connexion, rendez-vous).
              </template>
            </p>
            <NuxtLink
              to="/legal/confidentialite"
              class="mt-2 inline-block text-xs text-[color:var(--color-brand-muted)] underline hover:text-[color:var(--color-brand-secondary)]"
            >
              En savoir plus
            </NuxtLink>
          </div>

          <div class="flex items-center gap-3">
            <!-- Without ads: simple acknowledge -->
            <template v-if="bannerMode === 'simple'">
              <UButton
                color="primary"
                size="md"
                class="w-full justify-center sm:w-auto"
                @click="acknowledge"
              >
                Compris
              </UButton>
            </template>

            <!-- With ads: accept / reject / settings -->
            <template v-else>
              <UButton
                color="primary"
                size="md"
                class="flex-1 justify-center sm:flex-none"
                @click="acceptAll"
              >
                Accepter
              </UButton>
              <UButton
                color="neutral"
                variant="ghost"
                size="md"
                class="flex-1 justify-center sm:flex-none"
                @click="rejectAds"
              >
                Refuser
              </UButton>
              <button
                class="text-xs text-[color:var(--color-brand-muted)] underline hover:text-[color:var(--color-brand-secondary)]"
                @click="openSettings"
              >
                Param&eacute;trer
              </button>
            </template>
          </div>
        </div>
      </div>
    </div>
  </Transition>

  <CookieSettingsModal
    :open="showSettings"
    @update:open="showSettings = $event"
    @saved="onSettingsSaved"
  />
</template>
