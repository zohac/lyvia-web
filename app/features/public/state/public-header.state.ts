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
  brandLogoSrc?: string
  brandTo: string
  showBrandIcon: boolean
  navLinks: PublicHeaderLink[]
  loginLabel: string
  loginTo: string
  ctaLabel: string
  ctaTo: string
}

export const DEFAULT_HEADER_STATE: PublicHeaderState = {
  variant: 'marketing',
  layoutStyle: 'dock',
  brandLabel: 'Keova',
  brandTo: '/',
  showBrandIcon: true,
  // ⚠️ Doit rester identique à `app/pages/index.vue` et `usePublicHeaderInit.ts`
  // (voir le commentaire dans index.vue : divergence = flicker de la nav au paint).
  navLinks: [
    { label: 'Le problème', href: '#pourquoi' },
    { label: 'La solution', href: '#atelier' },
    { label: 'Témoignages', href: '#temoignage' },
    { label: 'Tarifs', href: '#tarifs' },
    { label: 'FAQ', href: '#faq' }
  ],
  loginLabel: 'Se connecter',
  loginTo: '/login',
  ctaLabel: 'Je réserve ma place',
  ctaTo: '#waitlist'
}

export function usePublicHeaderState() {
  return useState<PublicHeaderState>('public:header', () => ({ ...DEFAULT_HEADER_STATE }))
}

export function setPublicHeader(state: Partial<PublicHeaderState>) {
  const header = usePublicHeaderState()
  header.value = { ...header.value, ...state }
}
