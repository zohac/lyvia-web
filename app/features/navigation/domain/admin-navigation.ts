export type AdminNavigationItem = {
  label: string
  to: string
  icon: string
  match: 'exact' | 'prefix'
}

export type AdminNavigationGroup = {
  key: string
  label: string
  defaultOpen: boolean
  items: AdminNavigationItem[]
}

export type AdminNavigationConfig = {
  home: AdminNavigationItem
  groups: AdminNavigationGroup[]
}

export const ADMIN_NAVIGATION: AdminNavigationConfig = {
  home: {
    label: 'Dashboard',
    to: '/admin/dashboard',
    icon: 'lucide:layout-dashboard',
    match: 'exact'
  },
  groups: [
    {
      key: 'principal',
      label: '',
      defaultOpen: true,
      items: [
        {
          label: 'Providers',
          to: '/admin/providers',
          icon: 'lucide:users',
          match: 'prefix'
        },
        {
          label: 'Clients',
          to: '/admin/clients',
          icon: 'lucide:contact',
          match: 'prefix'
        },
        {
          label: 'Outils',
          to: '/admin/tools',
          icon: 'lucide:wrench',
          match: 'prefix'
        },
        {
          label: 'Design System',
          to: '/admin/design-system',
          icon: 'lucide:palette',
          match: 'exact'
        }
      ]
    }
  ]
}

export function getAdminNavigationItems(): AdminNavigationItem[] {
  return [ADMIN_NAVIGATION.home, ...ADMIN_NAVIGATION.groups.flatMap(group => group.items)]
}
