/**
 * Y2.6 AC-6: Exit intent detection (desktop only).
 * Fires once per session when the mouse leaves the viewport from the top.
 * Not triggered on mobile (mouseleave is unreliable on touch devices).
 */
export function useExitIntent(options: {
  onTrigger: () => void
  storageKey: string
}) {
  if (import.meta.server) return

  onMounted(() => {
    // Skip if already shown this session
    const shown = sessionStorage.getItem(options.storageKey)
    if (shown) return

    const handler = (e: MouseEvent) => {
      if (e.clientY <= 0) {
        options.onTrigger()
        sessionStorage.setItem(options.storageKey, 'true')
        document.documentElement.removeEventListener('mouseleave', handler)
      }
    }

    document.documentElement.addEventListener('mouseleave', handler)

    // Cleanup on unmount
    onUnmounted(() => {
      document.documentElement.removeEventListener('mouseleave', handler)
    })
  })
}
