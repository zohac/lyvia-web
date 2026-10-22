import * as assert from 'node:assert/strict'
import { createServer, type Server } from 'node:http'
import { after, before, it } from 'node:test'
import { createApp, eventHandler, readBody, setResponseStatus, toNodeListener } from 'h3'
import handler from '../../server/routes/waitlist-submit.post'
import { waitlistReplayStore } from '../../server/utils/waitlist-replay-store'

let server: Server
let upstream: Server
let base: string
let upstreamBase: string
let status = 201
let captured: Record<string, string>
let networkFailure = false
async function listen(app: ReturnType<typeof createApp>): Promise<[Server, string]> {
  const server = createServer(toNodeListener(app))
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve))
  const address = server.address()
  if (!address || typeof address === 'string') throw new Error('Port absent')
  return [server, `http://127.0.0.1:${address.port}`]
}
before(async () => {
  const api = createApp()
  api.use(eventHandler(async (event) => {
    captured = await readBody(event)
    setResponseStatus(event, status)
    return { registered: status === 201 }
  }))
  ;[upstream, upstreamBase] = await listen(api)
  Object.assign(globalThis, {
    useRuntimeConfig: () => ({ apiBase: networkFailure ? 'http://127.0.0.1:1' : upstreamBase }),
    $fetch: async (url: string, options: { body: Record<string, string>, headers: Headers }) => {
      const headers = new Headers(options.headers)
      headers.set('content-type', 'application/json')
      const response = await fetch(url, { method: 'POST', headers, body: JSON.stringify(options.body) })
      if (!response.ok) throw Object.assign(new Error('upstream'), { statusCode: response.status })
      return response.json()
    }
  })
  const app = createApp()
  app.use(handler)
  ;[server, base] = await listen(app)
})
after(async () => {
  for (const item of [server, upstream]) {
    await new Promise<void>((resolve, reject) => item.close(error => error ? reject(error) : resolve()))
  }
  Reflect.deleteProperty(globalThis, '$fetch')
  Reflect.deleteProperty(globalThis, 'useRuntimeConfig')
})

for (const [code, state] of [[422, 'error'], [429, 'rate-limited'], [503, 'unavailable'], [0, 'unavailable']] as const) {
  it(`WA.6 : vrai handler ${code || 'réseau'} → 303 ${state}, replay sans leurre`, async () => {
    status = code
    networkFailure = code === 0
    const response = await fetch(base, {
      method: 'POST', redirect: 'manual',
      body: new URLSearchParams({ firstName: ' Fixture ', email: 'fixture@example.com', website: 'secret', intruder: 'x' })
    })
    assert.equal(response.status, 303)
    const target = new URL(response.headers.get('location') ?? '', base)
    assert.equal(target.searchParams.get('access'), state)
    assert.equal(target.hash, '#waitlist')
    const token = target.searchParams.get('r')
    if (!token) throw new Error('Jeton absent')
    assert.deepEqual(waitlistReplayStore.consume(token), { firstName: 'Fixture', email: 'fixture@example.com' })
    assert.equal(waitlistReplayStore.consume(token), null)
    if (code) assert.deepEqual(captured, { firstName: 'Fixture', email: 'fixture@example.com', website: 'secret' })
  })
}
for (const website of ['', 'secret']) {
  it(`WA.6 : succès ${website ? 'leurre' : 'humain'} → même vrai 303 received`, async () => {
    status = 201
    networkFailure = false
    const response = await fetch(base, { method: 'POST', redirect: 'manual', body: new URLSearchParams({ firstName: 'Fixture', website }) })
    assert.equal(response.status, 303)
    assert.equal(response.headers.get('location'), '/?access=received#waitlist')
    assert.deepEqual(captured, website ? { firstName: 'Fixture', website } : { firstName: 'Fixture' })
  })
}
