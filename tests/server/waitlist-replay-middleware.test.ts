import * as assert from 'node:assert/strict'
import { createServer, type Server } from 'node:http'
import { after, before, describe, it } from 'node:test'
import { createApp, eventHandler, setResponseHeader, toNodeListener } from 'h3'
import middleware from '../../server/middleware/waitlist-replay'
import { waitlistReplayStore } from '../../server/utils/waitlist-replay-store'

let server: Server
let base: string
const cache = 's-maxage=60, stale-while-revalidate=300'
before(async () => {
  const app = createApp()
  app.use(eventHandler((event) => {
    setResponseHeader(event, 'cache-control', cache)
  }))
  app.use(middleware)
  app.use(eventHandler(event => ({ replay: event.context.waitlistReplay ?? null })))
  server = createServer(toNodeListener(app))
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve))
  const address = server.address()
  if (!address || typeof address === 'string') throw new Error('Port absent')
  base = `http://127.0.0.1:${address.port}`
})
after(() => new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve())))

describe('WA.6 : headers et portée réels h3/fetch', () => {
  for (const query of ['access=received', 'access=error', 'access=rate-limited', 'access=unavailable', 'r=', 'access=', 'r=a&r=b']) {
    it(`${query} : no-store`, async () => {
      assert.equal((await fetch(`${base}/?${query}`)).headers.get('cache-control'), 'no-store')
    })
  }
  it('racine sans état : cache CDN intact', async () => {
    assert.equal((await fetch(`${base}/`)).headers.get('cache-control'), cache)
  })
  for (const path of ['/', '/?access=error&']) {
    it(`GET ${path} : consommation unique`, async () => {
      const values = { firstName: 'Fixture', email: 'fixture@example.com' }
      const token = waitlistReplayStore.save(values)
      const url = `${base}${path}${path.includes('?') ? '' : '?'}r=${token}`
      const response = await fetch(url)
      assert.equal(response.headers.get('cache-control'), 'no-store')
      assert.deepEqual((await response.json()).replay, values)
      assert.equal((await (await fetch(url)).json()).replay, null)
    })
  }
  for (const [path, method] of [['/asset.js', 'GET'], ['/api/public/tenant', 'GET'], ['/', 'HEAD'], ['/', 'POST']]) {
    it(`${method} ${path} ne consomme rien`, async () => {
      const values = { firstName: 'Fixture' }
      const token = waitlistReplayStore.save(values)
      const response = await fetch(`${base}${path}?r=${token}`, { method })
      assert.equal(response.headers.get('cache-control'), 'no-store')
      assert.deepEqual(waitlistReplayStore.consume(token), values)
    })
  }
})
