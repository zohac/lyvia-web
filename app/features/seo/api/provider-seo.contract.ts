export type ProviderSeoEntry = {
  targetType: 'coach_profile' | 'coach_booking'
  title: string | null
  description: string | null
  ogImageUrl: string | null
  canonicalUrl: string | null
  hasAdminOverride: boolean
}

export type UpsertProviderSeoRequest = {
  title?: string | null
  description?: string | null
  ogImageUrl?: string | null
  canonicalUrl?: string | null
}
