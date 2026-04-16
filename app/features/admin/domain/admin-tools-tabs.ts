import type { LocationQuery, LocationQueryRaw, LocationQueryValue } from 'vue-router'

export const ADMIN_TOOL_TAB_VALUES = [
  'analytics',
  'logs',
  'notifications',
  'waitlist'
] as const

export type AdminToolTabValue = typeof ADMIN_TOOL_TAB_VALUES[number]

export type AdminToolTabItem = {
  label: string
  value: AdminToolTabValue
  icon: string
  slot: AdminToolTabValue
}

export const ADMIN_TOOL_TABS: AdminToolTabItem[] = [
  { label: 'Analytics', value: 'analytics', icon: 'i-lucide-bar-chart-3', slot: 'analytics' },
  { label: 'Business Logs', value: 'logs', icon: 'i-lucide-scroll-text', slot: 'logs' },
  { label: 'Notifications', value: 'notifications', icon: 'i-lucide-bell', slot: 'notifications' },
  { label: 'Waitlist', value: 'waitlist', icon: 'i-lucide-list', slot: 'waitlist' }
]

const DEFAULT_ADMIN_TOOL_TAB: AdminToolTabValue = 'analytics'

export function parseAdminToolTab(
  input: LocationQueryValue | LocationQueryValue[] | undefined
): AdminToolTabValue {
  const candidate = Array.isArray(input) ? input[0] : input

  if (!candidate) return DEFAULT_ADMIN_TOOL_TAB

  return ADMIN_TOOL_TAB_VALUES.includes(candidate as AdminToolTabValue)
    ? (candidate as AdminToolTabValue)
    : DEFAULT_ADMIN_TOOL_TAB
}

export function buildAdminToolTabQuery(
  query: LocationQuery,
  nextTab: AdminToolTabValue
): LocationQueryRaw {
  const nextQuery: LocationQueryRaw = { ...query }

  if (nextTab === DEFAULT_ADMIN_TOOL_TAB) {
    delete nextQuery.tab
    return nextQuery
  }

  nextQuery.tab = nextTab
  return nextQuery
}
