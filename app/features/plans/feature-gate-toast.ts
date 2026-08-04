import {
  FEATURE_GATE_CTA_LABEL,
  FEATURE_GATE_TOAST_TITLE,
  KEOVA_CONTACT_MAILTO
} from './domain/feature-gate-copy'

/**
 * Story 18.2 — Toast global déclenché par un 403 `FEATURE_NOT_AVAILABLE`.
 *
 * Appelé depuis le `catch` d'`apiFetch` : 100 % des appels API y passent, donc
 * aucune surface gatée ne peut échouer silencieusement, même si elle n'est pas
 * (encore) enveloppée par `<FeatureGate>`.
 *
 * Le toast est volontairement générique : `apiFetch` ne recopie que
 * `code`/`message`/`details` dans `ApiFetchError`, et le wording ne dépend pas
 * de la feature refusée. Le nom du plan requis est affiché par le panneau lock,
 * qui le tire de `FEATURE_MIN_PLAN_LABEL`.
 */

/** Fenêtre anti-empilement : une page qui déclenche 5 appels gatés d'affilée
 * (dashboard, éditeur multi-sections) ne doit pas empiler 5 toasts identiques. */
const TOAST_COOLDOWN_MS = 3_000

/**
 * Module-scope : la déduplication doit survivre entre deux appels `apiFetch`,
 * qui n'ont aucun état partagé.
 */
let lastNotifiedAt = 0

/** Réinitialise le garde anti-spam (tests uniquement). */
export function resetFeatureGateToastThrottle(): void {
  lastNotifiedAt = 0
}

/**
 * Instance Nuxt enregistrée au démarrage par `plugins/feature-gate-toast.client.ts`.
 *
 * 🚨 Indispensable, découvert en vérification browser (A35) : `useNuxtApp()`
 * lève « instance unavailable » quand `apiFetch` est appelé depuis un
 * gestionnaire d'événement (clic « Enregistrer »), et non depuis un `setup()`
 * ou un plugin. C'est précisément le cas de tous les appels gatés. La capture
 * faite par `apiFetch` avant son `try` couvre les appels issus d'un setup ; ce
 * repli couvre les autres, qui sont la majorité.
 */
let registeredNuxtApp: FeatureGateToastContext | null = null

/**
 * Contrat minimal : seul `runWithContext` est utilisé.
 *
 * Typage structurel volontaire — `defineNuxtPlugin` fournit un `_NuxtApp` que
 * TypeScript ne juge pas assignable au `NuxtApp` de `useNuxtApp()`. Ne dépendre
 * que de la méthode réellement appelée évite un cast.
 */
export type FeatureGateToastContext = Pick<
  ReturnType<typeof useNuxtApp>,
  'runWithContext'
>

export function registerFeatureGateToastContext(
  nuxtApp: FeatureGateToastContext
): void {
  registeredNuxtApp = nuxtApp
}

export function notifyFeatureGate(
  nuxtApp: FeatureGateToastContext | null
): void {
  const context = nuxtApp ?? registeredNuxtApp

  // Contexte indisponible (appel hors cycle Nuxt, SSR) : on renonce au toast
  // plutôt que de lever une seconde erreur par-dessus le 403.
  if (!context) return

  const now = Date.now()
  if (now - lastNotifiedAt < TOAST_COOLDOWN_MS) return
  lastNotifiedAt = now

  // `runWithContext` est obligatoire : `notifyFeatureGate` est appelé APRÈS un
  // `await` dans `apiFetch`, où l'instance Nuxt courante n'est plus établie —
  // `useToast()` (basé sur `useState`) lèverait « instance unavailable » sans
  // ce wrapper.
  context.runWithContext(() => {
    useToast().add({
      title: FEATURE_GATE_TOAST_TITLE,
      color: 'error',
      actions: [
        {
          label: FEATURE_GATE_CTA_LABEL,
          onClick: () => {
            window.location.href = KEOVA_CONTACT_MAILTO
          }
        }
      ]
    })
  })
}
