import * as assert from 'node:assert/strict'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { describe, test } from 'node:test'

/**
 * LAB.4 — câblage de la page, là où le harness SFC ne peut pas aller.
 *
 * `coach-page.vue` exige une application Nuxt complète : le harness
 * (`tests/helpers/render-sfc.ts`) ne rend que de petits composants, et
 * aucun test de la suite ne monte cette page. Les assertions ci-dessous
 * portent donc sur la source réelle (Convention A32), mais sur les DEUX
 * points dont l'absence rend l'éditeur injoignable ou l'enregistrement
 * inopérant — c'est exactement la mutation qui laissait la suite verte
 * en revue (`section === 'certification'`, `updateAccount({ credentials: [] })`).
 */

const appRoot = path.resolve(process.cwd(), 'app')

function read(relative: string): string {
  return fs.readFileSync(path.join(appRoot, relative), 'utf-8')
}

const coachPage = () => read('pages/provider/coach-page.vue')
const accountPage = () => read('pages/provider/account.vue')

describe('LAB.4 — la section certifications rend le composant partagé', () => {
  test('le composant est importé explicitement (aucune résolution magique)', () => {
    assert.match(
      coachPage(),
      /^import CoachPageCertificationsCard from '~\/components\/organisms\/CoachPageCertificationsCard\.vue'$/m
    )
  })

  test('la branche `section === \'certifications\'` monte le composant partagé', () => {
    // TF.1 (revue) — la regex précédente tolérait n'importe quel `v-if` plus
    // loin dans le fichier. Le `v-if` doit porter sur la balise elle-même.
    assert.match(
      coachPage(),
      /<CoachPageCertificationsCard\s+v-if="section === 'certifications'"/,
      'la branche certifications doit rendre CoachPageCertificationsCard sous condition'
    )
  })

  test('la carte reçoit les credentials et relaie la saisie', () => {
    const source = coachPage()
    assert.match(source, /:credentials="credentialsForm"/, 'les credentials doivent descendre vers la carte')
    assert.match(
      source,
      /@update:credentials="credentialsForm = \$event"/,
      'la saisie de l’éditeur doit remonter dans l’état de la page — sinon onSaveCredentials écrit une liste vide'
    )
  })

  test('le bouton Enregistrer de la branche appelle onSaveCredentials', () => {
    assert.match(
      coachPage(),
      /<CoachPageCertificationsCard[\s\S]*?@save="onSaveCredentials"/
    )
  })
})

describe('LAB.4 — l\'enregistrement écrit par le store unique de la page coach', () => {
  test('onSaveCredentials passe la liste au store (aucun second chemin d\'écriture)', () => {
    const source = coachPage()
    const start = source.indexOf('async function onSaveCredentials()')
    assert.ok(start >= 0, 'onSaveCredentials introuvable')
    const handler = source.slice(start, source.indexOf('\n}', start))
    assert.match(handler, /updateAccount\(\{ credentials: filtered \}\)/)
    // LAB.4 P3 — un titre vide ne doit plus être avalé en silence (`required`
    // est inerte hors formulaire depuis le déplacement).
    assert.match(handler, /!c\.title\?\.trim\(\)/)
  })

  test('le formulaire de Mon compte a bien disparu (une seule source d\'édition)', () => {
    const source = accountPage()
    assert.equal(source.includes('credentialsForm'), false, 'état local des certifications encore présent')
    assert.equal(source.includes('handleCredentialsSubmit'), false, 'handler d\'enregistrement encore présent')
    assert.equal(source.includes('certification_logo'), false, 'upload de logo certification encore présent')
    assert.equal(source.includes('Diplômes & certifications'), false, 'section encore rendue dans Mon compte')
  })
})
