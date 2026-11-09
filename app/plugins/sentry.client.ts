/**
 * Sentry browser SDK — thin plugin.
 *
 * The entry chunk contains ONLY the hook registration. All SDK resolution and
 * initialisation are lazy-imported via sentry-mount.ts on first mount /
 * page navigation, on the model of app/plugins/tracking.client.ts.
 */
export default defineNuxtPlugin(() => {
  const nuxtApp = useNuxtApp()
  const mount = () => import('~/features/observability/sentry-mount')
    .then(module => module.mountSentry(nuxtApp.vueApp))
    .catch(() => {
      // Observability must never break the page: a blocked chunk or a failing
      // import stays silent rather than surfacing an unhandled rejection.
    })
  nuxtApp.hook('app:mounted', () => void mount())
  nuxtApp.hook('page:finish', () => void mount())
})
