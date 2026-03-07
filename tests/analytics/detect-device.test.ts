import * as assert from 'node:assert/strict'
import test from 'node:test'

import { detectDeviceType, detectBrowser } from '../../app/features/analytics/helpers/detect-device'

// ── detectDeviceType ──

test('detectDeviceType: iPhone → mobile', () => {
  assert.equal(detectDeviceType('Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)'), 'mobile')
})

test('detectDeviceType: Android Mobile → mobile', () => {
  assert.equal(detectDeviceType('Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0 Mobile Safari/537.36'), 'mobile')
})

test('detectDeviceType: iPod → mobile', () => {
  assert.equal(detectDeviceType('Mozilla/5.0 (iPod touch; CPU iPhone OS 15_0 like Mac OS X)'), 'mobile')
})

test('detectDeviceType: iPad → tablet', () => {
  assert.equal(detectDeviceType('Mozilla/5.0 (iPad; CPU OS 16_0 like Mac OS X) AppleWebKit/605.1.15'), 'tablet')
})

test('detectDeviceType: Android tablet (no Mobile) → tablet', () => {
  assert.equal(detectDeviceType('Mozilla/5.0 (Linux; Android 12; SM-T870) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0 Safari/537.36'), 'tablet')
})

test('detectDeviceType: desktop Chrome → desktop', () => {
  assert.equal(detectDeviceType('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36'), 'desktop')
})

test('detectDeviceType: empty string → desktop', () => {
  assert.equal(detectDeviceType(''), 'desktop')
})

// ── detectBrowser ──

test('detectBrowser: Chrome UA → Chrome', () => {
  assert.equal(detectBrowser('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36'), 'Chrome')
})

test('detectBrowser: Firefox UA → Firefox', () => {
  assert.equal(detectBrowser('Mozilla/5.0 (X11; Linux x86_64; rv:109.0) Gecko/20100101 Firefox/115.0'), 'Firefox')
})

test('detectBrowser: Safari UA (no Chrome) → Safari', () => {
  assert.equal(detectBrowser('Mozilla/5.0 (Macintosh; Intel Mac OS X 13_4) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Safari/605.1.15'), 'Safari')
})

test('detectBrowser: Edge UA → Edge', () => {
  assert.equal(detectBrowser('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36 Edg/112.0.1722.48'), 'Edge')
})

test('detectBrowser: Opera UA → Opera', () => {
  assert.equal(detectBrowser('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36 OPR/98.0.4759.15'), 'Opera')
})

test('detectBrowser: unknown UA → Other', () => {
  assert.equal(detectBrowser('SomeBot/1.0'), 'Other')
})

test('detectBrowser: empty string → Other', () => {
  assert.equal(detectBrowser(''), 'Other')
})
