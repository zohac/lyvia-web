import { computed, reactive } from 'vue'
import type { ComputedRef, DeepReadonly, Ref } from 'vue'

import {
  getCoachPageExternalEditorSection,
  hasCoachFreeTextContent,
  isCoachPageAlwaysOnSection,
  isCoachPageInlineEditorSection
} from './domain/coach-page-editor'
import { snapshotSectionsConfig, applySectionsConfigSnapshot } from './section-config-rollback'
import type {
  FreeTextJson,
  ProviderAccountResponse
} from '../account/api/provider-account.contract'
import type { SectionTitlesJson } from '../seo/api/public-provider-profile.contract'

/**
 * CPD.8 — État de l'éditeur de sections de `/provider/coach-page` : ordre
 * d'affichage, titres de section, prédicats et bascule optimiste debouncée.
 *
 * Extrait de la page pour que la bascule, son debounce de 500 ms et son
 * rollback cessent d'être prouvés par des regex et s'exécutent en test.
 *
 * Trois invariants non évidents sont conservés ici volontairement :
 *
 * 1. Le snapshot de rollback est pris **une seule fois par fenêtre de debounce**
 *    (`pendingPreviousSnapshot === null`), et il représente la dernière valeur
 *    confirmée par le serveur : deux bascules rapides qui échouent reviennent à
 *    l'état d'avant la première, pas d'avant la seconde.
 * 2. Le verrou du bloc libre n'interdit QUE l'activation (`!isSectionOn`) : un
 *    bloc déjà allumé reste désactivable même vidé, sinon une coach qui a tout
 *    effacé se retrouve avec une bascule ON verrouillée et une raison
 *    (« écrivez d'abord… ») qui lui interdit d'en sortir (correctif `yb-1-1`, I3).
 * 3. Le corps du bloc libre reste déplié même éteint : c'est là qu'on l'écrit,
 *    et un interrupteur verrouillé sur un corps replié est un cul-de-sac.
 *
 * `saveSectionsConfig` appartient toujours au store `useCoachPageEditor` : le
 * composable l'injecte, il n'ouvre pas un second chemin d'écriture.
 */

export const TOGGLE_AUTOSAVE_DEBOUNCE_MS = 500

export const FREE_TEXT_LOCK_REASON
  = 'Écrivez d’abord un titre ou un paragraphe pour pouvoir activer cette section.'

/**
 * CPD.8 — Ordre d'affichage de l'éditeur (PO 2026-05-02). `freeText` est figé
 * entre `benefits` et `bio` : c'est une inscription de l'AD-7, pas un défaut.
 */
export const DISPLAY_SECTION_ORDER = [
  'hero',
  'problemStatement',
  'benefits',
  'freeText',
  'bio',
  'certifications',
  'testimonials',
  'pillars',
  'howItWorks',
  'fit',
  'pricing',
  'educationalContent',
  'faq',
  'disclaimer'
] as const

function sortByDisplayOrder(sections: readonly string[]): string[] {
  const ordered: string[] = []
  for (const s of DISPLAY_SECTION_ORDER) {
    if (sections.includes(s)) ordered.push(s)
  }
  for (const s of sections) {
    if (!ordered.includes(s)) ordered.push(s)
  }
  return ordered
}

/** Forme minimale du store `createCoachPageEditor` consommée par le composable. */
export interface CoachSectionsEditorDep {
  sectionsConfig?: Record<string, boolean>
  configurableSections?: ComputedRef<readonly string[]> | Ref<readonly string[]> | readonly string[]
  editableSections?: ComputedRef<readonly string[]> | Ref<readonly string[]> | readonly string[]
  isAlwaysOn?: (section: string) => boolean
  isSectionOn?: (section: string) => boolean
  saveSectionsConfig?: () => Promise<boolean>
  freeTextForm?: Ref<FreeTextJson | null> | FreeTextJson | null
  account?:
    | Readonly<Ref<DeepReadonly<ProviderAccountResponse> | null>>
    | { sectionsConfig?: Record<string, boolean> | null }
    | null
}

/**
 * Dépendances injectables. Chaque valeur absente est résolue depuis `editor`;
 * l'absence des deux est une erreur de câblage et lève, plutôt que de dégrader
 * en succès silencieux (une bascule qui « enregistre » sans rien écrire est
 * indétectable à l'écran).
 */
/** Couleurs utilisées par les deux toasts d'auto-save (sous-ensemble de l'union Nuxt UI). */
export interface CoachSectionsToastOptions {
  title: string
  color?: 'primary' | 'error'
}

export interface CoachSectionsToast {
  add?: (options: CoachSectionsToastOptions) => unknown
}

export interface CoachSectionsDeps extends CoachSectionsEditorDep {
  editor?: CoachSectionsEditorDep
  toast?: CoachSectionsToast
}

function unwrap<T>(v: unknown): T {
  if (v && typeof v === 'object' && 'value' in (v as object)) {
    return (v as { value: T }).value
  }
  if (typeof v === 'function') {
    return (v as () => T)()
  }
  return v as T
}

function toSectionsArray(v: unknown): string[] {
  const u = unwrap<unknown>(v)
  if (Array.isArray(u)) return [...u]
  return []
}

/** Clés de `SectionTitlesJson` que l'éditeur expose (les autres n'ont pas de champ). */
export type CoachSectionTitleKey
  = | 'bioEyebrow'
    | 'bioTitle'
    | 'benefitsEyebrow'
    | 'benefitsTitle'
    | 'problemStatement'
    | 'problemStatementEyebrow'
    | 'problemStatementTitle'
    | 'pillarsEyebrow'
    | 'pillarsTitle'
    | 'howItWorksEyebrow'
    | 'howItWorksTitle'
    | 'testimonialsEyebrow'
    | 'testimonialsTitle'
    | 'pricingEyebrow'
    | 'pricingTitle'
    | 'faqEyebrow'
    | 'faqTitle'

/**
 * CPD.8 — Dérivé du contrat public (`SectionTitlesJson`) au lieu d'être recopié :
 * un champ ajouté au contrat ne peut plus être silencieusement ignoré ici.
 * `Required` parce que l'éditeur alimente tous ses champs (valeurs vides par défaut).
 */
export type CoachSectionTitles = Required<Pick<SectionTitlesJson, CoachSectionTitleKey>>

export interface CoachSections {
  orderedEditableSections: ComputedRef<string[]>
  orderedAlwaysOnSections: ComputedRef<string[]>
  sectionTitles: CoachSectionTitles
  hasEditor: (section: string) => boolean
  isSectionOn: (section: string) => boolean
  isFreeTextSection: (section: string) => boolean
  isSectionLocked: (section: string) => boolean
  sectionLockReason: (section: string) => string | null
  isSectionBodyOpen: (section: string) => boolean
  externalSection: (section: string) => ReturnType<typeof getCoachPageExternalEditorSection>
  externalSectionTo: (section: string) => string
  onToggleSection: (section: string, value: boolean) => void
  flushPendingToggle: () => void
}

function emptySectionTitles(): CoachSectionTitles {
  return {
    bioEyebrow: '',
    bioTitle: '',
    benefitsEyebrow: '',
    benefitsTitle: '',
    problemStatement: '',
    problemStatementEyebrow: '',
    problemStatementTitle: '',
    pillarsEyebrow: '',
    pillarsTitle: '',
    howItWorksEyebrow: '',
    howItWorksTitle: '',
    testimonialsEyebrow: '',
    testimonialsTitle: '',
    pricingEyebrow: '',
    pricingTitle: '',
    faqEyebrow: '',
    faqTitle: ''
  }
}

export function createCoachSections(deps: CoachSectionsDeps = {}): CoachSections {
  const editor = deps.editor

  const resolvedSectionsConfig = deps.sectionsConfig ?? editor?.sectionsConfig
  if (!resolvedSectionsConfig) {
    throw new Error('useCoachSections: `sectionsConfig` is required (pass the editor store or the object).')
  }
  const sectionsConfig: Record<string, boolean> = resolvedSectionsConfig

  const resolvedSaveSectionsConfig = deps.saveSectionsConfig ?? editor?.saveSectionsConfig
  if (!resolvedSaveSectionsConfig) {
    throw new Error('useCoachSections: `saveSectionsConfig` is required (pass the editor store or the function).')
  }
  const saveSectionsConfigFn: () => Promise<boolean> = resolvedSaveSectionsConfig

  const configurableSectionsSource = deps.configurableSections ?? editor?.configurableSections ?? []
  const editableSectionsSource = deps.editableSections ?? editor?.editableSections ?? []

  const isAlwaysOnFn = deps.isAlwaysOn ?? editor?.isAlwaysOn ?? isCoachPageAlwaysOnSection

  const isSectionOnFn = deps.isSectionOn
    ?? editor?.isSectionOn
    ?? ((section: string) => (isAlwaysOnFn(section) ? true : sectionsConfig[section] !== false))

  const toastObj = deps.toast
  if (!toastObj) {
    throw new Error('useCoachSections: `toast` is required (pass the editor store or a toast adapter).')
  }
  const addToast = toastObj.add?.bind(toastObj)

  const freeTextFormSource = deps.freeTextForm ?? editor?.freeTextForm ?? null
  const accountSource = deps.account ?? editor?.account ?? null

  const sectionTitles = reactive(emptySectionTitles())

  const orderedEditableSections = computed(() =>
    sortByDisplayOrder(toSectionsArray(editableSectionsSource))
  )
  const orderedAlwaysOnSections = computed(() =>
    sortByDisplayOrder(toSectionsArray(configurableSectionsSource).filter(isAlwaysOnFn))
  )

  let saveDebounceTimer: ReturnType<typeof setTimeout> | null = null
  let pendingPreviousSnapshot: Record<string, boolean> | null = null

  /**
   * Dernière valeur confirmée par le serveur (cf. `section-config-rollback.ts`).
   * Le miroir réactif fait foi tant que le compte n'est pas chargé ou ne porte
   * pas encore de `sectionsConfig`.
   */
  function confirmedSectionsConfig(): Record<string, boolean> {
    const acc = unwrap<{ sectionsConfig?: Record<string, boolean> | null } | null>(accountSource)
    return acc?.sectionsConfig ?? sectionsConfig
  }

  function hasFreeTextContent(): boolean {
    return hasCoachFreeTextContent(
      unwrap<FreeTextJson | null>(freeTextFormSource)
    )
  }

  function isFreeTextSection(section: string): boolean {
    return section === 'freeText'
  }

  function isSectionLocked(section: string): boolean {
    return isFreeTextSection(section)
      && !isSectionOnFn(section)
      && !hasFreeTextContent()
  }

  function sectionLockReason(section: string): string | null {
    return isSectionLocked(section) ? FREE_TEXT_LOCK_REASON : null
  }

  function isSectionBodyOpen(section: string): boolean {
    return isSectionOnFn(section) || isFreeTextSection(section)
  }

  function externalSection(section: string) {
    return getCoachPageExternalEditorSection(section)
  }

  function externalSectionTo(section: string): string {
    return getCoachPageExternalEditorSection(section)?.to ?? ''
  }

  function onToggleSection(section: string, value: boolean) {
    if (isAlwaysOnFn(section)) return
    // Snapshot ONCE per debounce window — first toggle captures the rollback state.
    if (pendingPreviousSnapshot === null) {
      pendingPreviousSnapshot = snapshotSectionsConfig(confirmedSectionsConfig())
    }
    sectionsConfig[section] = value
    scheduleSectionsConfigSave()
  }

  function scheduleSectionsConfigSave() {
    if (saveDebounceTimer) clearTimeout(saveDebounceTimer)
    saveDebounceTimer = setTimeout(() => {
      saveDebounceTimer = null
      void flushSectionsConfigSave()
    }, TOGGLE_AUTOSAVE_DEBOUNCE_MS)
  }

  async function flushSectionsConfigSave() {
    const previous = pendingPreviousSnapshot
    pendingPreviousSnapshot = null
    const ok = await saveSectionsConfigFn()
    if (ok) {
      addToast?.({ title: 'Configuration enregistrée', color: 'primary' })
    } else {
      if (previous) {
        applySectionsConfigSnapshot(sectionsConfig, previous)
      }
      addToast?.({ title: 'Impossible d\'enregistrer la configuration', color: 'error' })
    }
  }

  function flushPendingToggle() {
    if (saveDebounceTimer) {
      clearTimeout(saveDebounceTimer)
      saveDebounceTimer = null
    }
    if (pendingPreviousSnapshot !== null) {
      void flushSectionsConfigSave()
    }
  }

  function hasEditor(section: string): boolean {
    return isCoachPageInlineEditorSection(section)
  }

  return {
    orderedEditableSections,
    orderedAlwaysOnSections,
    sectionTitles,
    hasEditor,
    isSectionOn: isSectionOnFn,
    isFreeTextSection,
    isSectionLocked,
    sectionLockReason,
    isSectionBodyOpen,
    externalSection,
    externalSectionTo,
    onToggleSection,
    flushPendingToggle
  }
}

export function useCoachSections(deps?: CoachSectionsDeps): CoachSections {
  return createCoachSections(deps ?? {})
}
