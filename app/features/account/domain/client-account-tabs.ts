import type { LocationQuery, LocationQueryRaw, LocationQueryValue } from 'vue-router'

export const CLIENT_ACCOUNT_TAB_VALUES = [
  'informations',
  'paiements',
  'preferences'
] as const

export type ClientAccountTabValue = typeof CLIENT_ACCOUNT_TAB_VALUES[number]

export type ClientAccountTabItem = {
  label: string
  value: ClientAccountTabValue
  icon: string
  slot: ClientAccountTabValue
}

export const CLIENT_ACCOUNT_TABS: ClientAccountTabItem[] = [
  { label: 'Informations', value: 'informations', icon: 'i-lucide-user', slot: 'informations' },
  { label: 'Paiements', value: 'paiements', icon: 'i-lucide-receipt', slot: 'paiements' },
  { label: 'Préférences', value: 'preferences', icon: 'i-lucide-settings', slot: 'preferences' }
]

const DEFAULT_CLIENT_ACCOUNT_TAB: ClientAccountTabValue = 'informations'

export function parseClientAccountTab(
  input: LocationQueryValue | LocationQueryValue[] | undefined
): ClientAccountTabValue {
  const candidate = Array.isArray(input) ? input[0] : input

  if (!candidate) return DEFAULT_CLIENT_ACCOUNT_TAB

  return CLIENT_ACCOUNT_TAB_VALUES.includes(candidate as ClientAccountTabValue)
    ? (candidate as ClientAccountTabValue)
    : DEFAULT_CLIENT_ACCOUNT_TAB
}

export function buildClientAccountTabQuery(
  query: LocationQuery,
  nextTab: ClientAccountTabValue
): LocationQueryRaw {
  const nextQuery: LocationQueryRaw = { ...query }

  if (nextTab === DEFAULT_CLIENT_ACCOUNT_TAB) {
    delete nextQuery.tab
    return nextQuery
  }

  nextQuery.tab = nextTab
  return nextQuery
}
