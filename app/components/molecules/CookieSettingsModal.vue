<script setup lang="ts">
import {
  COOKIE_CONSENT_MAX_AGE,
  COOKIE_CONSENT_NAME,
  getAdsEnabledFromConsent,
  getConsentValueFromPreferences,
  hasGoogleAdsConfig,
  toConsentSignals,
  type ConsentValue
} from '~/features/consent/consent-logic'

const props = defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'saved': []
}>()

const consent = useCookie<ConsentValue>(COOKIE_CONSENT_NAME, {
  maxAge: COOKIE_CONSENT_MAX_AGE,
  sameSite: 'lax',
  secure: true
})

const googleAdsId = useState<string | null>('googleAdsId', () => null)
const gtag = useState<((...args: unknown[]) => void) | null>('gtag', () => null)
const hasAds = computed(() => hasGoogleAdsConfig(googleAdsId.value))

// Toggle state for advertising cookies
const adsEnabled = ref(false)

// Pre-fill toggle when modal opens
watch(() => props.open, (isOpen) => {
  if (isOpen) {
    adsEnabled.value = getAdsEnabledFromConsent(consent.value)
  }
})

function save() {
  const granted = adsEnabled.value && hasAds.value
  consent.value = getConsentValueFromPreferences(adsEnabled.value, hasAds.value)

  if (gtag.value) {
    gtag.value('consent', 'update', toConsentSignals(granted))
  }

  emit('update:open', false)
  emit('saved')
}
</script>

<template>
  <UModal
    :open="props.open"
    title="Param&eacute;trer les cookies"
    :ui="{
      footer: 'justify-end'
    }"
    @update:open="emit('update:open', $event)"
  >
    <template #body>
      <div class="space-y-4">
        <p class="text-sm leading-relaxed text-[color:var(--color-brand-secondary)]">
          Choisissez les cookies que vous acceptez sur ce site.
        </p>

        <div class="space-y-3">
          <!-- Essential cookies — always on -->
          <div class="flex items-center justify-between rounded-[var(--radius-md)] bg-[color:var(--color-surface-highlight)] p-3">
            <div class="flex items-start gap-3">
              <UIcon
                name="i-lucide-lock"
                class="mt-0.5 size-4 shrink-0 text-[color:var(--color-brand-muted)]"
              />
              <div>
                <p class="text-sm font-medium text-[color:var(--color-brand-primary)]">
                  Essentiels
                </p>
                <p class="text-xs text-[color:var(--color-brand-muted)]">
                  Connexion, rendez-vous — n&eacute;cessaires au fonctionnement
                </p>
              </div>
            </div>
            <USwitch
              :model-value="true"
              disabled
            />
          </div>

          <!-- Advertising cookies — only if Google Ads is configured -->
          <div
            v-if="hasAds"
            class="flex items-center justify-between rounded-[var(--radius-md)] bg-[color:var(--color-surface-highlight)] p-3"
          >
            <div class="flex items-start gap-3">
              <UIcon
                name="i-lucide-megaphone"
                class="mt-0.5 size-4 shrink-0 text-[color:var(--color-brand-muted)]"
              />
              <div>
                <p class="text-sm font-medium text-[color:var(--color-brand-primary)]">
                  Publicitaires
                </p>
                <p class="text-xs text-[color:var(--color-brand-muted)]">
                  Mesure de l'efficacit&eacute; des campagnes publicitaires (Google Ads)
                </p>
              </div>
            </div>
            <USwitch v-model="adsEnabled" />
          </div>
        </div>

        <p
          v-if="!hasAds"
          class="text-xs text-[color:var(--color-brand-muted)]"
        >
          Aucun cookie de tracking ou d'analyse n'est utilis&eacute;.
        </p>

        <NuxtLink
          to="/legal/confidentialite"
          class="inline-flex items-center gap-1 text-xs text-[color:var(--color-brand-muted)] underline hover:text-[color:var(--color-brand-secondary)]"
          @click="emit('update:open', false)"
        >
          <UIcon
            name="i-lucide-external-link"
            class="size-3"
          />
          Politique de confidentialit&eacute;
        </NuxtLink>
      </div>
    </template>

    <template #footer>
      <UButton
        color="neutral"
        variant="outline"
        @click="emit('update:open', false)"
      >
        Annuler
      </UButton>
      <UButton
        color="primary"
        @click="save"
      >
        Enregistrer mes choix
      </UButton>
    </template>
  </UModal>
</template>
