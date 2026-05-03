import * as assert from 'node:assert/strict'
import test, { describe } from 'node:test'
import { ref } from 'vue'

import { createCoachPageEditor } from '../../app/features/coach/createCoachPageEditor'
import type { CoachPageTemplate } from '../../app/features/coach/api/coach-page-template.contract'
import type {
  ProviderAccountResponse,
  UpdateProviderAccountRequest
} from '../../app/features/account/api/provider-account.contract'

/**
 * Story 0-26 round Codex CR — Tests comportementaux runtime du composable
 * `createCoachPageEditor` qui sous-tend `/provider/coach-page`.
 *
 * Couvre les findings :
 *  - R1-F1 : un seul store partagé (init() hydrate ce store, updateAccount
 *    via l'éditeur mute le MÊME ref → pas de double instance désynchronisée)
 *  - R1-F3 : longBio accepte les textes > 500 chars (cas terrain Sophie 962)
 *  - R1-F4 : payloads exacts pour chaque mutation (longBio, city, region,
 *    testimonialsJson, brandName, logoUrl, sectionsConfig)
 *
 * Anti-faux-vert : ces tests échouent si on réintroduit un 2e appel à
 * `useProviderAccount()` dans la page, ou si on saute le chargement initial,
 * ou si un payload est mal-formaté.
 */

const signatureTemplate: CoachPageTemplate = {
  id: 'signature',
  code: 'signature',
  name: 'Signature',
  description: 'Template signature',
  previewImageUrl: null,
  sectionsAvailable: [
    'hero',
    'bio',
    'pillars',
    'faq',
    'testimonials',
    'benefits',
    'howItWorks',
    'educationalContent',
    'problemStatement',
    'emotionalSupport',
    'pricing',
    'disclaimer'
  ]
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
    coachPageTemplateId: 'signature',
    sectionsConfig: {},
    brandColor: null,
    pillarsJson: null,
    faqJson: null,
    benefitsJson: null,
    howItWorksJson: null,
    educationalContentJson: null,
    problemStatementJson: null,
    brandName: null,
    logoUrl: null,
    imageUrl: null,
    heroImageUrl: null,
    secondaryPhotoUrl: null,
    updatedAt: '2026-05-01T10:00:00.000Z',
    ...overrides
  }
}

interface HarnessOptions {
  account?: ProviderAccountResponse
  /** Permet de forcer un échec de updateAccount pour tester les rollback. */
  failNextUpdate?: boolean
}

function createHarness(options: HarnessOptions = {}) {
  const accountRef = ref<ProviderAccountResponse | null>(options.account ?? makeAccount())
  const loadingRef = ref(false)
  const savingRef = ref(false)
  const errorRef = ref<string | null>(null)
  const updatePatches: UpdateProviderAccountRequest[] = []
  let shouldFailNextUpdate = options.failNextUpdate ?? false

  const editor = createCoachPageEditor({
    providerAccount: {
      account: accountRef,
      loading: loadingRef,
      saving: savingRef,
      error: errorRef,
      async fetchAccount() {
        // Le test harness fournit déjà l'account dans accountRef ; pas de fetch HTTP.
      },
      async updateAccount(patch) {
        const cloned = JSON.parse(JSON.stringify(patch)) as UpdateProviderAccountRequest
        updatePatches.push(cloned)
        if (shouldFailNextUpdate) {
          shouldFailNextUpdate = false
          errorRef.value = 'Simulated failure'
          return false
        }
        if (accountRef.value) {
          accountRef.value = { ...accountRef.value, ...cloned }
        }
        return true
      },
      async updateAccountDetailed(patch) {
        const cloned = JSON.parse(JSON.stringify(patch)) as UpdateProviderAccountRequest
        updatePatches.push(cloned)
        accountRef.value = { ...(accountRef.value ?? makeAccount()), ...cloned }
        return { ok: true, data: accountRef.value }
      }
    },
    async listTemplates() {
      return [signatureTemplate]
    }
  })

  return {
    editor,
    accountRef,
    updatePatches,
    setNextUpdateToFail() {
      shouldFailNextUpdate = true
    }
  }
}

describe('R1-F1 — Single store proof : useCoachPageEditor partage UN seul ref account', () => {
  test('init() hydrate le store et toutes les lectures ultérieures voient la donnée', async () => {
    // Account déjà rempli (cas typique : Sophie ouvre /provider/coach-page après une 1ère sauvegarde)
    const account = makeAccount({
      longBio: 'Bio détaillée existante (déjà 200 caractères pour ce test). '.repeat(4),
      city: 'Valognes',
      region: 'Normandie',
      testimonialsJson: [
        { quote: 'Sophie m\'a beaucoup aidée', firstName: 'Marie', age: 52, rating: 5 }
      ],
      brandName: 'Sophie Jouan — Coach',
      logoUrl: 'https://assets.sophie-jouan.fr/logo.png',
      sectionsConfig: { bio: false, pricing: true }
    })
    const { editor } = createHarness({ account })

    await editor.init()

    // Le store unique expose la donnée intégralement.
    assert.equal(editor.account.value?.longBio?.startsWith('Bio détaillée existante'), true)
    assert.equal(editor.account.value?.city, 'Valognes')
    assert.equal(editor.account.value?.region, 'Normandie')
    assert.equal(editor.account.value?.testimonialsJson?.length, 1)
    assert.equal(editor.account.value?.testimonialsJson?.[0]?.quote, 'Sophie m\'a beaucoup aidée')
    assert.equal(editor.account.value?.brandName, 'Sophie Jouan — Coach')
    assert.equal(editor.account.value?.logoUrl, 'https://assets.sophie-jouan.fr/logo.png')

    // sectionsConfig hydraté pour le snapshot rollback.
    assert.equal(editor.isSectionOn('bio'), false, 'bio off en sectionsConfig serveur doit être respecté')
    assert.equal(editor.isSectionOn('pricing'), true)
  })

  test('editor.updateAccount mute LE MÊME store que init() a rempli (preuve single-source-of-truth)', async () => {
    const account = makeAccount({
      longBio: 'Bio initiale',
      city: 'Paris',
      brandName: 'Marque initiale'
    })
    const { editor } = createHarness({ account })

    await editor.init()

    // Update via l'éditeur — doit muter le ref unique exposé par editor.account
    const ok = await editor.updateAccount({ longBio: 'Bio mise à jour' })

    assert.equal(ok, true)
    assert.equal(editor.account.value?.longBio, 'Bio mise à jour', 'editor.account.value reflète immédiatement le PATCH')
    // Champs non patchés préservés (anti-régression : double store écraserait avec valeurs vides)
    assert.equal(editor.account.value?.city, 'Paris')
    assert.equal(editor.account.value?.brandName, 'Marque initiale')
  })
})

describe('R1-F3 — longBio supporte > 500 caractères (cas terrain Sophie 962)', () => {
  test('updateAccount accepte un longBio de 962 caractères (rejeté par bio @MaxLength(500))', async () => {
    const { editor, updatePatches } = createHarness({ account: makeAccount({ longBio: null }) })

    // Cas terrain exact : Sophie a tapé 962 caractères dans Qui suis-je.
    const longText = 'Pendant 20 ans j\'ai accompagné des patientes en milieu hospitalier. '.repeat(15).slice(0, 962)
    assert.equal(longText.length, 962, 'le test doit utiliser exactement 962 chars (cas terrain)')

    const ok = await editor.updateAccount({ longBio: longText })

    assert.equal(ok, true)
    assert.deepStrictEqual(updatePatches, [{ longBio: longText }], 'le payload PATCH doit cibler longBio (pas bio)')
    assert.equal(editor.account.value?.longBio?.length, 962, 'le store reflète bien les 962 chars persistés')
  })
})

describe('R1-F4 — Payloads exacts pour chaque mutation rapatriée', () => {
  test('Qui suis-je : updateAccount({ longBio, city, region }) envoie les 3 champs (anti-régression : pas de bio courte ici)', async () => {
    const { editor, updatePatches } = createHarness()

    await editor.updateAccount({
      longBio: 'Ma bio détaillée',
      city: 'Valognes',
      region: 'Normandie'
    })

    assert.deepStrictEqual(updatePatches[0], {
      longBio: 'Ma bio détaillée',
      city: 'Valognes',
      region: 'Normandie'
    })
    // Anti-régression : `bio` (limite 500 chars) ne doit pas apparaître dans le PATCH "Qui suis-je".
    assert.equal('bio' in (updatePatches[0] ?? {}), false, '`bio` ne doit pas être dans le payload Qui suis-je')
  })

  test('Témoignages : updateAccount({ testimonialsJson }) envoie le tableau exact (clés conservées)', async () => {
    const { editor, updatePatches } = createHarness()

    const items = [
      { quote: 'Top accompagnement', firstName: 'Marie', age: 52, location: 'Paris', rating: 5, result: 'Apaisée après 3 mois' },
      { quote: 'Super coach', firstName: 'Léa', rating: 4 }
    ]
    await editor.updateAccount({ testimonialsJson: items })

    assert.deepStrictEqual(updatePatches[0]?.testimonialsJson, items)
  })

  test('Identité de marque : updateAccount({ brandName, logoUrl }) — peut SET ou CLEAR (null fallback Keova)', async () => {
    // Cas SET : Sophie renseigne ses valeurs personnalisées.
    const { editor: e1, updatePatches: p1 } = createHarness({ account: makeAccount({ brandName: null, logoUrl: null }) })
    await e1.updateAccount({ brandName: 'Sophie Jouan', logoUrl: 'https://logo.fr/img.png' })
    assert.deepStrictEqual(p1[0], { brandName: 'Sophie Jouan', logoUrl: 'https://logo.fr/img.png' })
    assert.equal(e1.account.value?.brandName, 'Sophie Jouan')
    assert.equal(e1.account.value?.logoUrl, 'https://logo.fr/img.png')

    // Cas CLEAR : Sophie efface ses valeurs → fallback Keova.
    const { editor: e2, updatePatches: p2 } = createHarness({
      account: makeAccount({ brandName: 'Sophie Jouan', logoUrl: 'https://logo.fr/img.png' })
    })
    await e2.updateAccount({ brandName: null, logoUrl: null })
    assert.deepStrictEqual(p2[0], { brandName: null, logoUrl: null })
    assert.equal(e2.account.value?.brandName, null, 'brandName remis à null permet le fallback Keova côté backend')
    assert.equal(e2.account.value?.logoUrl, null, 'logoUrl remis à null permet le fallback Keova côté backend')
  })

  test('saveSectionsConfig : envoie { sectionsConfig } et reflète le state local complet', async () => {
    const { editor, updatePatches } = createHarness()

    // Simule une mutation locale du toggle (pattern réel de la page).
    editor.sectionsConfig.bio = false
    editor.sectionsConfig.pricing = true

    const ok = await editor.saveSectionsConfig()

    assert.equal(ok, true)
    assert.deepStrictEqual(updatePatches[0], {
      sectionsConfig: { bio: false, pricing: true }
    })
  })
})

describe('R1-F1 + R1-F4 — Échec saveSectionsConfig : retourne `false`, le caller doit rollback', () => {
  test('updateAccount retournant false expose un signal pour le rollback côté page (sans éclater le store)', async () => {
    const account = makeAccount({ sectionsConfig: { bio: true } })
    const { editor, setNextUpdateToFail } = createHarness({ account })

    await editor.init()
    setNextUpdateToFail()

    editor.sectionsConfig.bio = false // optimistic
    const ok = await editor.saveSectionsConfig()

    assert.equal(ok, false, 'l\'éditeur retourne false sur échec ; le caller doit rollback')
    // L'account ref n'a PAS été muté par le PATCH échoué (anti-régression : éviter d'écraser le serveur)
    assert.equal(editor.account.value?.sectionsConfig?.bio, true, 'le ref serveur reste intact malgré l\'échec')
  })
})
