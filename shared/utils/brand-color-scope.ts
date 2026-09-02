import { onScopeDispose, watch } from 'vue'
import type { WatchSource } from 'vue'

import { applyBrandColors, removeBrandColors, shouldInjectBrandColor } from './brand-color-helpers'
import type { CSSStyleSetter } from './brand-color-helpers'

/**
 * Keeps brand CSS variables in sync with reactive brand primary and accent color sources and
 * guarantees cleanup when the current Vue scope is disposed.
 */
export function bindBrandColorScope(
  style: CSSStyleSetter,
  brandColor: WatchSource<string | null | undefined>,
  isEnabled = true,
  brandAccentColor?: WatchSource<string | null | undefined>
): void {
  const update = () => {
    const primary = typeof brandColor === 'function' ? brandColor() : brandColor.value
    const accent = brandAccentColor ? (typeof brandAccentColor === 'function' ? brandAccentColor() : brandAccentColor.value) : undefined

    const hasPrimary = shouldInjectBrandColor(isEnabled, primary)
    const hasAccent = shouldInjectBrandColor(isEnabled, accent)

    if (hasPrimary || hasAccent) {
      applyBrandColors(
        style,
        hasPrimary ? primary : undefined,
        hasAccent ? accent : undefined
      )
    } else {
      removeBrandColors(style)
    }
  }

  const sources: WatchSource<string | null | undefined>[] = [brandColor]
  if (brandAccentColor) sources.push(brandAccentColor)

  watch(sources, update, { immediate: true })

  onScopeDispose(() => {
    removeBrandColors(style)
  })
}
