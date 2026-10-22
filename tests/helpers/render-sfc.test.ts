/**
 * Le harnais de rendu SFC est l'infrastructure sur laquelle repose toute la suite
 * WA.1. Ses trois verrous « échec bruyamment » sont ce qui distingue une preuve
 * d'un faux vert : sans eux, un `setup` qui lève, un auto-import non stubé ou une
 * erreur de template se réduisent tous à `"<!-->"`, et **toute assertion négative
 * passe alors au vert sans rien prouver**.
 *
 * C'est exactement ce qui a été mesuré sur `AdminBusinessLogsPanel.vue` : sept
 * caractères de sortie, aucun échec, et un composant non fonctionnel considéré
 * couvert. Ces tests prouvent que le harnais échoue quand il le doit.
 *
 * Chaque fixture est écrite dans `tests/helpers/fixtures/` et ignorée par
 * `tsconfig.tests.json` : ce sont des SFC à syntaxe volontairement cassée, jamais
 * du code compilé.
 */
import assert from 'node:assert/strict'
import path from 'node:path'
import { describe, test } from 'node:test'

import { renderSfc } from './render-sfc'

function fixture(name: string): string {
  return path.join('tests', 'helpers', 'fixtures', name)
}

/** Le harnais doit échouer bruyamment, et son message doit nommer la cause. */
async function assertRejects(
  sfc: string,
  options: Parameters<typeof renderSfc>[1],
  expected: RegExp
): Promise<void> {
  await assert.rejects(
    () => renderSfc(sfc, options),
    (error: unknown) => {
      if (!(error instanceof Error)) {
        throw new Error(`renderSfc must reject with an Error, got: ${String(error)}`)
      }
      assert.match(error.message, expected)
      return true
    }
  )
}

describe('render-sfc — les verrous anti-faux-vert', () => {
  test('un composant valide rend du HTML exploitable', async () => {
    const html = await renderSfc(fixture('RendersText.vue'))

    assert.match(html, /bonjour/)
  })

  test('un setup qui lève est rejeté, pas rendu vide', async () => {
    await assertRejects(
      fixture('SetupThrows.vue'),
      {},
      /failed[\s\S]*boom[\s\S]*Stub the missing component/
    )
  })

  test('une erreur de syntaxe de template est rejetée', async () => {
    await assertRejects(
      fixture('BrokenTemplate.vue'),
      {},
      /failed|error/i
    )
  })

  test('un composant qui ne rend aucun élément est rejeté', async () => {
    await assertRejects(
      fixture('RendersNothing.vue'),
      {},
      /produced no element/
    )
  })

  test('allowEmpty autorise explicitement un rendu sans élément', async () => {
    const html = await renderSfc(fixture('RendersNothing.vue'), { allowEmpty: true })

    assert.ok(
      !/<(?!\/)[a-z]/i.test(html),
      `allowEmpty must return the bare placeholder comment, got: ${JSON.stringify(html)}`
    )
  })

  test('un auto-import non stubé est rejeté, pas rendu vide', async () => {
    await assertRejects(
      fixture('UnknownComponent.vue'),
      {},
      /failed[\s\S]*Stub the missing component/
    )
  })

  test('un composable global absent est rejeté, pas rendu vide', async () => {
    await assertRejects(
      fixture('UnknownComposable.vue'),
      {},
      /failed[\s\S]*inject the missing composable/
    )
  })

  test('un stub nommé enregistre bien le composant', async () => {
    const html = await renderSfc(fixture('UsesStub.vue'), {
      stubs: { UThing: { name: 'UThing', template: '<span>from-stub</span>' } }
    })

    assert.match(html, /from-stub/)
  })

  test('un mock par chemin remplace le module importé', async () => {
    const html = await renderSfc(fixture('UsesMockedModule.vue'), {
      mocks: { '~/features/waitlist/waitlist-labels': { LABEL: 'remplacé' } }
    })

    assert.match(html, /remplacé/)
  })

  test('un chemin introuvable est rejeté avec le chemin', async () => {
    await assertRejects('app/components/organisms/DoesNotExist.vue', {}, /DoesNotExist/)
  })
})
