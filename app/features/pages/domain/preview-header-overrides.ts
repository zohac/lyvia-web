/**
 * V2.2e — Pure builder for the brand envelope of the private page preview.
 *
 * Extracted from `[id].vue` / `index.vue` (was duplicated verbatim) so the
 * white-label header/footer overrides are built in one place and unit-tested.
 * The returned object is structurally assignable to
 * `Partial<PublicHeaderState>` without importing the Nuxt-bound state module.
 */

export interface PreviewHeaderAccount {
  brandName?: string | null
  firstname?: string | null
  logoUrl?: string | null
}

export interface PreviewHeaderOverrides {
  variant: 'white-label'
  layoutStyle: 'dock'
  brandLabel: string
  brandLogoSrc?: string
  brandTo: string
  showBrandIcon: boolean
  navLinks: { label: string, href: string }[]
  loginLabel: string
  loginTo: string
  ctaLabel: string
  ctaTo: string
}

/**
 * Builds the overrides from the coach account. Returns `null` when the account
 * is not resolved yet, so callers can keep the preview action disabled instead
 * of falling back to the default (Keova) envelope.
 */
export function buildPreviewHeaderOverrides(
  account: PreviewHeaderAccount | null | undefined
): PreviewHeaderOverrides | null {
  if (!account) return null

  return {
    variant: 'white-label',
    layoutStyle: 'dock',
    brandLabel: account.brandName?.trim() || account.firstname?.trim() || 'Votre coach',
    brandLogoSrc: account.logoUrl ?? undefined,
    brandTo: '#',
    showBrandIcon: false,
    navLinks: [],
    loginLabel: 'Espace cliente',
    loginTo: '#',
    ctaLabel: 'Prendre RDV',
    ctaTo: '#'
  }
}
