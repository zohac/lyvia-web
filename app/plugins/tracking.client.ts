/**
 * Google Ads + Microsoft Clarity — unified tracking orchestrator plugin.
 *
 * The entry chunk contains ONLY the hook registration (~3 lines).
 * All NuxtData resolution, consent logic, and runtime injection are
 * lazy-imported via tracking-mount.ts on first mount / page navigation.
 */
export default defineNuxtPlugin(() => {
  const nuxtApp = useNuxtApp()
  const mount = () => import('~/features/tracking/tracking-mount').then(m => m.mountTracking())
  nuxtApp.hook('app:mounted', () => void mount())
  nuxtApp.hook('page:finish', () => void mount())
})
