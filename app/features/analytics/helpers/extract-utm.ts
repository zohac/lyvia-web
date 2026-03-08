export function extractUtmParams(search: string): {
  utmSource?: string
  utmMedium?: string
  utmCampaign?: string
} {
  const params = new URLSearchParams(search)
  return {
    utmSource: params.get('utm_source') ?? undefined,
    utmMedium: params.get('utm_medium') ?? undefined,
    utmCampaign: params.get('utm_campaign') ?? undefined
  }
}
