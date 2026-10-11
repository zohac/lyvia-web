import * as assert from 'node:assert/strict'
import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http'
import type { AddressInfo } from 'node:net'
import { after, before, describe, it } from 'node:test'

import { createApp, createRouter, toNodeListener } from 'h3'
import { $fetch } from 'ofetch'

/**
 * CC.2b, amended Task 4.2 — the no-JS relay, EXECUTED.
 *
 * `tests/server/preferences-submit.test.ts` runs the decision helper; this file
 * mounts the actual Nitro handler and POSTs to it. That gap was not cosmetic:
 * inverting `redirectTo('ok')` / `redirectTo('ko')` inside
 * `server/routes/preferences-submit.post.ts` left every other web test green,
 * so a no-JS visitor could be told "échec" after a withdrawal that had in fact
 * succeeded — the exact population of AC #5, covered only by regexes on source
 * text.
 *
 * The upstream is a REAL local `node:http` server, not a mocked `$fetch`, so
 * "the body the upstream actually received" is measured rather than asserted
 * about a stub. Only the two Nitro globals the handler reads — `useRuntimeConfig`
 * and `$fetch` — are supplied; everything else is the shipped code path.
 */

type Received = {
  method: string
  url: string
  headers: Record<string, string | undefined>
  body: string
}

let upstream: Server
let upstreamUrl: string
let listener: ReturnType<typeof createServer>
let listenerUrl: string
const received: Received[] = []

/** Set to make the upstream answer 500, which the relay must read as `error`. */
let upstreamStatus = 200

before(async () => {
  upstream = createServer((req: IncomingMessage, res: ServerResponse) => {
    const chunks: Buffer[] = []
    req.on('data', (chunk: Buffer) => chunks.push(chunk))
    req.on('end', () => {
      received.push({
        method: req.method ?? '',
        url: req.url ?? '',
        headers: {
          'x-forwarded-host': req.headers['x-forwarded-host'] as string | undefined,
          'x-forwarded-proto': req.headers['x-forwarded-proto'] as string | undefined,
          'accept': req.headers.accept as string | undefined
        },
        body: Buffer.concat(chunks).toString('utf8')
      })
      res.writeHead(upstreamStatus, { 'content-type': 'application/json' })
      res.end(JSON.stringify({ updated: true }))
    })
  })

  await new Promise<void>(resolve => upstream.listen(0, '127.0.0.1', resolve))
  const address = upstream.address() as AddressInfo
  upstreamUrl = `http://127.0.0.1:${address.port}`

  // The two Nitro globals the handler reads. Set before the module is loaded so
  // nothing can capture an undefined at import time.
  ;(globalThis as Record<string, unknown>).useRuntimeConfig = () => ({ apiBase: upstreamUrl })
  ;(globalThis as Record<string, unknown>).$fetch = $fetch

  // Imported dynamically for the reason above: the handler body resolves those
  // identifiers at call time, but keeping the order explicit makes the
  // dependency obvious.
  const handler = (await import('../../server/routes/preferences-submit.post')).default

  const router = createRouter()
  router.post('/preferences-submit', handler)
  const app = createApp()
  app.use(router)

  listener = createServer(toNodeListener(app))
  await new Promise<void>(resolve => listener.listen(0, '127.0.0.1', resolve))
  const listenerAddress = listener.address() as AddressInfo
  listenerUrl = `http://127.0.0.1:${listenerAddress.port}`
})

after(async () => {
  await new Promise<void>(resolve => listener.close(() => resolve()))
  await new Promise<void>(resolve => upstream.close(() => resolve()))
})

/** POSTs a urlencoded form to the mounted handler and returns the raw response. */
async function submitForm(
  fields: Record<string, string | string[]>
): Promise<{ status: number, location: string }> {
  const body = new URLSearchParams()
  for (const [key, value] of Object.entries(fields)) {
    for (const entry of Array.isArray(value) ? value : [value]) {
      body.append(key, entry)
    }
  }

  const response = await fetch(`${listenerUrl}/preferences-submit`, {
    method: 'POST',
    redirect: 'manual',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: body.toString()
  })

  return { status: response.status, location: response.headers.get('location') ?? '' }
}

function lastRequest(): Received {
  const request = received[received.length - 1]
  assert.ok(request, 'aucune requête reçue par l\'amont')
  return request
}

describe('POST /preferences-submit — relais no-JS monté (amended Task 4.2)', () => {
  it('relaye un PATCH et redirige en 303 vers state=saved', async () => {
    upstreamStatus = 200
    received.length = 0

    const { status, location } = await submitForm({
      token: 'tok-no-js-1',
      retrait: 'email'
    })

    // 303, pas 302 : le navigateur doit re-POSTer sur /preferences s'il
    // revient en arrière, et le corps du formulaire ne doit jamais partir là.
    assert.equal(status, 303)
    assert.equal(
      location,
      '/preferences?token=tok-no-js-1&state=saved'
    )

    // Ce que l'amont a RÉELLEMENT reçu.
    const request = lastRequest()
    assert.equal(request.method, 'PATCH')
    assert.equal(request.url, '/public/consent/preferences')
    assert.deepEqual(JSON.parse(request.body), {
      token: 'tok-no-js-1',
      emailMarketingOptIn: false
    })
  })

  it('relaye les deux canaux cochés avec un false explicite par canal', async () => {
    upstreamStatus = 200
    received.length = 0

    const { location } = await submitForm({
      token: 'tok-no-js-2',
      retrait: ['email', 'sms']
    })

    assert.match(location, /state=saved/)
    assert.deepEqual(JSON.parse(lastRequest().body), {
      token: 'tok-no-js-2',
      emailMarketingOptIn: false,
      smsMarketingOptIn: false
    })
  })

  it('redirige vers state=error en conservant les canaux cochés si l\'amont échoue', async () => {
    // 500 amont : le relais doit le lire comme un échec et ne surtout pas
    // annoncer un retrait enregistré.
    upstreamStatus = 500
    received.length = 0

    const { status, location } = await submitForm({
      token: 'tok-no-js-3',
      retrait: ['email', 'sms']
    })

    assert.equal(status, 303)
    assert.equal(
      location,
      '/preferences?token=tok-no-js-3&state=error&retrait=email%2Csms'
    )

    // Et rien n'a été présenté comme enregistré : c'est bien `error`.
    assert.equal(/state=saved/.test(location), false)
    upstreamStatus = 200
  })

  it('n\'appelle PAS l\'amont sur une soumission passive', async () => {
    // Rien n'est coché : la page ne doit rien écrire, donc le relais ne doit
    // rien demander. C'est l'invariant qui rend le formulaire sûr sans
    // pré-remplissage.
    upstreamStatus = 200
    received.length = 0

    const { status, location } = await submitForm({ token: 'tok-no-js-4' })

    assert.equal(status, 303)
    assert.equal(location, '/preferences?token=tok-no-js-4')
    assert.equal(/state=/.test(location), false)
    assert.equal(received.length, 0, 'aucun appel amont ne doit partir')
  })

  it('reste neutre sur un token vide ou hors bornes, sans appeler l\'amont', async () => {
    // Un lien tronqué (token vide) ou forgé (> 512) est un corps malformé : le
    // relais ne doit ni l'envoyer (422 → erreur), ni rendre un `state`. La page
    // répond la même chose neutre pour toute forme de token.
    upstreamStatus = 200
    received.length = 0

    const empty = await submitForm({ token: '', retrait: 'email' })
    assert.equal(empty.status, 303)
    assert.equal(empty.location, '/preferences')
    assert.equal(/state=/.test(empty.location), false)

    const tooLong = await submitForm({ token: 'a'.repeat(513), retrait: 'email' })
    assert.equal(tooLong.status, 303)
    assert.equal(/state=/.test(tooLong.location), false)

    assert.equal(received.length, 0, 'aucun appel amont ne doit partir')
  })

  it('ignore un champ forgé hors liste blanche', async () => {
    // Un `emailMarketingOptIn=true` glissé dans le formulaire ne doit jamais
    // atteindre l'API : ce chemin est un canal de retrait, pas d'opt-in.
    upstreamStatus = 200
    received.length = 0

    await submitForm({
      token: 'tok-no-js-5',
      retrait: 'email',
      emailMarketingOptIn: 'true',
      consentSource: 'settings'
    })

    const body = JSON.parse(lastRequest().body)
    assert.equal(body.emailMarketingOptIn, false)
    assert.equal('consentSource' in body, false)
  })

  it('transmet les en-têtes de confiance comme le proxy public', async () => {
    // `setForwardedHeaders` est ce qui garde la visiteuse dans son propre bucket
    // de rate limit (LB2-5, défaut ouvert hors périmètre) : il doit rester
    // câblé, pas seulement importé.
    upstreamStatus = 200
    received.length = 0

    await submitForm({ token: 'tok-no-js-6', retrait: 'sms' })

    const request = lastRequest()
    assert.ok(request.headers['x-forwarded-host'], 'x-forwarded-host manquant')
    assert.equal(request.headers['x-forwarded-proto'], 'http')
  })
})
