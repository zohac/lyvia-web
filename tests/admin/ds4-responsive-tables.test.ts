import * as assert from 'node:assert/strict'
import * as fs from 'node:fs'
import * as path from 'node:path'
import test from 'node:test'

const repoRoot = process.cwd()
const appRoot = path.resolve(repoRoot, 'app')

function readAppFile(relativePath: string): string {
  return fs.readFileSync(path.join(appRoot, relativePath), 'utf-8')
}

// ---------------------------------------------------------------------------
// Providers
// ---------------------------------------------------------------------------

test('DS4.3: providers page has desktop UTable in hidden md:block', () => {
  const src = readAppFile('pages/admin/providers/index.vue')
  assert.match(src, /hidden md:block/)
  assert.match(src, /UTable/)
})

test('DS4.3: providers page has mobile cards in md:hidden', () => {
  const src = readAppFile('pages/admin/providers/index.vue')
  assert.match(src, /md:hidden/)
})

test('DS4.3: providers mobile cards show Stripe status badge', () => {
  const src = readAppFile('pages/admin/providers/index.vue')
  assert.match(src, /getMobileStripeStatus/)
})

test('DS4.3: providers mobile cards use NuxtLink (not div @click)', () => {
  const src = readAppFile('pages/admin/providers/index.vue')
  const mobileSection = src.split('md:hidden')[1]?.split('Pagination')[0] ?? ''
  assert.match(mobileSection, /NuxtLink/)
  assert.equal(mobileSection.includes('<div') && mobileSection.includes('@click'), false)
})

test('DS4.3: providers mobile cards have focus-visible outline', () => {
  const src = readAppFile('pages/admin/providers/index.vue')
  const mobileSection = src.split('md:hidden')[1]?.split('Pagination')[0] ?? ''
  assert.match(mobileSection, /focus-visible:outline/)
})

// ---------------------------------------------------------------------------
// Clients
// ---------------------------------------------------------------------------

test('DS4.3: clients page has desktop UTable in hidden md:block', () => {
  const src = readAppFile('pages/admin/clients/index.vue')
  assert.match(src, /hidden md:block/)
  assert.match(src, /UTable/)
})

test('DS4.3: clients page has mobile cards in md:hidden', () => {
  const src = readAppFile('pages/admin/clients/index.vue')
  assert.match(src, /md:hidden/)
})

test('DS4.3: clients mobile cards use NuxtLink (not div @click)', () => {
  const src = readAppFile('pages/admin/clients/index.vue')
  const mobileSection = src.split('md:hidden')[1]?.split('Pagination')[0] ?? ''
  assert.match(mobileSection, /NuxtLink/)
  assert.equal(mobileSection.includes('<div') && mobileSection.includes('@click'), false)
})

test('DS4.3: clients mobile cards show key info (stage, status, consultations, date)', () => {
  const src = readAppFile('pages/admin/clients/index.vue')
  const mobileSection = src.split('md:hidden')[1]?.split('Pagination')[0] ?? ''
  assert.match(mobileSection, /STAGE_LABELS/)
  assert.match(mobileSection, /isActive/)
  assert.match(mobileSection, /consultationsCompleted/)
  assert.match(mobileSection, /formatDateShort/)
})

// ---------------------------------------------------------------------------
// Business Logs
// ---------------------------------------------------------------------------

test('DS4.3: business logs panel has desktop UTable in hidden md:block', () => {
  const src = readAppFile('components/organisms/AdminBusinessLogsPanel.vue')
  assert.match(src, /hidden md:block/)
  assert.match(src, /UTable/)
})

test('DS4.3: business logs panel has mobile cards in md:hidden', () => {
  const src = readAppFile('components/organisms/AdminBusinessLogsPanel.vue')
  assert.match(src, /md:hidden/)
})

test('DS4.3: business logs mobile cards use button (not div @click)', () => {
  const src = readAppFile('components/organisms/AdminBusinessLogsPanel.vue')
  const mobileSection = src.split('md:hidden')[1]?.split('Pagination')[0] ?? ''
  assert.match(mobileSection, /<button/)
  assert.match(mobileSection, /type="button"/)
})

test('DS4.3: business logs mobile cards have focus-visible outline', () => {
  const src = readAppFile('components/organisms/AdminBusinessLogsPanel.vue')
  const mobileSection = src.split('md:hidden')[1]?.split('Pagination')[0] ?? ''
  assert.match(mobileSection, /focus-visible:outline/)
})

// ---------------------------------------------------------------------------
// Notification Logs
// ---------------------------------------------------------------------------

test('DS4.3: notification logs panel has desktop UTable in hidden md:block', () => {
  const src = readAppFile('components/organisms/AdminNotificationLogsPanel.vue')
  assert.match(src, /hidden md:block/)
  assert.match(src, /UTable/)
})

test('DS4.3: notification logs panel has mobile cards in md:hidden', () => {
  const src = readAppFile('components/organisms/AdminNotificationLogsPanel.vue')
  assert.match(src, /md:hidden/)
})

test('DS4.3: notification logs mobile cards use button (not div @click)', () => {
  const src = readAppFile('components/organisms/AdminNotificationLogsPanel.vue')
  const mobileSection = src.split('md:hidden')[1]?.split('Pagination')[0] ?? ''
  assert.match(mobileSection, /<button/)
  assert.match(mobileSection, /type="button"/)
})

test('DS4.3: notification logs mobile cards show key info (type, status, channel, recipient, date)', () => {
  const src = readAppFile('components/organisms/AdminNotificationLogsPanel.vue')
  const mobileSection = src.split('md:hidden')[1]?.split('Pagination')[0] ?? ''
  assert.match(mobileSection, /getNotificationTypeBadgeClasses/)
  assert.match(mobileSection, /getNotificationStatusBadgeClasses/)
  assert.match(mobileSection, /notif\.channel/)
  assert.match(mobileSection, /formatRecipient/)
  assert.match(mobileSection, /formatDate/)
})

test('DS4.3: notification logs mobile cards have focus-visible outline', () => {
  const src = readAppFile('components/organisms/AdminNotificationLogsPanel.vue')
  const mobileSection = src.split('md:hidden')[1]?.split('Pagination')[0] ?? ''
  assert.match(mobileSection, /focus-visible:outline/)
})
