import * as assert from 'node:assert/strict'
import test from 'node:test'

import {
  buildShareSelectedPayload,
  filterSelectableClients,
  removeSharedClient,
  restoreSharedClient,
  sharedClientIds,
  shareResultMessage
} from '../../app/features/contents/domain/content-shares'
import type { ContentShareItem } from '../../app/features/contents/api/contents.contract'
import type { ProviderClientListItem } from '../../app/features/clients/api/clients.contract'

function share(id: string, sharedAt = '2026-01-01T00:00:00.000Z'): ContentShareItem {
  return { clientProfileId: id, firstname: 'A', lastname: 'B', sharedAt }
}

function client(
  id: string,
  first = 'X',
  last = 'Y',
  email = `${id}@example.com`
): ProviderClientListItem {
  return {
    clientProfileId: id,
    firstname: first,
    lastname: last,
    email,
    phone: '',
    stage: 'active',
    onboardingCallDone: true,
    currentProgramMonth: null,
    computedStatus: 'active',
    stats: { consultationsCompleted: 0, appointmentsTotal: 0, lastAppointmentAt: null, nextAppointmentAt: null },
    createdAt: '2026-01-01T00:00:00.000Z',
    hasScheduledDiscovery: false,
    hasActiveDiscovery: false
  }
}

test('sharedClientIds collects ids', () => {
  const ids = sharedClientIds([share('a'), share('b')])
  assert.equal(ids.has('a'), true)
  assert.equal(ids.has('c'), false)
})

test('removeSharedClient removes', () => {
  const out = removeSharedClient([share('a'), share('b')], 'a')
  assert.deepEqual(out.map(x => x.clientProfileId), ['b'])
})

test('restoreSharedClient re-adds and sorts by sharedAt desc', () => {
  const restored = restoreSharedClient(
    [share('b', '2026-02-01T00:00:00.000Z')],
    share('a', '2026-03-01T00:00:00.000Z')
  )
  assert.deepEqual(restored.map(x => x.clientProfileId), ['a', 'b'])
})

test('restoreSharedClient is idempotent', () => {
  const restored = restoreSharedClient([share('a')], share('a'))
  assert.equal(restored.length, 1)
})

test('filterSelectableClients excludes shared and filters by name', () => {
  const roster = [client('c1', 'Alice', 'Durand'), client('c2', 'Bob', 'Martin')]
  const out = filterSelectableClients(roster, [share('c1')], 'bob')
  assert.deepEqual(out.map(x => x.clientProfileId), ['c2'])
})

test('filterSelectableClients keeps an email match', () => {
  // `GET /provider/clients?q=` searches firstname/lastname/email: a name-only
  // local filter would hide the row the server just matched.
  const roster = [client('c1', 'Alice', 'Durand', 'marie@exemple.fr'), client('c2', 'Bob', 'Martin')]
  const out = filterSelectableClients(roster, [], 'marie@exemple.fr')
  assert.deepEqual(out.map(x => x.clientProfileId), ['c1'])
})

test('filterSelectableClients with empty query returns all non-shared', () => {
  const roster = [client('c1'), client('c2')]
  const out = filterSelectableClients(roster, [share('c1')], '')
  assert.deepEqual(out.map(x => x.clientProfileId), ['c2'])
})

test('buildShareSelectedPayload dedups and drops empty', () => {
  assert.equal(buildShareSelectedPayload([]), null)
  assert.deepEqual(buildShareSelectedPayload(['a', 'a', '', 'b']), { clientProfileIds: ['a', 'b'] })
})

test('shareResultMessage never claims a share that was not created', () => {
  assert.equal(shareResultMessage(0), 'Aucun nouveau partage créé.')
  assert.equal(shareResultMessage(1), '1 client ajouté.')
  assert.equal(shareResultMessage(3), '3 clients ajoutés.')
})
