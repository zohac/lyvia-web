import * as assert from 'node:assert/strict'
import * as fs from 'node:fs'
import * as path from 'node:path'
import test, { describe } from 'node:test'

import {
  COACH_PAGE_INLINE_EDITOR_SECTIONS,
  getCoachPageConfigurableSections,
  getCoachPageEditableSections,
  hasCoachFreeTextContent,
  isCoachPageInlineEditorSection
} from '../../app/features/coach/domain/coach-page-editor'
import {
  ALBA_TEMPLATE_CODE,
  ESSENTIEL_TEMPLATE_CODE,
  STANDARD_COACH_TEMPLATE_CODES,
  VISUEL_TEMPLATE_CODE
} from '../../app/features/plans/domain/template-lock'
import type {
  FreeTextJson,
  PublicProviderProfile
} from '../../app/features/seo/api/public-provider-profile.contract'
import type {
  ProviderAccountResponse,
  UpdateProviderAccountRequest
} from '../../app/features/account/api/provider-account.contract'

/**
 * YB.1.1 — Bloc de texte libre entre bénéfices et présentation.
 *
 * AD-7 impose CINQ inscriptions dans le même changement, une seule absente
 * étant un échec. Ce fichier verrouille les quatre qui appartiennent au web
 * (les deux autres — catalogue `sections_available` et table de drapeaux
 * `provider_profiles.sections_config` — sont vérifiées côté API, en base :
 * `coach-page-templates-seed.db.spec.ts`).
 *
 * AD-10 : le coureur du dépôt est `tsc -p tsconfig.tests.json && node --test`,
 * il ne compile AUCUN composant monofichier. Ce qui exige de RENDRE la page
 * ou l'éditeur est une revue humaine, désignée comme telle. Ce fichier couvre
 * la part machine-vérifiable : la présence des inscriptions, l'aller-retour des
 * deux contrats, le contrat du composant (garde de vide, pas de HTML).
 */

const appRoot = path.resolve(process.cwd(), 'app')

/** Même convention que `scripts/contract-check-openapi-auth.mjs`. */
const apiRoot
  = process.env.LYVIA_API_PATH || path.resolve(appRoot, '..', '..', 'lyvia-api')

function readFile(relativePath: string): string {
  return fs.readFileSync(path.join(appRoot, relativePath), 'utf-8')
}

function readApiSource(relativePath: string): string | null {
  const filePath = path.join(apiRoot, relativePath)
  return fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf-8') : null
}

const COACH_PAGE_PATH = 'pages/provider/coach-page.vue'
const COACH_PAGE_VISIBILITY_PATH = 'composables/useCoachSectionVisibility.ts'
const FREE_TEXT_COMPONENT_PATH = 'components/organisms/CoachFreeText.vue'

const TEMPLATES = [
  'components/templates/coach-pages/CoachPageSignature.vue',
  'components/templates/coach-pages/CoachPageEssentiel.vue',
  'components/templates/coach-pages/CoachPageVisuel.vue',
  // YB.1.2 — Alba. Sans cette ligne, la couverture « le bloc libre existe sur
  // tous les templates » passerait sans vérifier le 4ᵉ : un template né après
  // cette story serait exempté de la fonctionnalité par simple omission.
  'components/templates/coach-pages/CoachPageAlba.vue'
] as const

const FREE_TEXT_JSON: FreeTextJson = {
  title: 'Comment je travaille avec vous',
  paragraphs: [
    'Chaque accompagnement commence par un temps d\u2019\u00e9change.',
    'Ensuite, nous construisons un plan adapt\u00e9.'
  ]
}

describe('YB.1.1 — les cinq emplacements d\u2019inscription (AD-7)', () => {
  // N\u00b0 2 : COACH_PAGE_INLINE_EDITOR_SECTIONS, seconde liste en dur.
  test('n\u00b0 2 — freeText est dans COACH_PAGE_INLINE_EDITOR_SECTIONS, APRÈS benefits', () => {
    // Le tuple est `as const` : on le lit comme la liste de chaînes qu'il est
    // (pas de cast `as never` sur `.includes`).
    const inlineSections: readonly string[] = COACH_PAGE_INLINE_EDITOR_SECTIONS
    assert.ok(
      inlineSections.includes('freeText'),
      'freeText doit figurer dans la liste des sections éditées en ligne'
    )
    const benefitsIdx = inlineSections.indexOf('benefits')
    const freeTextIdx = inlineSections.indexOf('freeText')
    assert.ok(
      freeTextIdx > benefitsIdx,
      'freeText doit suivre benefits (position canonique de la page)'
    )
    assert.equal(isCoachPageInlineEditorSection('freeText'), true)
  })

  // N° 3 : la liste ordonnée d'affichage de l'éditeur.
  test('n° 3 — DISPLAY_SECTION_ORDER place freeText entre benefits et bio', () => {
    const source = readFile(COACH_PAGE_PATH)
    const orderMatch = source.match(
      /const DISPLAY_SECTION_ORDER = \[([\s\S]*?)\] as const/
    )
    assert.ok(orderMatch, 'DISPLAY_SECTION_ORDER doit être déclaré')
    const order = Array.from((orderMatch![1] ?? '').matchAll(/'([^']+)'/g)).map(m => m[1])

    const benefitsIdx = order.indexOf('benefits')
    const freeTextIdx = order.indexOf('freeText')
    const bioIdx = order.indexOf('bio')
    assert.notEqual(freeTextIdx, -1, 'freeText doit être dans DISPLAY_SECTION_ORDER')
    assert.ok(
      freeTextIdx > benefitsIdx && freeTextIdx < bioIdx,
      `freeText doit être entre benefits et bio — ordre obtenu : ${order.join(' → ')}`
    )
  })

  // N° 4 : l'ensemble des sections configurables.
  // `getCoachPageConfigurableSections` RETIRE `emotionalSupport` (sous-bloc),
  // jamais `freeText` : le bloc libre est unFragment de premier niveau.
  test('n° 4 — freeText est configurable ET éditable (jamais retiré)', () => {
    const withFreeText = ['hero', 'bio', 'benefits', 'freeText', 'pricing', 'disclaimer']
    const configurable = getCoachPageConfigurableSections(withFreeText)
    const editable = getCoachPageEditableSections(withFreeText)

    assert.ok(configurable.includes('freeText'), 'freeText doit être configurable')
    assert.ok(editable.includes('freeText'), 'freeText doit être éditable')
    // `hero` et `disclaimer` restent always-on, `emotionalSupport` reste caché.
    assert.equal(editable.includes('hero'), false)
    assert.equal(editable.includes('disclaimer'), false)
    assert.equal(getCoachPageEditableSections([...withFreeText, 'emotionalSupport'])
      .includes('emotionalSupport'), false)
  })

  test('n° 5 — useCoachSectionVisibility expose show.freeText sur le TOGGLE SEUL', () => {
    const source = readFile(COACH_PAGE_VISIBILITY_PATH)

    // L'union des sections configurables.
    assert.match(
      source,
      /export type CoachConfigurableSection[\s\S]*?\| 'freeText'/,
      'freeText doit appartenir à CoachConfigurableSection'
    )
    // Le drapeau `show.freeText`, sans cas particulier.
    assert.match(
      source,
      /const showFreeText = computed\(\(\) => isToggleOn\('freeText'\)\)/,
      'show.freeText doit être le toggle seul — le garde de contenu vit dans le composant (AD-7)'
    )
    assert.match(
      source,
      /show:\s*\{[\s\S]*?freeText: showFreeText/,
      'show.freeText doit être exposé dans le retour du composable'
    )
    // Aucun cas particulier ni garde de contenu dans le composable : c'est le
    // composant qui refuse de rendre un bloc vide.
    assert.equal(
      /hasFreeText/.test(source),
      false,
      'useCoachSectionVisibility ne doit porter AUCUN garde de contenu pour le bloc libre'
    )
  })

  // N° 1 : le catalogue `sections_available`, côté API. Le dépôt web n'a pas le
  // fichier sous une forme fiable en CI (sparse-checkout) : quand la source
  // API est absente, c'est le `*.db.spec.ts` API qui verrouille cette
  // inscription en base, et le test le dit plutôt que de passer en silence.
  test('n° 1 — freeText est dans les 3 sectionsAvailable du seed API', (t) => {
    const source = readApiSource(
      'src/features/providers/infrastructure/coach-page-seed.ts'
    )
    if (source === null) {
      t.skip(
        'source lyvia-api absente (CI en sparse-checkout) — inscription n° 1 verrouillée par '
        + 'coach-page-templates-seed.db.spec.ts côté API'
      )
      return
    }

    const arrays = Array.from(
      source.matchAll(
        /export const (\w+SectionsAvailable) = \[([\s\S]*?)\] as const/g
      )
    )
    // YB.1.2 — il reste TROIS tableaux, et c'est délibéré : Alba réutilise
    // `visuelSectionsAvailable` TEL QUEL (parité B7), il n'a donc pas de liste
    // propre. Un quatrième tableau serait une COPIE : elle dériverait en
    // silence, et la parité base↔seed comparerait la copie, plus la source.
    // La couverture du 4ᵉ template est assurée par le test suivant, sur l'upsert.
    assert.equal(arrays.length, 3, 'les trois tableaux sectionsAvailable doivent exister')
    for (const [, name, body] of arrays) {
      assert.match(
        body!,
        /'freeText'/,
        `${name} doit contenir freeText — c'est ce qui décide si l'éditeur rend un formulaire`
      )
    }
  })

  // YB.1.2 — Alba n'a pas de tableau `sectionsAvailable`, c'est le point de la
  // parité B7. Ce test l'inscrit explicitement : sans lui, l'omission d'Alba du
  // catalogue se glisserait dans le compte du test précédent sans être vue.
  test('n° 1 bis — l\'upsert d\'Alba reprend visuelSectionsAvailable, sans le recopier', (t) => {
    const source = readApiSource(
      'src/features/providers/infrastructure/coach-page-seed.ts'
    )
    if (source === null) {
      t.skip(
        'source lyvia-api absente (CI en sparse-checkout) — verrouillé par '
        + 'coach-page-templates-seed.db.spec.ts côté API'
      )
      return
    }

    assert.match(
      source,
      /export const ALBA_TEMPLATE_CODE = 'visuel-portrait'/,
      'le code d\'Alba est `visuel-portrait` — le tiret est imposé par le DTO d\'admin'
    )
    // L'upsert d'Alba sérialise `visuelSectionsAvailable`, pas un littéral
    // recopié : c'est ce qui garantit que les deux restent alignés.
    const albaUpsert = source.match(
      /ALBA_TEMPLATE_CODE,[\s\S]*?JSON\.stringify\((\w+)\)/
    )
    assert.ok(albaUpsert, 'l\'upsert d\'Alba est introuvable dans le seed')
    assert.equal(
      albaUpsert![1],
      'visuelSectionsAvailable',
      'Alba doit hériter des sections de visuel, pas d\'une copie'
    )
    assert.equal(
      /export const albaSectionsAvailable/.test(source),
      false,
      'aucun tableau dérivé : une copie divergerait en silence'
    )
  })
})

describe('YB.1.1 — l\u2019égalité croisée des deux listes de templates standard (AD-8)', () => {
  test('STANDARD_COACH_TEMPLATE_CODES est exactement le trio de ses constantes', () => {
    // YB.1.2 — Alba entre dans le standard. Premium et Fondatrice accèdent à
    // tout, standard compris (AD-8) : Alba est donc proposé aux trois paliers,
    // sans cadenas.
    assert.deepStrictEqual(
      [...STANDARD_COACH_TEMPLATE_CODES].sort(),
      [ESSENTIEL_TEMPLATE_CODE, VISUEL_TEMPLATE_CODE, ALBA_TEMPLATE_CODE].sort()
    )
    assert.equal(STANDARD_COACH_TEMPLATE_CODES.includes('signature'), false)
  })

  test('la liste web et l\u2019expression isStandardTemplate de l\u2019API portent les MÊMES codes', (t) => {
    const service = readApiSource(
      'src/features/providers/infrastructure/typeorm-provider-account-command.service.ts'
    )
    const seed = readApiSource('src/features/providers/infrastructure/coach-page-seed.ts')
    if (service === null || seed === null) {
      t.skip(
        'source lyvia-api absente (CI en sparse-checkout) — l\u2019égalité croisée est revue à la main '
        + 'avec l\u2019épaule API (AD-8)'
      )
      return
    }

    const match = service.match(/const isStandardTemplate =\s*([\s\S]*?);/)
    assert.ok(match, 'isStandardTemplate doit rester lisible dans l\u2019adapter')

    // L\u2019expression est une ALTERNATIVE de constantes, pas une liste : on
    // résout chaque constante dans le catalogue, puis on aligne l\u2019ensemble
    // obtenu sur la liste web.
    //
    // YB.1.2 — `ALBA_TEMPLATE_CODE` rejoint l’alternative. C’est le SEUL
    // endroit où ce test doit être touché : résolution et comparaison
    // s’étendent seules, et c’est une ÉGALITÉ, pas une juxtaposition —
    // ajouter la constante d’un seul côté fait échouer l’assertion.
    const referencedConstants = [
      ...new Set(
        Array.from(
          (match![1] ?? '').matchAll(
            /ESSENTIEL_TEMPLATE_CODE|VISUEL_TEMPLATE_CODE|ALBA_TEMPLATE_CODE/g
          )
        ).map(m => m[0])
      )
    ]
    const resolved = referencedConstants.map((constant) => {
      const decl = seed.match(
        new RegExp(`export const ${constant} = '([^']+)'`)
      )
      assert.ok(decl, `${constant} doit être résoluble dans coach-page-seed.ts`)
      return decl![1]
    })

    assert.deepStrictEqual(
      resolved.sort(),
      [...STANDARD_COACH_TEMPLATE_CODES].sort(),
      'AD-8 : toute divergence ouvrirait un 403 sur un template que la coach a le droit de choisir'
    )
  })
})

describe('YB.1.1 — aller-retour du champ dans les deux contrats', () => {
  test('lecture (ProviderAccountResponse) et écriture (UpdateProviderAccountRequest) portent le champ', () => {
    // Aller-retour typé : ce code ne compile pas si l'un des deux sens est
    // omis. `tsc -p tsconfig.tests.json` fait partie du coureur.
    const account: Pick<ProviderAccountResponse, 'freeTextJson'> = {
      freeTextJson: FREE_TEXT_JSON
    }
    const patch: UpdateProviderAccountRequest = {
      freeTextJson: account.freeTextJson
    }
    assert.deepStrictEqual(patch.freeTextJson, FREE_TEXT_JSON)

    // Effacement : `null` et non `undefined` — c'est ce que la page attend
    // pour faire disparaître le bloc.
    const cleared: UpdateProviderAccountRequest = { freeTextJson: null }
    assert.equal(cleared.freeTextJson, null)
  })

  test('lecture (PublicProviderProfile) porte le même type', () => {
    const profile: Pick<PublicProviderProfile, 'freeTextJson'> = {
      freeTextJson: FREE_TEXT_JSON
    }
    assert.deepStrictEqual(profile.freeTextJson, FREE_TEXT_JSON)
  })

  test('les DEUX fichiers de contrat déclarent le champ dans les DEUX sens', () => {
    const accountContract = readFile('features/account/api/provider-account.contract.ts')
    const publicContract = readFile('features/seo/api/public-provider-profile.contract.ts')

    // `provider-account.contract.ts` porte les DEUX sens (lecture ET écriture) ;
    // `public-provider-profile.contract.ts` est la forme PUBLIQUE, donc
    // lecture seule — c'est `PATCH /provider/account` qui écrit.
    assert.equal(
      (accountContract.match(/freeTextJson\??:/g) ?? []).length,
      2,
      'provider-account.contract.ts doit porter freeTextJson en lecture ET en écriture'
    )
    assert.equal(
      (publicContract.match(/freeTextJson\??:/g) ?? []).length,
      1,
      'public-provider-profile.contract.ts porte la forme publiée (lecture seule)'
    )

    // Le type n'est DÉCLARÉ qu'une fois, dans le contrat canonique ; le
    // contrat compte le RÉ-EXPORTE plutôt que de le redéclarer — deux
    // déclarations divergeraient en silence.
    assert.match(
      publicContract,
      /export interface FreeTextJson \{[\s\S]*?title\?: string[\s\S]*?paragraphs: string\[\]/,
      'le contrat canonique doit déclarer FreeTextJson (titre optionnel + paragraphes)'
    )
    assert.equal(
      /export interface FreeTextJson/.test(accountContract),
      false,
      'provider-account.contract.ts ne doit PAS redéclarer FreeTextJson'
    )
    assert.match(
      accountContract,
      /FitJson,\s*FreeTextJson\s*\} from '~\/features\/seo\/api\/public-provider-profile\.contract'/,
      'provider-account.contract.ts doit ré-exporter FreeTextJson depuis le contrat canonique'
    )
  })
})

describe('YB.1.1 — le composant (AD-5, AD-7, AD-9)', () => {
  test('existe, et rend RIEN quand titre et paragraphes sont vides', () => {
    const source = readFile(FREE_TEXT_COMPONENT_PATH)
    // Le garde est celui du domaine, PAS une règle locale : le composant et
    // les quatre templates doivent être d'accord sur « y a-t-il du texte ».
    assert.match(
      source,
      /const hasContent = computed\(\(\) => hasCoachFreeTextContent\(props\.freeText\)\)/,
      'le composant doit déléguer au prédicat partagé du domaine'
    )
    // Le garde est sur la RACINE : sans lui le composant émet un `<div>` vide,
    // c'est-à-dire une surface vide sur la page.
    assert.match(
      source,
      /<div\s+v-if="hasContent"/,
      'la racine du composant doit être gardée par hasContent'
    )
  })

  // Le prédicat est du TypeScript pur : contrairement au SFC, il est
  // réellement exécutable par le coureur du dépôt, donc testé pour de vrai.
  describe('hasCoachFreeTextContent (prédicat partagé)', () => {
    const cases: Array<[string, Parameters<typeof hasCoachFreeTextContent>[0], boolean]> = [
      ['null', null, false],
      ['undefined', undefined, false],
      ['objet vide', {}, false],
      ['tableau vide', { paragraphs: [] }, false],
      ['titre blanc', { title: '   ', paragraphs: [] }, false],
      ['paragraphes blancs', { title: '', paragraphs: ['   ', ''] }, false],
      ['titre seul', { title: 'Bonjour', paragraphs: [] }, true],
      ['un seul paragraphe non blanc', { paragraphs: ['', 'texte'] }, true]
    ]

    for (const [label, input, expected] of cases) {
      test(`${label} → ${expected}`, () => {
        assert.equal(hasCoachFreeTextContent(input), expected)
      })
    }
  })

  test('le texte des paragraphes est porté par --color-crepuscule-700 (contraste AA)', () => {
    // `--color-brand-secondary` vaut --color-crepuscule-400 (#9685ab) sur
    // --color-surface-card (#ffffff) : 3.37:1, SOUS le minimum AA de 4.5:1
    // pour du corps de texte `text-lg` non gras. Le token des organisms
    // voisins est `--color-crepuscule-700` (#4d3f5c), à 9.63:1.
    const source = readFile(FREE_TEXT_COMPONENT_PATH)
    const paragraphTag = source.match(/<p[\s\S]*?<\/p>/g)?.find(tag => tag.includes('{{ paragraph }}'))
    assert.ok(paragraphTag, 'le <p> du paragraphe est introuvable')
    assert.match(
      paragraphTag!,
      /class="[^"]*text-\[color:var\(--color-crepuscule-700\)\][^"]*"/,
      'le paragraphe doit utiliser --color-crepuscule-700'
    )
    assert.equal(
      /class="[^"]*text-\[color:var\(--color-brand-secondary\)\][^"]*"/.test(paragraphTag!),
      false,
      '--color-brand-secondary est à 3.37:1 sur fond blanc : sous le seuil AA'
    )
  })

  test('un <h2> seulement si le titre est présent, un <p> par paragraphe', () => {
    const source = readFile(FREE_TEXT_COMPONENT_PATH)
    assert.match(source, /<h2\s+v-if="title"/, 'le titre est optionnel : h2 conditionnel')
    assert.match(
      source,
      /v-for="\(paragraph, index\) in paragraphs"/,
      'un paragraphe par entrée'
    )
    assert.match(
      source,
      /class="whitespace-pre-line[^"]*"/,
      'whitespace-pre-line : les retours à la ligne saisis sont conservés'
    )
  })

  test('texte plat : aucun v-html, aucun assainisseur importé (AD-7)', () => {
    // Les commentaires du fichier parlent DU garde de rendu HTML : on les
    // retire avant de chercher un chemin de rendu (convention A32).
    const source = readFile(FREE_TEXT_COMPONENT_PATH)
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\/\/.*$/gm, '')
    assert.equal(/v-html/.test(source), false, 'le bloc libre ne produit jamais de HTML')
    assert.equal(
      /paste-sanitizer|page-content-sanitizer|sanitize/i.test(source),
      false,
      'aucun assainisseur : le rendu n\u2019est pas du HTML'
    )
    // Toute valeur du bloc est interpolée, jamais concaténée dans du markup.
    for (const tag of source.match(/<p[\s\S]*?<\/p>/g) ?? []) {
      assert.equal(
        /\{\{/.test(tag),
        true,
        'chaque paragraphe doit être rendu par interpolation Vue'
      )
    }
  })

  test('ni surface propre, ni valeur d\u2019apparence, ni texte de repli (AD-9)', () => {
    const source = readFile(FREE_TEXT_COMPONENT_PATH)
    // AD-9 : tout ce qui varie d\u2019un template à l\u2019autre est un paramètre de
    // l\u2019appelant. Un fond, une couleur ou un repli codé en dur ici
    // s\u2019imposerait à un template qui ne l\u2019avait pas.
    assert.equal(
      /bg-\[|background/.test(source),
      false,
      'le composant partagé ne porte aucune surface : l\u2019appelant l\u2019apporte'
    )
    assert.equal(
      /FALLBACK|fallback|placeholder=/.test(source),
      false,
      'aucun texte de repli codé en dur'
    )
  })

  test('audit var(--\u2026) : aucune variable fantôme dans app/assets/css/**', () => {
    const cssRoot = path.join(appRoot, 'assets', 'css')
    const declared = new Set<string>()
    const walk = (dir: string) => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name)
        if (entry.isDirectory()) {
          walk(full)
        } else if (entry.name.endsWith('.css')) {
          for (const m of fs.readFileSync(full, 'utf-8').matchAll(/--([\w-]+)\s*:/g)) {
            declared.add(`--${m[1]}`)
          }
        }
      }
    }
    walk(cssRoot)
    assert.ok(declared.size > 0, 'les variables CSS doivent être déclarées quelque part')

    const used = new Set<string>()
    for (const file of [FREE_TEXT_COMPONENT_PATH, ...TEMPLATES]) {
      for (const m of readFile(file).matchAll(/var\((--[\w-]+)\)/g)) {
        used.add(m[1]!)
      }
    }

    // `--color-…` est un préfixe Nuxt UI : seules les variables de JETON
    // maison (`--color-text-*`, `--color-brand-*`, `--color-crepuscule-*`,
    // `--color-surface-*`, `--color-border-*`, `--color-error`) sont
    // instanciées par le design system et donc auditables ici.
    const TOKEN_PREFIXES = [
      '--color-text-',
      '--color-brand-',
      '--color-crepuscule-',
      '--color-surface-',
      '--color-border-',
      '--color-error'
    ]
    const phantom = [...used].filter(
      variable =>
        TOKEN_PREFIXES.some(prefix => variable.startsWith(prefix))
        && !declared.has(variable)
    )
    assert.deepStrictEqual(
      phantom,
      [],
      `variables CSS fantômes : ${phantom.join(', ')}`
    )
  })
})

describe('YB.1.1 — insertion dans les quatre templates (Alba inclus, YB.1.2)', () => {
  for (const template of TEMPLATES) {
    test(`${template.split('/').pop()} rend CoachFreeText entre bénéfices et « qui suis-je »`, () => {
      const source = readFile(template)

      assert.match(
        source,
        /import CoachFreeText from '~\/components\/organisms\/CoachFreeText\.vue'/,
        'le composant est importé explicitement (convention des 4 templates)'
      )
      // Le <div> enveloppant porte la surface du template : il ne doit exister
      // QUE s'il y a du texte, sinon un bloc allume mais vide laisserait une
      // bande `bg-surface-card px-6 py-24` vide sur la page publique.
      assert.match(
        source,
        /const showFreeText = computed\(\(\) =>\s*show\.freeText\.value && hasCoachFreeTextContent\(/,
        'le garde de l\'appelant doit porter le toggle ET le contenu, pas le toggle seul'
      )
      assert.match(source, /import \{ hasCoachFreeTextContent \} from '~\/features\/coach\/domain\/coach-page-editor'/)

      const benefitsIdx = source.indexOf('<CoachTransformationBenefits')
      const freeTextIdx = source.indexOf('<CoachFreeText')
      assert.ok(benefitsIdx >= 0 && freeTextIdx > benefitsIdx, 'le bloc doit suivre les bénéfices')
      assert.match(source, /v-if="showFreeText"/)

      // La surface ET le reveal sont portés par l\u2019appelant (AD-9), pas par
      // le composant.
      assert.match(
        source,
        /v-if="showFreeText"[\s\S]{0,300}?v-bind="reveal\(\)"/,
        'le wrapper du bloc doit porter reveal() — le composant ne l\u2019a pas'
      )
      // CR round 2 : le binding profil → composant doit être asserté. Sans lui,
      // passer `null` laisse la suite verte et le bloc devient invisible sur
      // les 4 templates (le trou exact de la réserve A35 n° 1).
      assert.match(
        source,
        /<CoachFreeText :free-text="coachProfile\?\.freeTextJson \?\? null" \/>/,
        'le bloc doit recevoir le contenu du profil, jamais une valeur nulle'
      )
    })
  }

  test('aucun lien d\u2019ancre ni entrée de navigation ne pointe vers le bloc', () => {
    for (const template of TEMPLATES) {
      const source = readFile(template)
      assert.equal(
        /href="#free-?text"|#bloc-de-texte-libre/.test(source),
        false,
        'le bloc libre n\u2019est pas une cible de navigation : un ancre vers une section '
        + 'conditionnelle est un lien mort'
      )
      assert.equal(
        /:id="[^"]*freeText/.test(source),
        false,
        'le bloc libre ne reçoit pas d\u2019id d\u2019ancre'
      )
    }
  })
})

describe('YB.1.1 — l\u2019éditeur', () => {
  test('la bascule est DÉSACTIVÉE tant que le contenu est vide, avec sa raison affichée', () => {
    const source = readFile(COACH_PAGE_PATH)

    assert.match(
      source,
      /const hasFreeTextContent = computed\(\(\) => hasCoachFreeTextContent\(freeTextForm\.value\)\)/,
      'l\u2019éditeur doit appeler le prédicat PARTAGÉ, pas recopier la règle (CR round 2)'
    )
    assert.match(
      source,
      /function isSectionLocked\(section: string\): boolean \{\s*return isFreeTextSection\(section\)\s*&& !isSectionOn\(section\)\s*&& !hasFreeTextContent\.value\s*\}/,
      'le verrou ne doit interdire QUE l\'ACTIVATION d\'un bloc vide : un bloc déjà '
      + 'allumé reste désactivable, sinon une coach qui a tout effacé se retrouve '
      + 'avec une bascule ON verrouillée dont elle ne peut plus sortir'
    )
    assert.match(
      source,
      /:disabled="isSectionLocked\(section\)"/,
      'la bascule partagée doit porter :disabled'
    )
    // `disabled` retire le contrôle de l\u2019ordre de tabulation : la raison doit
    // donc exister dans le DOM, et pas seulement dans un title.
    assert.match(
      source,
      /data-testid="free-text-lock-reason"/,
      'la raison du verrou doit être rendue dans le DOM'
    )
  })

  test('le corps du bloc reste déplié même éteint (sinon il est impossible d\u2019écrire)', () => {
    const source = readFile(COACH_PAGE_PATH)
    assert.match(
      source,
      /function isSectionBodyOpen\(section: string\): boolean \{\s*return isSectionOn\(section\) \|\| isFreeTextSection\(section\)\s*\}/,
      'le formulaire doit rester atteignable : un interrupteur verrouillé est un cul-de-sac'
    )
  })

  test('formulaire : titre optionnel, un textarea par paragraphe, ajout borné', () => {
    const source = readFile(COACH_PAGE_PATH)

    assert.match(source, /section === 'freeText'/)
    assert.match(
      source,
      /FREE_TEXT_TITLE_MAX_LENGTH\s*=\s*200/,
      'titre ≤ 200 caractères (aligné sur FreeTextJsonDto)'
    )
    assert.match(
      source,
      /FREE_TEXT_PARAGRAPH_MAX\s*=\s*10/,
      '10 paragraphes maximum (aligné sur FreeTextJsonDto et sur le plafond déjà appliqué à l\u2019éditeur)'
    )
    assert.match(source, /FREE_TEXT_PARAGRAPH_MAX_LENGTH\s*=\s*2000/)
    assert.match(
      source,
      /v-for="\(_, idx\) in \(freeTextForm\?\.paragraphs \?\? \[\]\)"/,
      'un textarea par paragraphe'
    )
    // Convention du dépôt : tout UTextarea porte w-full.
    assert.match(
      source,
      /<UTextarea\s+:model-value="freeTextForm!\.paragraphs\[idx\]"[\s\S]{0,200}?class="w-full"/,
      'le textarea du bloc doit être pleine largeur'
    )
    // CR round 2 : le FormControl « Paragraphes » doit câbler `inputAttrs`
    // (id + aria-describedby) sur le premier textarea — sinon son `<label for>`
    // et son hint ne pointent sur aucun élément.
    assert.match(
      source,
      /id="freeTextParagraph"[\s\S]{0,600}?<template #default="\{ inputAttrs \}">[\s\S]{0,2000}?v-bind="idx === 0 \? inputAttrs : \{\}"/,
      'le label et le hint du bloc doivent être associés au premier textarea'
    )
    assert.match(
      source,
      /:disabled="\(freeTextForm\?\.paragraphs\?\.length \?\? 0\) >= FREE_TEXT_PARAGRAPH_MAX"/,
      'l\u2019ajout est borné'
    )
    assert.match(
      source,
      /data-testid="free-text-paragraph-limit-reason"/,
      'un contrôle borné affiche sa raison — `disabled` le sort de la tabulation'
    )
  })

  test('l\u2019aperçu reflète la saisie NON enregistrée (liste d\u2019autorisation exhaustive)', () => {
    const page = readFile(COACH_PAGE_PATH)
    assert.match(
      page,
      /freeTextForm: freeTextForm as unknown as/,
      'le formulaire doit être passé au composable d\u2019aperçu'
    )

    const preview = readFile('features/coach/useCoachPagePreviewProfile.ts')
    // Un champ non inscrit est IGNORÉ SILENCIEUSEMENT : pas d'erreur, pas de
    // champ dans le draft. Les cinq points d\u2019inscription sont donc figés ici.
    assert.match(preview, /freeTextForm\?: Ref<FreeTextJson \| null>/, 'dép (watch)')
    assert.match(preview, /freeText: FreeTextJson \| null/, 'snapshot')
    assert.match(preview, /freeText: null\n {2}\}/, 'emptySnapshot')
    assert.match(
      preview,
      /freeText: cloneRaw\(deps\.freeTextForm\?\.value \?\? null\)/,
      'commitSnapshot'
    )
    assert.match(preview, /freeTextJson: snap\.hydrated \? snap\.freeText : \(acc\.freeTextJson \?\? null\)/, 'draftCoachProfile')
  })
})
