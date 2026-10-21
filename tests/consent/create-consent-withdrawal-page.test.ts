import * as assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { ApiFetchError } from '../../app/services/api/api-error'
import { createConsentWithdrawalPage } from '../../app/features/preferences/create-consent-withdrawal-page'
import type { UpdatePublicConsentRequest } from '../../app/features/preferences/public-consent.contract'

/**
 * CC.2b / R5 — the tokenized withdrawal page, EXECUTED.
 *
 * The page is a `.vue` file and the repo has no Vue runner: `app/pages/
 * preferences.vue` could not be mounted, and every decision it took was
 * untested. The page is now a thin Nuxt wrapper over
 * `createConsentWithdrawalPage`, which imports nothing but `vue` — so the
 * Node runner can mount it and observe every reactive read.
 *
 * What that buys, concretely: the BODY THE PAGE SUBMITS is now covered by a
 * test that runs the code. Before, mutating the page to submit a fixed list
 * of channels (`['email', 'sms']`) instead of the visitor's own selection left
 * the whole suite green — 2010/2010 — while the page silently withdrew both
 * channels whatever the visitor had ticked.
 */

type Harness = {
  page: ReturnType<typeof createConsentWithdrawalPage>
  sent: UpdatePublicConsentRequest[]
  outcomes: string[]
}

function mountPage(options: {
  token?: string
  channels?: Array<'email' | 'sms'>
  initialState?: 'saved' | 'error' | 'rate-limited' | null
  failWith?: unknown
} = {}): Harness {
  const sent: UpdatePublicConsentRequest[] = []
  const outcomes: string[] = []

  const page = createConsentWithdrawalPage({
    getToken: () => options.token ?? 'tok',
    initialChannels: options.channels ?? [],
    initialState: options.initialState ?? null,
    send: async (body: UpdatePublicConsentRequest) => {
      sent.push(body)
      if (options.failWith !== undefined) throw options.failWith
    },
    notify: (outcome) => {
      outcomes.push(outcome)
    }
  })

  return { page, sent, outcomes }
}

describe('le corps réellement soumis par la page', () => {
  it('n\'envoie que le canal coché par la visiteuse', async () => {
    // LA régression R5. La visiteuse ne coche que « les emails » : le corps
    // doit porter `emailMarketingOptIn: false` et NE PAS porter
    // `smsMarketingOptIn` — sans quoi elle retirerait le SMS qu'elle n'a pas
    // demandé de retirer.
    const { page, sent } = mountPage({ token: 'tok', channels: ['email'] })

    await page.submit()

    assert.equal(sent.length, 1)
    assert.deepEqual(sent[0], {
      token: 'tok',
      emailMarketingOptIn: false
    })
    assert.equal('smsMarketingOptIn' in sent[0], false)
  })

  it('n\'envoie pas le canal coché par défaut quand la visiteuse n\'a rien coché', async () => {
    // Rien de coché : rien n'est envoyé du tout.
    const { page, sent } = mountPage({ token: 'tok', channels: [] })

    await page.submit()

    assert.equal(sent.length, 0)
    assert.equal(page.state.value, null)
  })

  it('envoie les deux canaux quand les deux sont cochés', async () => {
    const { page, sent } = mountPage({ token: 'tok', channels: ['email', 'sms'] })

    await page.submit()

    assert.deepEqual(sent[0], {
      token: 'tok',
      emailMarketingOptIn: false,
      smsMarketingOptIn: false
    })
  })

  it('envoie le token lu AU MOMENT de la soumission', async () => {
    // Le token est un `computed` côté page : s'il change, c'est le nouveau
    // qui doit partir.
    let token = 'premier'
    const sent: UpdatePublicConsentRequest[] = []

    const page = createConsentWithdrawalPage({
      getToken: () => token,
      initialChannels: ['email'],
      initialState: null,
      send: async (body) => {
        sent.push(body)
      }
    })

    token = 'second'
    await page.submit()

    assert.equal(sent[0]?.token, 'second')
  })

  it('n\'envoie jamais `true`', async () => {
    const { page, sent } = mountPage({ token: 'tok', channels: ['email', 'sms'] })

    await page.submit()

    assert.equal((Object.values(sent[0] ?? {}) as unknown[]).includes(true), false)
  })
})

describe('un 429 n\'est pas un échec de réseau', () => {
  it('affiche le libellé du dépôt, pas « préférences non enregistrées »', async () => {
    // R9 : un 429 (bucket partagé, LB2-5) ne doit pas laisser croire à la
    // visiteuse que son lien est périmé. Le libellé est celui du dépôt.
    const { page, outcomes } = mountPage({
      token: 'tok',
      channels: ['email'],
      failWith: new ApiFetchError({
        statusCode: 429,
        code: 'TOO_MANY_REQUESTS',
        message: 'Trop de requêtes'
      })
    })

    await page.submit()

    assert.equal(page.state.value, 'rate-limited')
    assert.equal(page.hasError.value, true)
    assert.match(page.errorMessage.value, /^Trop de tentatives\. Réessayez plus tard\./)
    assert.match(page.errorMessage.value, /Vos choix sont conservés/)
    assert.deepEqual(outcomes, ['rate-limited'])
  })

  it('garde la distinction pour un échec de transport', async () => {
    const { page, outcomes } = mountPage({
      token: 'tok',
      channels: ['email'],
      failWith: new Error('réseau coupé')
    })

    await page.submit()

    assert.equal(page.state.value, 'error')
    assert.equal(page.hasError.value, true)
    assert.match(page.errorMessage.value, /n’ont pas pu être enregistrées/)
    assert.deepEqual(outcomes, ['error'])
  })

  it('donne le même verdict pour un token valide et pour un token inconnu', async () => {
    // L'invariant de neutralité : le 429 est infrastructurel, il ne dépend
    // pas du token. Un message qui dépendrait de la validité le casserait.
    const rateLimited = new ApiFetchError({
      statusCode: 429,
      code: 'TOO_MANY_REQUESTS',
      message: 'Trop de requêtes'
    })

    const withValidToken = mountPage({ token: 'tok', channels: ['email'], failWith: rateLimited })
    const withUnknownToken = mountPage({ token: 'inconnu', channels: ['email'], failWith: rateLimited })

    await withValidToken.page.submit()
    await withUnknownToken.page.submit()

    assert.equal(withValidToken.page.errorMessage.value, withUnknownToken.page.errorMessage.value)
    assert.equal(withValidToken.page.state.value, withUnknownToken.page.state.value)
  })

  it('n\'évoque jamais l\'état du token, quel que soit l\'échec', async () => {
    const { page } = mountPage({
      token: 'tok',
      channels: ['email'],
      failWith: new ApiFetchError({
        statusCode: 429,
        code: 'TOO_MANY_REQUESTS',
        message: 'Trop de requêtes'
      })
    })

    await page.submit()

    assert.equal(/token|expir|invalid|introuv/i.test(page.errorMessage.value), false)
  })

  it('laisse la visiteuse réessayer : les choix restent cochés', async () => {
    const { page } = mountPage({
      token: 'tok',
      channels: ['email'],
      failWith: new Error('réseau coupé')
    })

    await page.submit()

    assert.equal(page.hasAnySelection.value, true)
    assert.deepEqual(page.selection.value, ['email'])
    assert.equal(page.isSubmitting.value, false)
  })
})

describe('le succès et la passivité', () => {
  it('confirme l\'enregistrement', async () => {
    const { page, outcomes } = mountPage({ token: 'tok', channels: ['email'] })

    await page.submit()

    assert.equal(page.state.value, 'saved')
    assert.equal(page.isSaved.value, true)
    assert.equal(page.hasError.value, false)
    assert.deepEqual(outcomes, ['saved'])
  })

  it('ne fait rien sur une soumission passive', async () => {
    // Aucun appel, aucun état : la page neutre.
    const { page, sent, outcomes } = mountPage({ token: 'tok', channels: [] })

    await page.submit()

    assert.equal(sent.length, 0)
    assert.equal(page.state.value, null)
    assert.deepEqual(outcomes, [])
  })

  it('ne fait rien sur un token inutilisable', async () => {
    const { page, sent } = mountPage({ token: '', channels: ['email'] })

    await page.submit()

    assert.equal(sent.length, 0)
    assert.equal(page.state.value, null)
  })

  it('rejoue l\'état porté par la redirection (chemin no-JS)', async () => {
    const { page } = mountPage({ token: 'tok', channels: ['email'], initialState: 'rate-limited' })

    assert.equal(page.state.value, 'rate-limited')
    assert.equal(page.hasError.value, true)
    assert.match(page.errorMessage.value, /^Trop de tentatives\./)
  })

  it('ignore une seconde soumission pendant qu\'une est en vol', async () => {
    const sent: UpdatePublicConsentRequest[] = []
    let releaseSend: () => void = () => {}

    const page = createConsentWithdrawalPage({
      getToken: () => 'tok',
      initialChannels: ['email'],
      initialState: null,
      send: async (body) => {
        sent.push(body)
        await new Promise<void>((resolve) => {
          releaseSend = resolve
        })
      }
    })

    const first = page.submit()
    assert.equal(page.isSubmitting.value, true)

    await page.submit()
    assert.equal(sent.length, 1)

    releaseSend()
    await first
    assert.equal(page.isSubmitting.value, false)
  })
})
