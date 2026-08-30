import { useAuthState } from '../../auth/state/auth.state'
import { useFeatureGate } from '../../plans/useFeatureGate'
import { registerSupport401Handler } from '../../../services/api/support-auth-recovery'
import {
  createSupportSessionCoordinator,
  type SupportSessionCoordinator
} from './create-support-session-coordinator'

const SUPPORT_COORDINATOR_KEY = '__lyvia_support_coordinator__'

export function useSupportSession() {
  const nuxtApp = useNuxtApp()
  const authState = useAuthState()
  const featureGate = useFeatureGate()

  // Singleton per Nuxt instance
  const nuxtAppRecord = nuxtApp as unknown as Record<string, unknown>
  let coordinator = nuxtAppRecord[SUPPORT_COORDINATOR_KEY] as SupportSessionCoordinator | undefined

  if (!coordinator) {
    coordinator = createSupportSessionCoordinator({
      transport: {
        post: async (url, opts) => {
          return await $fetch(url, {
            baseURL: '/api',
            method: 'POST',
            credentials: 'include',
            headers: opts?.headers
          })
        },
        get: async (url, opts) => {
          return await $fetch(url, {
            baseURL: '/api',
            method: 'GET',
            credentials: 'include',
            headers: opts?.headers
          })
        }
      },
      authStateRef: authState,
      invalidateFeatureGate: () => {
        featureGate.invalidate()
      },
      navigation: {
        navigateTo: async (path, options) => {
          if (options?.query) {
            await navigateTo({ path, query: options.query })
          } else {
            await navigateTo(path)
          }
        }
      },
      visibility: import.meta.client
        ? {
            isVisible: () => document.visibilityState === 'visible',
            onVisibilityChange: (cb) => {
              const handler = () => {
                cb(document.visibilityState === 'visible')
              }
              document.addEventListener('visibilitychange', handler)
              return () => {
                document.removeEventListener('visibilitychange', handler)
              }
            }
          }
        : undefined,
      register401Handler: registerSupport401Handler
    })

    nuxtAppRecord[SUPPORT_COORDINATOR_KEY] = coordinator
  }

  const isSupportActive = computed(() => {
    const session = authState.value.supportSession
    return session?.phase === 'active' || session?.phase === 'ending' || session?.phase === 'restoring'
  })

  const supportSession = computed(() => authState.value.supportSession ?? null)

  const isEndingOrRestoring = computed(() => {
    const phase = authState.value.supportSession?.phase
    return phase === 'ending' || phase === 'restoring'
  })

  return {
    isSupportActive,
    supportSession,
    isEndingOrRestoring,
    start: (providerProfileId: string) => coordinator!.start(providerProfileId),
    end: () => coordinator!.end(),
    restoreAdmin: () => coordinator!.restoreAdmin()
  }
}
