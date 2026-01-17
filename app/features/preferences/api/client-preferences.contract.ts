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
  consentUpdatedAt: string | null
  consentSource: ConsentSource | null
}

/**
 * Request body for updating client preferences.
 */
export type UpdateClientPreferencesRequest = {
  emailMarketingOptIn?: boolean
  smsMarketingOptIn?: boolean
}
