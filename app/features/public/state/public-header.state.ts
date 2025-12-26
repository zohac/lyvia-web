export type PublicHeaderVariant = 'marketing' | 'coach' | 'white-label'

export type PublicHeaderLink = {
  label: string
  href: string
}

export type PublicHeaderState = {
  variant: PublicHeaderVariant
  brandLabel: string
  brandTo: string
  showBrandIcon: boolean
  navLinks: PublicHeaderLink[]
  loginLabel: string
  loginTo: string
  ctaLabel: string
  ctaTo: string
}

const DEFAULT_HEADER_STATE: PublicHeaderState = {
  variant: 'marketing',
  brandLabel: 'Kaora',
  brandTo: '/',
  showBrandIcon: true,
  navLinks: [
    { label: 'Fonctionnalités', href: '#features' },
    { label: 'Pour qui ?', href: '#pour-qui' }
  ],
  loginLabel: 'Se connecter',
  loginTo: '/login',
  ctaLabel: 'Essayer Kaora',
  ctaTo: '/login'
}

export function usePublicHeaderState() {
  return useState<PublicHeaderState>('public:header', () => ({ ...DEFAULT_HEADER_STATE }))
}

export function setPublicHeader(state: Partial<PublicHeaderState>) {
  const header = usePublicHeaderState()
  header.value = { ...header.value, ...state }
}

