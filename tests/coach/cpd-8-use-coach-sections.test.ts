import * as assert from 'node:assert/strict'
import { mock, describe, beforeEach, afterEach, test } from 'node:test'
import { ref } from 'vue'

import {
  createCoachSections,
  FREE_TEXT_LOCK_REASON
} from '../../app/features/coach/useCoachSections'
import { createCoachPageEditor } from '../../app/features/coach/createCoachPageEditor'
import type { CoachPageTemplate } from '../../app/features/coach/api/coach-page-template.contract'
import type {
  FreeTextJson,
  ProviderAccountResponse,
  UpdateProviderAccountRequest
} from '../../app/features/account/api/provider-account.contract'

/**
 * Story CPD.8 — le composable d'état des sections s'exécute, il n'est plus
 * décrit par des regex de page.
 *
 * Trois familles de preuves :
 *  - ordre / titres / prédicats (AC-1, AC-3) ;
 *  - bascule optimiste, debounce, rollback au snapshot d'avant la PREMIÈRE
 *    bascule, flush au démontage (AC-2), horloge factice obligatoire ;
 *  - câblage réel : un `createCoachPageEditor` complet, comme en production,
 *    pour que la chaîne de repli `editor.*` et la réactivité Vue soient
 *    réellement exercées (revue : `useCoachSections()` sans deps laissait
 *    2472/2472 vertes).
 */

const settle = () => new Promise(resolve => setImmediate(resolve))

const EDITABLE = [
  'problemStatement', 'benefits', 'freeText', 'bio', 'certifications',
  'testimonials', 'pillars', 'howItWorks', 'fit', 'pricing',
  'educationalContent', 'faq'
]

describe('cpd-8 — useCoachSections', () => {
  let savedConfigs: unknown[]
  let saveResult: boolean
  let toastCalls: unknown[]
  let sectionsConfig: Record<string, boolean>
  let saveSectionsConfig: () => Promise<boolean>
  let toast: { add: (o: unknown) => void }

  beforeEach(() => {
    mock.timers.enable({ apis: ['setTimeout'] })
    savedConfigs = []
    saveResult = true
    toastCalls = []
    sectionsConfig = { freeText: false, bio: true }
    saveSectionsConfig = async () => {
      savedConfigs.push({ ...sectionsConfig })
      return saveResult
    }
    toast = {
      add: (o: unknown) => {
        toastCalls.push(o)
      }
    }
  })

  afterEach(() => {
    mock.timers.reset()
  })

  // ── AC-1 — ordre ────────────────────────────────────────────────────────

  test('AC-1: orderedEditableSections rend un ordre litteral, depuis une entree desordonnee', () => {
    const c = createCoachSections({
      sectionsConfig,
      // Entrée volontairement désordonnée : une implémentation qui ne trie pas
      // rendrait l'ordre de l'API, pas l'ordre PO.
      editableSections: ['faq', 'bio', 'freeText', 'benefits', 'pricing', 'hero'],
      saveSectionsConfig,
      toast
    })
    assert.deepStrictEqual(
      c.orderedEditableSections.value,
      ['hero', 'benefits', 'freeText', 'bio', 'pricing', 'faq'],
      'l ordre complet de DISPLAY_SECTION_ORDER doit etre applique'
    )
  })

  test('AC-1: une section inconnue est conservee, apres les sections ordonnees', () => {
    const c = createCoachSections({
      sectionsConfig,
      editableSections: ['futureSection', 'bio', 'benefits'],
      saveSectionsConfig,
      toast
    })
    assert.deepStrictEqual(c.orderedEditableSections.value, ['benefits', 'bio', 'futureSection'])
  })

  test('AC-1: orderedAlwaysOnSections rend les sections toujours actives, triees', () => {
    const c = createCoachSections({
      sectionsConfig,
      configurableSections: ['pricing', 'disclaimer', 'bio', 'hero'],
      isAlwaysOn: s => s === 'hero' || s === 'disclaimer',
      saveSectionsConfig,
      toast
    })
    assert.deepStrictEqual(c.orderedAlwaysOnSections.value, ['hero', 'disclaimer'])
  })

  test('AC-1: sectionTitles est reactif', () => {
    const c = createCoachSections({ sectionsConfig, editableSections: EDITABLE, saveSectionsConfig, toast })
    c.sectionTitles.bioTitle = 'Hello'
    assert.equal(c.sectionTitles.bioTitle, 'Hello')
  })

  test('AC-1: une dependance manquante leve au lieu de degrader en succes silencieux', () => {
    assert.throws(() => createCoachSections({}), /sectionsConfig/, 'sectionsConfig absent')
    assert.throws(
      () => createCoachSections({ sectionsConfig, toast }),
      /saveSectionsConfig/,
      'saveSectionsConfig absent : sinon chaque bascule afficherait « Configuration enregistrée » sans rien écrire'
    )
    assert.throws(
      () => createCoachSections({ sectionsConfig, saveSectionsConfig }),
      /toast/,
      'toast absent : une erreur d enregistrement resterait invisible'
    )
  })

  // ── AC-2 — bascule optimiste, debounce, rollback ────────────────────────

  test('AC-2: onToggleSection applique immediatement et n ecrit rien avant 500 ms', () => {
    const c = createCoachSections({
      sectionsConfig,
      editableSections: EDITABLE,
      saveSectionsConfig,
      toast
    })
    c.onToggleSection('bio', false)
    assert.equal(sectionsConfig.bio, false, 'optimiste immediat')
    assert.equal(savedConfigs.length, 0, 'aucune ecriture avant 500 ms')
    mock.timers.tick(499)
    assert.equal(savedConfigs.length, 0, 'toujours rien a 499 ms')
  })

  test('AC-2: deux bascules rapides -> un seul save avec l etat final', () => {
    const c = createCoachSections({
      sectionsConfig,
      editableSections: EDITABLE,
      saveSectionsConfig,
      toast
    })
    c.onToggleSection('bio', false)
    mock.timers.tick(100)
    c.onToggleSection('bio', true)
    mock.timers.tick(500)
    assert.equal(savedConfigs.length, 1, 'un seul save')
    assert.equal((savedConfigs[0] as { bio: boolean }).bio, true, 'etat final')
  })

  test('AC-2: echec apres un seul toggle -> rollback a l etat initial', async () => {
    sectionsConfig.bio = true
    const c = createCoachSections({
      sectionsConfig,
      editableSections: EDITABLE,
      saveSectionsConfig,
      toast
    })
    c.onToggleSection('bio', false)
    assert.equal(sectionsConfig.bio, false, 'optimiste')
    saveResult = false
    mock.timers.tick(500)
    await Promise.resolve()
    await Promise.resolve()
    assert.equal(sectionsConfig.bio, true, 'rollback a l etat initial')
  })

  test('AC-2: echec -> rollback au snapshot initial + toast erreur', async () => {
    sectionsConfig.bio = true
    const c = createCoachSections({
      sectionsConfig,
      editableSections: EDITABLE,
      saveSectionsConfig,
      toast
    })
    c.onToggleSection('bio', false)
    c.onToggleSection('bio', true)
    saveResult = false
    mock.timers.tick(500)
    await Promise.resolve()
    await Promise.resolve()
    assert.equal(sectionsConfig.bio, true, 'rollback au snapshot initial')
    const errToast = toastCalls.find((t: unknown) => (t as { title?: string }).title === 'Impossible d\'enregistrer la configuration')
    assert.ok(errToast, 'toast erreur emis')
    assert.equal((errToast as { color?: string }).color, 'error')
  })

  test('AC-2: echec de deux sections -> les DEUX reviennent au snapshot initial', async () => {
    // Deux sections distinctes : restaurer « seulement la dernière bascule »
    // laisserait `bio` à false et ferait tomber ce cas.
    sectionsConfig = { freeText: false, bio: true, pricing: true }
    const c = createCoachSections({
      sectionsConfig,
      editableSections: EDITABLE,
      saveSectionsConfig,
      toast
    })
    c.onToggleSection('bio', false)
    c.onToggleSection('pricing', false)
    saveResult = false
    mock.timers.tick(500)
    await Promise.resolve()
    await Promise.resolve()
    assert.equal(sectionsConfig.bio, true, 'bio restaure')
    assert.equal(sectionsConfig.pricing, true, 'pricing restaure')
  })

  test('AC-2: succes -> toast succes verbatim, en couleur primary', async () => {
    const sc = { bio: true }
    const ss = async () => {
      savedConfigs.push({ ...sc })
      return true
    }
    const c = createCoachSections({
      sectionsConfig: sc,
      editableSections: EDITABLE,
      saveSectionsConfig: ss,
      toast
    })
    c.onToggleSection('bio', false)
    mock.timers.tick(500)
    await Promise.resolve()
    await Promise.resolve()
    const okToast = toastCalls.find((t: unknown) => (t as { title?: string }).title === 'Configuration enregistrée')
    assert.ok(okToast, 'toast succes au libelle VERBATIM')
    assert.equal((okToast as { color?: string }).color, 'primary')
  })

  test('AC-2: flushPendingToggle force l ecriture en attente', async () => {
    const c = createCoachSections({
      sectionsConfig,
      editableSections: EDITABLE,
      saveSectionsConfig,
      toast
    })
    c.onToggleSection('bio', false)
    assert.equal(savedConfigs.length, 0, 'rien avant le flush')
    c.flushPendingToggle()
    await Promise.resolve()
    await Promise.resolve()
    assert.equal(savedConfigs.length, 1, 'le flush ecrit la bascule en attente')
    assert.equal((savedConfigs[0] as { bio: boolean }).bio, false, 'etat en attente ecrit')
  })

  test('AC-2: flushPendingToggle sans bascule en attente n ecrit rien', async () => {
    const c = createCoachSections({
      sectionsConfig,
      editableSections: EDITABLE,
      saveSectionsConfig,
      toast
    })
    c.flushPendingToggle()
    await Promise.resolve()
    await Promise.resolve()
    assert.equal(savedConfigs.length, 0)
  })

  // ── AC-3 — prédicats ────────────────────────────────────────────────────

  test('AC-3: isSectionLocked vrai seulement freeText eteint sans contenu', () => {
    const freeTextForm = { title: '', paragraphs: [] as string[] }
    const c = createCoachSections({
      sectionsConfig: { freeText: false },
      editableSections: EDITABLE,
      isSectionOn: (_s: string) => false,
      freeTextForm: ref<FreeTextJson | null>(freeTextForm),
      saveSectionsConfig,
      toast
    })
    assert.equal(c.isSectionLocked('freeText'), true)
    const c2 = createCoachSections({
      sectionsConfig: { freeText: true },
      editableSections: EDITABLE,
      isSectionOn: () => true,
      freeTextForm: ref<FreeTextJson | null>({ title: '', paragraphs: [] }),
      saveSectionsConfig,
      toast
    })
    assert.equal(c2.isSectionLocked('freeText'), false)
    assert.equal(c.isSectionLocked('bio'), false)
  })

  test('AC-3: un bloc eteint MAIS rempli reste deverrouillable (yb-1-1, I3)', () => {
    // Le terme `!hasFreeTextContent()` : sans lui, une coach qui a écrit,
    // allumé, puis tout effacé resterait avec une bascule ON verrouillée.
    const c = createCoachSections({
      sectionsConfig: { freeText: false },
      editableSections: EDITABLE,
      isSectionOn: () => false,
      freeTextForm: ref<FreeTextJson | null>({ title: 'Un titre', paragraphs: [''] }),
      saveSectionsConfig,
      toast
    })
    assert.equal(c.isSectionLocked('freeText'), false, 'contenu present => pas de verrou')
    assert.equal(c.sectionLockReason('freeText'), null)
  })

  test('AC-3: isSectionBodyOpen vrai si allume ou freeText', () => {
    const c = createCoachSections({
      sectionsConfig: { freeText: false, bio: false },
      editableSections: EDITABLE,
      isSectionOn: (s: string) => s !== 'freeText' && s !== 'bio',
      saveSectionsConfig,
      toast
    })
    assert.equal(c.isSectionBodyOpen('freeText'), true)
    assert.equal(c.isSectionBodyOpen('bio'), false)
  })

  test('AC-3: sectionLockReason renvoie la constante verbatim', () => {
    const c = createCoachSections({
      sectionsConfig: { freeText: false },
      editableSections: EDITABLE,
      isSectionOn: (_s: string) => false,
      freeTextForm: ref<FreeTextJson | null>({ title: '', paragraphs: [] }),
      saveSectionsConfig,
      toast
    })
    assert.equal(c.sectionLockReason('freeText'), FREE_TEXT_LOCK_REASON)
  })

  test('AC-3: hasEditor s appuie sur coach-page-editor', () => {
    const c = createCoachSections({ sectionsConfig, editableSections: EDITABLE, saveSectionsConfig, toast })
    assert.equal(c.hasEditor('bio'), true)
    assert.equal(c.hasEditor('pricing'), false)
  })

  test('AC-3: externalSection reste la carte externe de tarifs', () => {
    const c = createCoachSections({ sectionsConfig, editableSections: EDITABLE, saveSectionsConfig, toast })
    assert.equal(c.externalSection('pricing')?.to, '/provider/scheduling')
    assert.equal(c.externalSectionTo('pricing'), '/provider/scheduling')
    assert.equal(c.externalSection('bio'), null)
    assert.equal(c.externalSectionTo('bio'), '')
  })

  test('AC-3: une section toujours active ne se bascule pas (hero, disclaimer)', () => {
    const c = createCoachSections({
      sectionsConfig,
      editableSections: EDITABLE,
      isAlwaysOn: s => s === 'hero' || s === 'disclaimer',
      saveSectionsConfig,
      toast
    })
    c.onToggleSection('hero', false)
    assert.equal(sectionsConfig.hero, undefined, 'aucune ecriture sur une section toujours active')
    mock.timers.tick(1000)
    assert.equal(savedConfigs.length, 0, 'aucun enregistrement declenche')
  })

  // ── Réactivité Vue ──────────────────────────────────────────────────────

  test('réactivité: orderedEditableSections suit une source qui change', () => {
    const editable = ref(['bio', 'freeText'])
    const c = createCoachSections({
      sectionsConfig,
      editableSections: editable,
      saveSectionsConfig,
      toast
    })
    assert.deepStrictEqual(c.orderedEditableSections.value, ['freeText', 'bio'])
    editable.value = ['pricing', 'faq']
    assert.deepStrictEqual(c.orderedEditableSections.value, ['pricing', 'faq'])
  })

  test('réactivité: isSectionLocked suit le contenu du bloc libre', () => {
    const form = ref<FreeTextJson | null>({ title: '', paragraphs: [] })
    const c = createCoachSections({
      sectionsConfig: { freeText: false },
      editableSections: EDITABLE,
      isSectionOn: () => false,
      freeTextForm: form,
      saveSectionsConfig,
      toast
    })
    assert.equal(c.isSectionLocked('freeText'), true)
    form.value = { title: 'Titre', paragraphs: [] }
    assert.equal(c.isSectionLocked('freeText'), false)
  })
})

// ── Câblage réel : le composable branché sur le store de production ───────

const cpd8Template: CoachPageTemplate = {
  id: 'cpd8',
  code: 'signature',
  name: 'Signature',
  description: 'Template de test CPD.8',
  previewImageUrl: null,
  sectionsAvailable: ['hero', 'bio', 'benefits', 'freeText', 'pricing', 'disclaimer']
}

function makeAccount(overrides: Partial<ProviderAccountResponse> = {}): ProviderAccountResponse {
  return {
    email: 'coach@example.test',
    firstname: 'Sophie',
    lastname: 'Jouan',
    bio: 'Bio courte',
    specialties: ['Stress'],
    slug: 'sophie-jouan',
    defaultDiscoveryDurationMinutes: 30,
    discoveryBufferAfterMinutes: 15,
    minBookingNoticeHours: 6,
    longBio: null,
    credentials: [],
    city: null,
    region: null,
    socialLinks: {},
    publicPhone: null,
    urgencyText: null,
    heroHeadline: null,
    testimonialsJson: [],
    leadMagnetUrl: null,
    leadMagnetTitle: null,
    googleAdsId: null,
    googleAdsConversionLabel: null,
    microsoftClarityId: null,
    coachPageTemplateId: 'cpd8',
    sectionsConfig: {},
    brandColor: null,
    pillarsJson: null,
    faqJson: null,
    benefitsJson: null,
    howItWorksJson: null,
    educationalContentJson: null,
    problemStatementJson: null,
    freeTextJson: null,
    brandName: null,
    logoUrl: null,
    imageUrl: null,
    heroImageUrl: null,
    secondaryPhotoUrl: null,
    plan: { slug: 'fondatrice', name: 'Fondatrice' },
    enabledFeatures: ['custom_domain', 'white_label_branding', 'coach_page_premium_templates', 'lead_magnet'],
    updatedAt: '2026-05-01T10:00:00.000Z',
    isPublished: false,
    publishedAt: null,
    isTest: false,
    publishChecklist: {
      isReady: false,
      items: {
        hasIdentity: true,
        hasBio: true,
        hasPhoto: false,
        hasOffer: false,
        hasTemplate: true
      },
      missingItems: ['hasPhoto', 'hasOffer']
    },
    ...overrides
  }
}

function createEditorHarness(options: { account?: ProviderAccountResponse } = {}) {
  const accountRef = ref<ProviderAccountResponse | null>(options.account ?? makeAccount())
  const loadingRef = ref(false)
  const savingRef = ref(false)
  const errorRef = ref<string | null>(null)
  const updatePatches: UpdateProviderAccountRequest[] = []
  let shouldFailNextUpdate = false

  const editor = createCoachPageEditor({
    providerAccount: {
      account: accountRef,
      loading: loadingRef,
      saving: savingRef,
      error: errorRef,
      async fetchAccount() {
        // L'account est déjà dans le ref : pas d'appel HTTP en test.
      },
      async updateAccount(patch) {
        updatePatches.push(JSON.parse(JSON.stringify(patch)) as UpdateProviderAccountRequest)
        if (shouldFailNextUpdate) {
          shouldFailNextUpdate = false
          return false
        }
        if (accountRef.value) {
          accountRef.value = { ...accountRef.value, ...patch }
        }
        return true
      },
      async updateAccountDetailed(patch) {
        updatePatches.push(JSON.parse(JSON.stringify(patch)) as UpdateProviderAccountRequest)
        accountRef.value = { ...(accountRef.value ?? makeAccount()), ...patch }
        return { ok: true as const, data: accountRef.value }
      }
    },
    async listTemplates() {
      return [cpd8Template]
    }
  })

  return {
    editor,
    accountRef,
    updatePatches,
    failNextUpdate() {
      shouldFailNextUpdate = true
    }
  }
}

describe('cpd-8 — câblage réel sur createCoachPageEditor', () => {
  beforeEach(() => {
    mock.timers.enable({ apis: ['setTimeout'] })
  })

  afterEach(() => {
    mock.timers.reset()
  })

  test('le composable construit depuis le store rend le rail, suit sectionsConfig et ecrit via le store', async () => {
    const harness = createEditorHarness({
      account: makeAccount({ sectionsConfig: { freeText: false, bio: true } })
    })
    await harness.editor.init()

    const toasts: unknown[] = []
    const sections = createCoachSections({
      editor: harness.editor,
      toast: { add: o => toasts.push(o) }
    })

    // Le rail n'est pas vide : le repli `editor.editableSections` (computed réel)
    // est bien lu, sinon l'éditeur afficherait zéro carte.
    assert.deepStrictEqual(
      sections.orderedEditableSections.value,
      ['benefits', 'freeText', 'bio', 'pricing']
    )

    // `isSectionOn` vient du store : il lit le MÊME objet réactif que la page.
    assert.equal(sections.isSectionOn('bio'), true)
    assert.equal(sections.isSectionOn('freeText'), false)

    sections.onToggleSection('bio', false)
    assert.equal(harness.editor.sectionsConfig.bio, false, 'mutation optimiste du store partagé')
    mock.timers.tick(500)
    await settle()

    assert.equal(harness.updatePatches.length, 1, 'une seule ecriture')
    assert.deepStrictEqual(
      (harness.updatePatches[0] as { sectionsConfig?: Record<string, boolean> }).sectionsConfig,
      { freeText: false, bio: false }
    )
    assert.equal(toasts.length, 1, 'toast de succes')
    assert.equal((toasts[0] as { title?: string }).title, 'Configuration enregistrée')
  })

  test('un echec du store restaure le sectionsConfig confirme par le serveur', async () => {
    const harness = createEditorHarness({
      account: makeAccount({ sectionsConfig: { freeText: false, bio: true } })
    })
    await harness.editor.init()

    const sections = createCoachSections({
      editor: harness.editor,
      toast: { add: () => {} }
    })

    harness.failNextUpdate()
    sections.onToggleSection('bio', false)
    mock.timers.tick(500)
    await settle()

    assert.equal(harness.editor.sectionsConfig.bio, true, 'rollback sur la valeur confirmee')
  })
})
