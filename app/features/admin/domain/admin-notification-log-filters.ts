import type { LocationQuery, LocationQueryRaw } from 'vue-router'

/**
 * Vocabulaire des **motifs** d'une notification (WA.7, C1).
 *
 * Le motif est le code court déduit de `error_message` côté API. Il n'est
 * jamais le message brut : celui-ci peut porter un détail technique de
 * fournisseur, et la liste est une source de vérité **opérationnelle**, pas
 * technique. Le détail technique, c'est la vue de détail.
 *
 * `retryable` ne qualifie que les échecs **rejouables** (`status='failed'`
 * ET `error_message LIKE 'retryable=true;%'`) : son libellé est donc
 * « Échec rejouable ». Les échecs définitifs, eux, retombent dans
 * `other` (« Autre motif ») — d'où l'absence de libellé « Échec d'envoi », qui
 * promettrait plus que le motif ne dit.
 *
 * Cette liste est **croisée** avec l'enum du contrat API par
 * `scripts/contract-check-openapi-notification-logs.mjs` : un motif ajouté
 * d'un seul côté rendrait le filtre muet (422 côté API) ou non filtrable.
 */
export const NOTIFICATION_LOG_REASON_VALUES = [
  'honeypot_detected',
  'admin_email_not_configured',
  'reserved',
  'retryable',
  'other'
] as const

export type NotificationLogReasonValue = (typeof NOTIFICATION_LOG_REASON_VALUES)[number]

export type NotificationLogReasonOption = {
  value: NotificationLogReasonValue
  label: string
  activeClass: string
}

/**
 * Motifs proposés dans le filtre du panneau.
 *
 * `honeypot_detected` passe en premier : c'est le motif que le story cherche à
 * rendre lisible (un robot qui répète ses soumissions), et il doit être le
 * plus simple à isoler.
 */
export const NOTIFICATION_LOG_REASON_OPTIONS: NotificationLogReasonOption[] = [
  {
    value: 'honeypot_detected',
    label: 'Rejet robot',
    activeClass: 'bg-[color:var(--color-sunset-100)] text-[color:var(--color-sunset-700)]'
  },
  {
    value: 'admin_email_not_configured',
    label: 'Email admin non configuré',
    activeClass: 'bg-[color:var(--color-crepuscule-100)] text-[color:var(--color-crepuscule-700)]'
  },
  {
    value: 'retryable',
    label: 'Échec rejouable',
    activeClass: 'bg-[color:var(--color-error-100)] text-[color:var(--color-error-700)]'
  },
  {
    value: 'reserved',
    label: 'Réservé',
    activeClass: 'bg-[color:var(--color-neutral-100)] text-[color:var(--color-neutral-600)]'
  },
  {
    value: 'other',
    label: 'Autre motif',
    activeClass: 'bg-[color:var(--color-neutral-100)] text-[color:var(--color-neutral-600)]'
  }
]

/**
 * Libellé humain d'un motif.
 *
 * `—` quand il n'y a pas de motif : une ligne sans erreur n'a pas de motif, et
 * le tiret est le repli neutre du back-office (pas une valeur vide).
 */
export function getNotificationReasonLabel(reason: string | null): string {
  if (!reason) return '—'
  const option = NOTIFICATION_LOG_REASON_OPTIONS.find(item => item.value === reason)
  return option?.label ?? reason
}

/** Classes de pastille d'un motif — jeton neutre pour un motif inconnu. */
export function getNotificationReasonBadgeClasses(reason: string): string {
  const option = NOTIFICATION_LOG_REASON_OPTIONS.find(item => item.value === reason)
  return (
    option?.activeClass
    ?? 'bg-[color:var(--color-neutral-100)] text-[color:var(--color-neutral-600)]'
  )
}

export const NOTIFICATION_LOG_TYPE_VALUES = ['email', 'sms'] as const
export const NOTIFICATION_LOG_STATUS_VALUES = ['sent', 'failed', 'skipped'] as const

/**
 * Filtres du panneau des notifications admin.
 *
 * Les dates sont gardées dans la forme du `<input type="datetime-local">`
 * (`YYYY-MM-DDTHH:mm`, heure locale) : c'est ce que l'input peut afficher.
 * La conversion vers l'ISO se fait au moment de la requête.
 */
export type NotificationLogFilters = {
  type: string
  status: string
  reason: string
  dateFrom: string
  dateTo: string
}

const EMPTY_FILTERS: NotificationLogFilters = {
  type: '',
  status: '',
  reason: '',
  dateFrom: '',
  dateTo: ''
}

/**
 * Préfixe des paramètres d'URL du panneau.
 *
 * `/admin/tools` monte **plusieurs panneaux** (analytique, journal métier,
 * notifications, liste d'attente) qui partagent **le même espace d'URL** : un
 * nom générique comme `status` ou `type` y est ambigu, et le filtre de l'un
 * deviendrait le filtre de l'autre. Le panneau des notifications préfixe donc
 * ses paramètres — `notif_status`, `notif_type`, `notif_reason`,
 * `notif_dateFrom`, `notif_dateTo`.
 *
 * **Le préfixe ne concerne que l'URL du back-office.** Les paramètres envoyés
 * à l'API gardent leurs noms de contrat (`?reason=…`) : le contrat HTTP n'est
 * pas modifié par une collision d'URL, et ne doit pas l'être.
 */
const FILTER_QUERY_PREFIX = 'notif_'

/** Paramètres d'URL qui portent un filtre du panneau. */
const FILTER_QUERY_KEYS: readonly string[] = [
  `${FILTER_QUERY_PREFIX}type`,
  `${FILTER_QUERY_PREFIX}status`,
  `${FILTER_QUERY_PREFIX}reason`,
  `${FILTER_QUERY_PREFIX}dateFrom`,
  `${FILTER_QUERY_PREFIX}dateTo`
]

/**
 * La première valeur d'un paramètre d'URL, en texte.
 *
 * Accepte `unknown` : la même lecture sert pour une query **lue**
 * (`LocationQuery`) et une query **écrite** (`LocationQueryRaw`), dont les
 * types de valeurs diffèrent.
 */
function firstValue(value: unknown): string {
  if (Array.isArray(value)) return firstValue(value[0])
  if (typeof value !== 'string') return ''
  return value
}

function isOneOf<T extends string>(value: string, allowed: readonly T[]): value is T {
  return (allowed as readonly string[]).includes(value)
}

/**
 * Format de date **affichable** par `<input type="datetime-local">` :
 * `YYYY-MM-DDTHH:mm`, secondes optionnelles.
 *
 * Une date au format ISO (`2026-10-01T08:30:00.000Z`) serait **appliquée** à
 * la requête tout en restant **invisible** dans le panneau — l'URL et l'écran
 * seraient en désaccord. Elle est donc abandonnée.
 */
const DISPLAYABLE_DATE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/

/** Une date à la fois lisible et affichable — les autres sont abandonnées. */
function isDisplayableDate(value: string): boolean {
  if (!DISPLAYABLE_DATE.test(value)) return false
  return !Number.isNaN(new Date(value).getTime())
}

/**
 * Lit les filtres dans l'URL.
 *
 * Seuls les paramètres **préfixés** sont lus : un `?status=` ou un
 * `?reason=` générique appartient à un autre panneau (ou à personne) et ne
 * doit pas devenir un filtre des notifications.
 *
 * Les valeurs inconnues sont **abandonnées** : une URL éditée à la main ne
 * peut pas faire échouer la requête (l'API répondrait `422`), elle est
 * simplement sans effet.
 */
export function parseNotificationLogFilters(query: LocationQuery): NotificationLogFilters {
  const type = firstValue(query[`${FILTER_QUERY_PREFIX}type`])
  const status = firstValue(query[`${FILTER_QUERY_PREFIX}status`])
  const reason = firstValue(query[`${FILTER_QUERY_PREFIX}reason`])
  const dateFrom = firstValue(query[`${FILTER_QUERY_PREFIX}dateFrom`])
  const dateTo = firstValue(query[`${FILTER_QUERY_PREFIX}dateTo`])

  return {
    type: isOneOf(type, NOTIFICATION_LOG_TYPE_VALUES) ? type : '',
    status: isOneOf(status, NOTIFICATION_LOG_STATUS_VALUES) ? status : '',
    reason: isOneOf(reason, NOTIFICATION_LOG_REASON_VALUES) ? reason : '',
    dateFrom: isDisplayableDate(dateFrom) ? dateFrom : '',
    dateTo: isDisplayableDate(dateTo) ? dateTo : ''
  }
}

/**
 * Écrit les filtres dans l'URL, **sans toucher aux autres paramètres**
 * (`tab=notifications` doit survivre à un changement de filtre).
 *
 * Les paramètres **préfixés** du panneau sont réécrits ; les autres — dont
 * un `status=` générique qui appartient à un autre panneau — sont laissés
 * **tels quels**. Le panneau ne revendique plus que son propre espace.
 *
 * Un filtre vide est **retiré** de l'URL plutôt qu'écrit en vide : une URL
 * lisible reste une URL lisible.
 */
export function buildNotificationLogFilterQuery(
  current: LocationQuery,
  filters: NotificationLogFilters
): LocationQueryRaw {
  const next: LocationQueryRaw = {}

  // Les paramètres qui ne sont pas des filtres sont conservés tels quels…
  for (const [key, value] of Object.entries(current)) {
    if (FILTER_QUERY_KEYS.includes(key)) continue
    next[key] = value
  }

  // …et les filtres sont réécrits : une valeur vide disparaît de l'URL.
  if (filters.type) next[`${FILTER_QUERY_PREFIX}type`] = filters.type
  if (filters.status) next[`${FILTER_QUERY_PREFIX}status`] = filters.status
  if (filters.reason) next[`${FILTER_QUERY_PREFIX}reason`] = filters.reason
  if (filters.dateFrom) next[`${FILTER_QUERY_PREFIX}dateFrom`] = filters.dateFrom
  if (filters.dateTo) next[`${FILTER_QUERY_PREFIX}dateTo`] = filters.dateTo

  return next
}

/** Deux jeux de filtres sont-ils identiques ? */
export function sameNotificationLogFilters(
  a: NotificationLogFilters,
  b: NotificationLogFilters
): boolean {
  return (
    a.type === b.type
    && a.status === b.status
    && a.reason === b.reason
    && a.dateFrom === b.dateFrom
    && a.dateTo === b.dateTo
  )
}

/**
 * Les paramètres de filtre **présents** dans une query.
 *
 * Sert à comparer deux query : la query courante et celle que l'on s'apprête
 * à écrire. Sans cela, il faudrait comparer des objets `LocationQuery` dont
 * l'ordre des clés n'est pas garanti.
 */
export function notificationLogFilterQueryPart(
  query: LocationQuery | LocationQueryRaw
): Record<string, string> {
  const part: Record<string, string> = {}

  for (const key of FILTER_QUERY_KEYS) {
    const value = firstValue(query[key])
    if (value) part[key] = value
  }

  return part
}

/** Filtres vides — l'état par défaut d'un panneau. */
export function emptyNotificationLogFilters(): NotificationLogFilters {
  return { ...EMPTY_FILTERS }
}

/**
 * Paramètres de la requête API correspondant aux filtres.
 *
 * Les dates partent en ISO 8601 (l'API filtre sur des `timestamptz`), les
 * dates invalides sont **abandonnées** : une date illisible ne doit pas
 * faire échouer toute la requête.
 */
export function notificationLogFilterParams(
  filters: NotificationLogFilters
): Record<string, string> {
  const params: Record<string, string> = { limit: '20' }

  if (filters.type) params.type = filters.type
  if (filters.status) params.status = filters.status
  if (filters.reason) params.reason = filters.reason

  const dateFrom = toIsoDate(filters.dateFrom)
  if (dateFrom) params.dateFrom = dateFrom

  const dateTo = toIsoDate(filters.dateTo)
  if (dateTo) params.dateTo = dateTo

  return params
}

function toIsoDate(value: string): string | null {
  if (!value) return null
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return null
  return parsed.toISOString()
}
