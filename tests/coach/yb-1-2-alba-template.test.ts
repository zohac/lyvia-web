import * as assert from 'node:assert/strict'
import * as fs from 'node:fs'
import * as path from 'node:path'
import test, { describe } from 'node:test'

/**
 * YB.1.2 — Template « Alba » (code `visuel-portrait`), hero portrait à gauche.
 *
 * AD-10 : le coureur du dépôt est `tsc -p tsconfig.tests.json && node --test`,
 * il ne compile AUCUN composant monofichier. Ces assertions portent donc sur la
 * SOURCE du `.vue`, comme celles de `yc2-3-essentiel-template.test.ts` pour le
 * hero d'Essentiel — et non sur un rendu. Le rendu lui est une revue navigateur
 * (A35), dont le compte rendu est dans la spec YB.1.2.
 *
 * Chaque test ici ferme un SILENCE : une propriété absente d'Alba ne casse ni le
 * lint, ni le typecheck, ni les tests de rendu. `heroHeadline` était inerte sur
 * Alba, et l'ancre `#qui-suis-je` pointait vers une section éteinte.
 */

// Tests run from compiled .tmp/test-dist/ — resolve from process.cwd() (/app)
const appRoot = path.resolve(process.cwd(), 'app')

function readFile(relativePath: string): string {
  return fs.readFileSync(path.join(appRoot, relativePath), 'utf-8')
}

function readTemplateBlock(relativePath: string): string {
  const content = readFile(relativePath)
  // Greedy match: the outer <template> contains <template #header> slots whose
  // closing </template> would end a non-greedy capture early. Greedy reaches the
  // LAST </template>.
  const match = content.match(/<template>([\s\S]*)<\/template>/)
  return match?.[1] ?? ''
}

const ALBA_PATH = 'components/templates/coach-pages/CoachPageAlba.vue'
const ALBA_HERO_PATH = 'components/templates/coach-pages/alba/CoachAlbaHero.vue'

describe('YB.1.2 — CoachAlbaHero rend l\'accroche saisie par la coach', () => {
  test('le H1 rend `heroHeadline` quand la coach en a saisi un', () => {
    // Sans cela, le champ « Accroche / Sous-titre principal » de l'éditeur est
    // INERT sur Alba : la valeur est lue par l'appelant, transmise, puis
    // ignorée. Les trois autres templates la rendent (CoachVisuelHero,
    // CoachEssentielHero) — Alba ne doit pas être le cas particulier.
    const template = readTemplateBlock(ALBA_HERO_PATH)
    assert.match(
      template,
      /v-if="configuredHeadline"[\s\S]{0,200}?\{\{\s*configuredHeadline\s*\}\}/,
      'le H1 doit rendre l\'accroche configurée quand elle existe'
    )
  })

  test('`configuredHeadline` se lit sur `heroHeadline`, et le H1 garde « Bonjour, je suis X. » en repli', () => {
    const source = readFile(ALBA_HERO_PATH)
    // La lecture se fait sur la PROPRIÉTÉ, pas sur un littéral : c'est le champ
    // de l'éditeur qui alimente le H1.
    assert.match(
      source,
      /const configuredHeadline = computed\(\(\) => props\.heroHeadline\?\.trim\(\) \|\| ''\)/,
      'configuredHeadline doit dériver de props.heroHeadline'
    )
    // Le repli humanisé est conservé, et il est conditionnel.
    const template = readTemplateBlock(ALBA_HERO_PATH)
    assert.match(
      template,
      /<template v-else>[\s\S]{0,300}?Bonjour, je suis[\s\S]{0,300}?\{\{ firstName \|\| displayName \}\}\./,
      'sans accroche, le H1 doit garder « Bonjour, je suis {prénom}. »'
    )
  })

  test('l\'appelant transmet bien `heroHeadline` dans `heroProps`', () => {
    // Ferme la chaîne complète : le H1 ne peut pas être alimenté si
    // l'appelant cesse de le transmettre.
    const source = readFile(ALBA_PATH)
    assert.match(
      source,
      /heroHeadline: props\.coachProfile\?\.heroHeadline \?\? null/,
      'CoachPageAlba doit transmettre heroHeadline au hero'
    )
  })

  test('l\'aide de l\'éditeur décrit un repli PAR TEMPLATE, jamais un repli faux', () => {
    // Revue YB.1.2 — le `FormControl` `heroHeadline` est partagé par les
    // quatre templates, mais chaque hero a son propre repli. Une phrase unique
    // était vraie pour Alba/Essentiel et FAUSSE pour Visuel et Signature.
    const page = readFile('pages/provider/coach-page.vue')
    assert.equal(
      /Laissez vide pour afficher la spécialité par défaut/.test(page),
      false,
      'l\'aide ne doit plus promettre un repli que deux heroes ne rendent pas'
    )
    assert.match(
      page,
      /:hint="heroHeadlineHint"/,
      'le hint doit être dérivé du template, pas figé dans le markup'
    )
    const decl = page.match(/const heroHeadlineHint = computed<string>\(\(\) => \{[\s\S]*?\n\}\)/)
    assert.ok(decl, 'la déclaration de heroHeadlineHint est introuvable')
    assert.match(decl![0], /Bonjour, je suis/, 'repli Alba/Essentiel absent')
    assert.match(decl![0], /Retrouvez votre équilibre/, 'repli Visuel absent')
    assert.match(decl![0], /Spécialiste accompagnement ménopause/, 'repli Signature absent')
  })
})

describe('YB.1.2 — l\'ancre secondaire du hero n\'est pas un lien mort', () => {
  test('l\'ancre `#qui-suis-je` est gardée par la visibilité de la bio', () => {
    const template = readTemplateBlock(ALBA_HERO_PATH)
    const anchor = template.match(/<a\s[\s\S]{0,400}?href="#qui-suis-je"/)
    assert.ok(anchor, 'l\'ancre #qui-suis-je est introuvable dans le hero')
    assert.match(
      anchor![0],
      /v-if="showBio"/,
      'l\'ancre doit être gardée par `showBio` — sinon elle mène à une section éteinte'
    )
  })

  test('`showBio` est un prop OBLIGATOIRE, alimenté par `show.bio`', () => {
    // Facultatif, l'ancre disparaîtrait silencieusement dès que l'appelant
    // oublie le prop — donc le lien mort réapparaîtrait sans erreur. En
    // obligatoire, l'oubli est une erreur de compilation.
    const hero = readFile(ALBA_HERO_PATH)
    assert.match(
      hero,
      /defineProps<CoachHeroProps & \{/,
      'les props du hero d\'Alba s\'étendent celles du hero partagé'
    )
    assert.match(
      hero,
      /^\s*showBio: boolean\s*$/m,
      'showBio doit être déclaré comme prop REQUIS sur le hero d\'Alba'
    )
    assert.equal(
      /showBio\?:/.test(hero),
      false,
      'showBio ne doit pas devenir optionnel : l\'ancre réapparaîtrait en lien mort'
    )
    // La source de vérité est le même interrupteur que celui du header.
    const page = readFile(ALBA_PATH)
    assert.match(
      page,
      /<CoachAlbaHero[\s\S]{0,200}?:show-bio="showBio"/,
      'le hero doit recevoir showBio'
    )
    assert.match(
      page,
      /const showBio = show\.bio/,
      'showBio doit être l\'interrupteur `show.bio` du composable de visibilité'
    )
  })

  test('l\'ancre du HEADER reste conditionnée par le même interrupteur', () => {
    // Le header est l'autre endroit qui pointe vers `#qui-suis-je`. Les deux
    // doivent disparaître ensemble, sinon il en reste un des deux.
    const page = readFile(ALBA_PATH)
    assert.match(
      page,
      /if \(showBio\.value\) links\.push\(\{ label: 'Qui suis-je', href: '#qui-suis-je' \}\)/,
      'l\'ancre du header doit rester conditionnée par showBio'
    )
  })

  test('le CTA PRINCIPAL reste un bouton de navigation, pas une ancre conditionnelle', () => {
    // Garde-fou : on ne « corrige » pas l'ancre en retirant le CTA principal.
    const template = readTemplateBlock(ALBA_HERO_PATH)
    assert.match(template, /<UButton[\s\S]{0,200}?:to="ctaTo"/, 'le CTA principal doit rester un UButton :to')
    assert.match(template, /data-hero-cta/, 'le CTA principal doit garder son marqueur data-hero-cta')
  })
})

describe('YB.1.2 — le bloc photo d\'Alba et l\'ordre du menu (AC 1)', () => {
  test('la photo est à GAUCHE : `lg:col-span-5` précède `lg:col-span-7`', () => {
    // AC 1 — la disposition fondatrice du template. Sans assertion, une
    // inversion des colonnes (photo à droite = Essentiel) passerait sous
    // lint/typecheck/tests et ne serait vue qu'en capture navigateur.
    const template = readTemplateBlock(ALBA_HERO_PATH)
    const photoIdx = template.indexOf('lg:col-span-5')
    const contentIdx = template.indexOf('lg:col-span-7')
    assert.ok(photoIdx >= 0, 'la photo doit porter lg:col-span-5')
    assert.ok(contentIdx >= 0, 'le contenu doit porter lg:col-span-7')
    assert.ok(
      photoIdx < contentIdx,
      'la photo (col-span-5) doit précéder le contenu (col-span-7) dans le DOM'
    )
  })

  test('le hero n\'a pas d\'image de fond : portrait seul, `heroPhotoUrl`/`heroImageDisabled` jamais lus', () => {
    const template = readTemplateBlock(ALBA_HERO_PATH)
    // Révision de design 2026-09-30 (PO) : le hero est devenu sombre immersif et
    // porte des dégradés décoratifs. L'invariant qui reste est « aucune image de
    // fond » : on ne lit donc ni le champ « Photo d'en-tête » (`heroPhotoUrl`)
    // ni son drapeau (`heroImageDisabled`), tous deux propres à Visuel.
    assert.equal(
      /heroPhotoUrl/.test(template),
      false,
      'le hero d\'Alba ne doit pas lire heroPhotoUrl (image de fond de Visuel)'
    )
    assert.equal(
      /heroImageDisabled/.test(template),
      false,
      'le hero d\'Alba ne doit pas lire heroImageDisabled (drapeau du hero immersif de Visuel)'
    )
    assert.match(
      template,
      /<NuxtImg[\s\S]{0,400}?:src="portraitSrc"/,
      'le portrait doit être rendu comme une image explicite'
    )
  })

  test('le hero est TOUJOURS rendu (aucun v-if sur <CoachAlbaHero>)', () => {
    const page = readFile(ALBA_PATH)
    const heroTag = page.match(/<CoachAlbaHero[\s\S]*?\/>/)
    assert.ok(heroTag, '<CoachAlbaHero> introuvable dans CoachPageAlba')
    assert.equal(
      /v-if/.test(heroTag![0]),
      false,
      'le hero ne doit pas être conditionnel'
    )
  })

  test('le menu suit l\'ordre du document (témoignages avant piliers et parcours)', () => {
    // Revue YB.1.2 — l'ordre du `navLinks` d'Alba contredisait l'ordre de
    // rendu : « Approche »/« Parcours » étaient listés avant « Témoignages »,
    // alors que la page les rend après.
    const page = readFile(ALBA_PATH)
    const navBlock = page.match(/const navLinks = computed[\s\S]*?\n\}\)/)
    assert.ok(navBlock, 'le bloc navLinks est introuvable')
    const nav = navBlock![0]
    assert.ok(
      nav.indexOf('#qui-suis-je') < nav.indexOf('#temoignages'),
      '« Qui suis-je » doit précéder « Témoignages »'
    )
    assert.ok(
      nav.indexOf('#temoignages') < nav.indexOf('#approche'),
      '« Témoignages » doit précéder « Approche »'
    )
    assert.ok(
      nav.indexOf('#approche') < nav.indexOf('#parcours'),
      '« Approche » doit précéder « Parcours »'
    )
  })
})
