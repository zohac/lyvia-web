/**
 * Sentry browser SDK — thin plugin.
 *
 * The entry chunk contains ONLY the hook registration. All SDK resolution and
 * initialisation are lazy-imported via sentry-mount.ts on first mount /
 * page navigation, on the model of app/plugins/tracking.client.ts.
 */
export default defineNuxtPlugin(() => {
  const nuxtApp = useNuxtApp()
  const mount = () => import('~/features/observability/sentry-mount').then(m => m.mountSentry())
  nuxtApp.hook('app:mounted', () => void mount())
  nuxtApp.hook('page:finish', () => void mount())
})
