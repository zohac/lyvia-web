export type ClientNavigationMatch = 'exact' | 'prefix'

export type ClientNavigationItem = {
  label: string
  to: string
  icon: string
  match: ClientNavigationMatch
}

export type ClientNavigationGroup = {
  key: string
  label: string
  defaultOpen: boolean
  items: ClientNavigationItem[]
}

export type ClientNavigation = {
  home: ClientNavigationItem
  groups: ClientNavigationGroup[]
}

export const CLIENT_NAVIGATION: ClientNavigation = {
  home: {
    label: 'Accueil',
    to: '/client/dashboard',
    icon: 'lucide:home',
    match: 'exact'
  },
  groups: [
    {
      key: 'principal',
      label: '',
      defaultOpen: true,
      items: [
        {
          label: 'Mes rendez-vous',
          to: '/client/consultation',
          icon: 'lucide:calendar',
          match: 'prefix'
        },
        {
          label: 'Mon compte',
          to: '/client/account',
          icon: 'lucide:user',
          match: 'prefix'
        }
      ]
    }
  ]
}

export function getClientNavigationItems(): ClientNavigationItem[] {
  return [CLIENT_NAVIGATION.home, ...CLIENT_NAVIGATION.groups.flatMap(group => group.items)]
}
