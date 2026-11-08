/**
 * CPD.10 — composition de la coquille (AC-4, AC-5 et garde d'hôte).
 *
 * Deux familles de preuve, nommées pour ce qu'elles sont :
 *
 * 1. **AC-4, exécuté** : un `createCoachPageEditor` réel, sans template
 *    sélectionné, produit une liste de sections éditables VIDE — c'est cette
 *    liste que la coquille itère. La garantie de LAB-R14 (« avis explicite et
 *    aucune section ») ne repose donc pas sur le nombre de sections rendues.
 * 2. **Câblage borné** : la page monte la coquille, la coquille monte l'en-tête
 *    et le sélecteur. La coquille n'est pas montable sous le harnais SFC (29
 *    imports, stores, routeur) ; les garanties de rendu vivent dans
 *    `cpd-10-template-selector.test.ts` et `provider-coach-page-header.test.ts`,
 *    et l'AC-4 s'appuie ici sur le composable réel + la boucle qui le consomme.
 *
 * Non-vacuité mesurée : retirer `<CoachPageHeader>`, `<CoachPageTemplateSelector>`
 * ou `<CoachPageEditorShell />` fait tomber un test de ce fichier.
 */
import * as assert from 'node:assert/strict'
import * as fs from 'node:fs'
import * as path from 'node:path'
import test, { describe } from 'node:test'
import { ref } from 'vue'
import type { Ref } from 'vue'

import { createCoachPageEditor } from '../../app/features/coach/createCoachPageEditor'
import { createCoachSections } from '../../app/features/coach/useCoachSections'
import type { CoachPageTemplate } from '../../app/features/coach/api/coach-page-template.contract'
import type { ProviderAccountResponse } from '../../app/features/account/api/provider-account.contract'

const appRoot = path.resolve(process.cwd(), 'app')
const SHELL_PATH = 'components/organisms/CoachPageEditorShell.vue'
const PAGE_PATH = 'pages/provider/coach-page.vue'

const shellSource = (): string => fs.readFileSync(path.join(appRoot, SHELL_PATH), 'utf8')
const pageSource = (): string => fs.readFileSync(path.join(appRoot, PAGE_PATH), 'utf8')

/** Bloc d'une balise auto-fermante, pour ne pas prouver une occurrence voisine. */
function selfClosingTag(source: string, tag: string): string {
  const start = source.indexOf(`<${tag}`)
  assert.ok(start >= 0, `balise <${tag}> attendue`)
  const end = source.indexOf('/>', start)
  assert.ok(end > start, `balise <${tag}> non auto-fermante`)
  return source.slice(start, end + 2)
}

const template: CoachPageTemplate = {
  id: 'cpd10-template',
  code: 'signature',
  name: 'Signature',
  description: null,
  previewImageUrl: null,
  sectionsAvailable: ['hero', 'bio', 'benefits', 'pricing', 'disclaimer']
}

function makeAccount(): ProviderAccountResponse {
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
    coachPageTemplateId: null,
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
    plan: { slug: 'essentiel', name: 'Essentiel' },
    enabledFeatures: [],
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
        hasTemplate: false
      },
      missingItems: ['hasPhoto', 'hasOffer', 'hasTemplate']
    }
  } as ProviderAccountResponse
}

function createEditor(templates: CoachPageTemplate[], accountRef: Ref<ProviderAccountResponse | null>) {
  return createCoachPageEditor({
    providerAccount: {
      account: accountRef,
      loading: ref(false),
      saving: ref(false),
      error: ref<string | null>(null),
      async fetchAccount() {},
      async updateAccount() { return true },
      async updateAccountDetailed() {
        return { ok: true as const, data: accountRef.value as ProviderAccountResponse }
      }
    },
    async listTemplates() { return templates }
  })
}

describe('CPD.10 — AC-4 : sans template, aucune section éditable', () => {
  test('un template sélectionné produit des sections ; le vider les vide', async () => {
    const accountRef = ref<ProviderAccountResponse | null>(makeAccount())
    const editor = createEditor([template], accountRef)
    const sections = createCoachSections({ editor, toast: { add: () => {} } })

    // Sans sélection : rien.
    await editor.init()
    assert.equal(editor.selectedTemplateId.value, null)
    assert.deepEqual(editor.editableSections.value, [])
    assert.deepEqual(sections.orderedEditableSections.value, [])

    // Avec sélection : les sections du template, ordonnées.
    accountRef.value = { ...makeAccount(), coachPageTemplateId: template.id }
    await editor.init()
    assert.ok(editor.editableSections.value.length > 0, 'le template doit exposer des sections')
    assert.deepEqual(
      sections.orderedEditableSections.value,
      ['benefits', 'bio', 'pricing']
    )

    // Retour à null (désélection) : la liste redevient vide, donc l'avis n'est
    // pas « une section parmi d'autres ».
    accountRef.value = makeAccount()
    await editor.init()
    assert.deepEqual(sections.orderedEditableSections.value, [])
  })

  test('la coquille monte l\'avis AVANT la boucle et ne le conditionne pas au nombre de sections', () => {
    const source = shellSource()
    const noticeIdx = source.indexOf('<CoachPageTemplateRequiredNotice v-if')
    const loopIdx = source.indexOf('v-for="section in orderedEditableSections"')

    assert.ok(noticeIdx >= 0, 'l\'avis doit être monté')
    assert.ok(loopIdx >= 0, 'la boucle des sections doit exister')
    assert.ok(noticeIdx < loopIdx, 'l\'avis explique l\'absence de sections : il les précède')

    const noticeTag = source.slice(noticeIdx, source.indexOf('/>', noticeIdx) + 2)
    assert.match(noticeTag, /v-if="!selectedTemplateId"/)
    // Aucune condition sur le nombre de sections : c'est la cause (pas de
    // template), jamais le symptôme (liste vide), qui décide du rendu.
    assert.doesNotMatch(noticeTag, /orderedEditableSections|\.length|sections\.value/)
  })
})

describe('CPD.10 — garde d\'hôte : la composition est montée', () => {
  test('la page monte la coquille (import explicite + point de montage)', () => {
    const source = pageSource()

    assert.match(
      source,
      /import CoachPageEditorShell from '~\/components\/organisms\/CoachPageEditorShell\.vue'/
    )
    assert.match(source, /<CoachPageEditorShell \/>/)
  })

  test('la coquille monte l\'en-tête avec ses trois actions', () => {
    const header = selfClosingTag(shellSource(), 'CoachPageHeader')

    assert.match(header, /:account="account"/)
    assert.match(header, /:publishing="publishing"/)
    assert.match(header, /:preview-link="previewCoachPageLink"/)
    assert.match(header, /@preview="onHeaderPreview"/)
    assert.match(header, /@publish="handleOpenPublish"/)
    assert.match(header, /@unpublish="confirmUnpublishModalOpen = true"/)
  })

  test('la coquille monte le sélecteur avec les cartes décorées et sa sélection', () => {
    const selector = selfClosingTag(shellSource(), 'CoachPageTemplateSelector')

    assert.match(selector, /:templates="templateCards"/)
    assert.match(selector, /:selected-template-id="selectedTemplateId"/)
    assert.match(selector, /:has-premium-templates="hasPremiumTemplates"/)
    assert.match(selector, /@select="onSelectTemplate"/)
  })

  test('la coquille monte les deux panneaux d\'aperçu et les deux modales', () => {
    const source = shellSource()

    assert.equal((source.match(/<CoachPagePreviewPanel\b/g) ?? []).length, 2)
    assert.equal((source.match(/<CoachPublishChecklistModal\b/g) ?? []).length, 1)
    assert.equal((source.match(/<ConfirmActionModal\b/g) ?? []).length, 1)
    assert.match(source, /v-model:open="checklistModalOpen"/)
    assert.match(source, /v-model:open="confirmUnpublishModalOpen"/)
  })
})
