export type PublicHeaderVariant = 'marketing' | 'coach' | 'white-label'
export type PublicHeaderLayoutStyle = 'bar' | 'dock'

export type PublicHeaderLink = {
  label: string
  href: string
}

export type PublicHeaderState = {
  variant: PublicHeaderVariant
  layoutStyle: PublicHeaderLayoutStyle
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
  layoutStyle: 'bar',
  brandLabel: 'Kaora',
  brandTo: '/',
  showBrandIcon: true,
  navLinks: [
    { label: 'L\'Essence', href: '#essence' },
    { label: 'Atelier', href: '#atelier' },
    { label: 'Parcours', href: '#parcours' }
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
