/**
 * Consent source indicating where the preference was set.
 */
export type ConsentSource = 'onboarding' | 'settings' | 'admin'

/**
 * Client communication preferences response from API.
 */
export type ClientPreferences = {
  emailMarketingOptIn: boolean
  smsMarketingOptIn: boolean
  hasPhone: boolean
  /** Per channel (CC.1b). `null` = never modified since the profile was created. */
  emailConsentUpdatedAt: string | null
  smsConsentUpdatedAt: string | null
  consentSource: ConsentSource | null
}

/**
 * Request body for updating client preferences.
 */
export type UpdateClientPreferencesRequest = {
  emailMarketingOptIn?: boolean
  smsMarketingOptIn?: boolean
}
