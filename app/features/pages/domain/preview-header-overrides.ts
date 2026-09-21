/**
 * V2.2e — Pure builders for the private page preview.
 *
 * `buildPreviewHeaderOverrides` produces the white-label header/footer
 * overrides from the coach account (shared by the editor and the list screens);
 * `isPreviewEnabled` is the single predicate both screens use to keep the
 * preview action disabled until the account resolves.
 */
import type { PublicHeaderState } from '../../public/state/public-header.state'

export interface PreviewHeaderAccount {
  brandName?: string | null
  firstname?: string | null
  logoUrl?: string | null
}

/** The preview needs a resolved account to build its brand envelope. */
export function isPreviewEnabled(
  account: PreviewHeaderAccount | null | undefined
): boolean {
  return account != null
}

/**
 * Builds the overrides from the coach account. Returns `null` when the account
 * is not resolved yet, so callers keep the preview action disabled instead of
 * falling back to the default (Keova) envelope.
 */
export function buildPreviewHeaderOverrides(
  account: PreviewHeaderAccount | null | undefined
): Partial<PublicHeaderState> | null {
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
