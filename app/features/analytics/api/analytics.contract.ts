/**
 * Matches OpenAPI enum: RecordPageViewDto.deviceType
 */
export type DeviceType = 'mobile' | 'tablet' | 'desktop'

/**
 * Matches OpenAPI schema: RecordPageViewDto
 * Required: tenantId, pagePath, deviceType
 */
export type TrackPageViewRequest = {
  tenantId: string
  pagePath: string
  referrerDomain?: string
  utmSource?: string
  utmMedium?: string
  utmCampaign?: string
  deviceType: DeviceType
  browser?: string
  paidClickIds?: Record<string, string>
}

// ── Shared Analytics ──

export type AnalyticsPeriod = 'day' | 'week' | 'month' | 'quarter'

export const ANALYTICS_PERIOD_OPTIONS: Array<{ label: string, value: AnalyticsPeriod }> = [
  { label: 'Aujourd\'hui', value: 'day' },
  { label: '7 jours', value: 'week' },
  { label: '30 jours', value: 'month' },
  { label: '3 mois', value: 'quarter' }
]

// ── Provider Analytics Dashboard ──

/**
 * Matches OpenAPI schema: KpiWithDeltaDto
 */
export type KpiWithDelta = {
  value: number
  delta: number
}

/**
 * Matches OpenAPI schema: KpisDto
 */
export type AnalyticsKpis = {
  visitors: KpiWithDelta
  pageViews: KpiWithDelta
  discoveryBooked: KpiWithDelta
  revenue: KpiWithDelta
}

export type FunnelStep = {
  step: string
  value: number
  percentage: number
}

export type TrafficSource = {
  domain: string
  count: number
  percentage: number
}

export type DeviceBreakdown = {
  type: string
  count: number
  percentage: number
}

/**
 * Matches OpenAPI schema: ProviderAnalyticsResponseDto
 */
export type ProviderAnalyticsResponse = {
  period: AnalyticsPeriod
  kpis: AnalyticsKpis
  funnel: FunnelStep[]
  sources: TrafficSource[]
  devices: DeviceBreakdown[]
}
