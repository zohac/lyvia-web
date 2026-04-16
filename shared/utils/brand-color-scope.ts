import { onScopeDispose, watch } from 'vue'
import type { WatchSource } from 'vue'

import { applyBrandColors, removeBrandColors, shouldInjectBrandColor } from './brand-color-helpers'
import type { CSSStyleSetter } from './brand-color-helpers'

/**
 * Keeps brand CSS variables in sync with a reactive brand color source and
 * guarantees cleanup when the current Vue scope is disposed.
 */
export function bindBrandColorScope(
  style: CSSStyleSetter,
  brandColor: WatchSource<string | null | undefined>,
  isEnabled = true
): void {
  watch(
    brandColor,
    (nextBrandColor) => {
      if (shouldInjectBrandColor(isEnabled, nextBrandColor)) {
        applyBrandColors(style, nextBrandColor)
      } else {
        removeBrandColors(style)
      }
    },
    { immediate: true }
  )

  onScopeDispose(() => {
    removeBrandColors(style)
  })
}
