import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import {
  GOOGLE_TAG_ID_REGEX,
  resolveGoogleAdsConversionId,
  resolvePrimaryGoogleTagId,
  shouldMountGoogleAdsTag,
  toGoogleAdsConversionPayload
} from '../../app/features/consent/consent-logic'
import {
  fireGoogleAdsConversion,
  fireGoogleAdsConversionPixel,
  installGoogleAdsTag
} from '../../app/features/consent/google-ads-runtime'

type MockScript = {
  async: boolean
  src: string
}

function toArray(value: unknown): unknown[] {
  return Array.from(value as ArrayLike<unknown>)
}

describe('Google Ads runtime helpers', () => {
  it('accepts Google Tag IDs with the GT prefix', () => {
    assert.equal(GOOGLE_TAG_ID_REGEX.test('GT-NFDCLRLC'), true)
    assert.equal(GOOGLE_TAG_ID_REGEX.test('GT-ABC123456789'), true)
  })

  it('rejects non-GT values for the Google Tag ID field', () => {
    assert.equal(GOOGLE_TAG_ID_REGEX.test('AW-17979105489'), false)
    assert.equal(GOOGLE_TAG_ID_REGEX.test('G-NFDCLRLC'), false)
    assert.equal(GOOGLE_TAG_ID_REGEX.test('gt-NFDCLRLC'), false)
  })

  it('prefers an explicit GT tag over the legacy AW destination', () => {
    assert.equal(
      resolvePrimaryGoogleTagId({
        googleAdsId: 'AW-123456789',
        googleTagId: 'GT-NFDCLRLC'
      }),
      'GT-NFDCLRLC'
    )
  })

  it('ignores an invalid explicit Google Tag ID and keeps legacy AW fallback', () => {
    assert.equal(
      resolvePrimaryGoogleTagId({
        googleAdsId: 'AW-123456789',
        googleTagId: 'AW-17979105489'
      }),
      'AW-123456789'
    )
  })

  it('bridges Sophie AW destination to the known GT tag while the API lacks googleTagId', () => {
    assert.equal(
      resolvePrimaryGoogleTagId({
        googleAdsId: 'AW-17979105489',
        googleTagId: null
      }),
      'GT-NFDCLRLC'
    )
  })

  it('bridges Sophie GT tag back to the AW conversion destination when needed', () => {
    assert.equal(resolveGoogleAdsConversionId('GT-NFDCLRLC'), 'AW-17979105489')
  })

  it('falls back to the AW destination for legacy accounts without a known GT tag', () => {
    assert.equal(
      resolvePrimaryGoogleTagId({
        googleAdsId: 'AW-123456789',
        googleTagId: null
      }),
      'AW-123456789'
    )
  })

  it('does not mount Google Ads when no AW destination is configured', () => {
    assert.equal(shouldMountGoogleAdsTag({ id: null, label: null, tagId: null }), false)
  })
})

describe('Google Ads official gtag installation shape', () => {
  it('installs window.gtag, appends the selected tag script, and queues official commands', () => {
    const appendedScripts: MockScript[] = []
    const targetWindow: {
      dataLayer?: Array<IArguments | unknown[]>
      gtag?: (...args: unknown[]) => void
    } = {}

    const gtag = installGoogleAdsTag(
      targetWindow,
      () => ({ async: false, src: '' }),
      (element: MockScript) => {
        appendedScripts.push(element)
      },
      'GT-NFDCLRLC'
    )

    assert.equal(targetWindow.gtag, gtag)
    assert.equal(appendedScripts.length, 1)
    assert.equal(appendedScripts[0].async, true)
    assert.equal(
      appendedScripts[0].src,
      'https://www.googletagmanager.com/gtag/js?id=GT-NFDCLRLC'
    )

    const commands = targetWindow.dataLayer?.map(toArray) ?? []
    assert.equal(commands[0][0], 'consent')
    assert.equal(commands[0][1], 'default')
    assert.equal(commands[1][0], 'js')
    assert.equal(commands[2][0], 'config')
    assert.equal(commands[2][1], 'GT-NFDCLRLC')
    assert.equal(Object.prototype.toString.call(targetWindow.dataLayer?.[0]), '[object Arguments]')
  })
})

describe('Google Ads conversion payload', () => {
  it('keeps send_to on AW destination plus label', () => {
    assert.deepStrictEqual(
      toGoogleAdsConversionPayload('AW-17979105489', '1E9OCP6wkZAcENHBjf1C'),
      {
        send_to: 'AW-17979105489/1E9OCP6wkZAcENHBjf1C',
        value: 1.0,
        currency: 'EUR'
      }
    )
  })

  it('does not build a conversion payload without AW destination or label', () => {
    assert.equal(toGoogleAdsConversionPayload(null, '1E9OCP6wkZAcENHBjf1C'), null)
    assert.equal(toGoogleAdsConversionPayload('AW-17979105489', null), null)
  })

  it('adds a transaction ID when a booking id is available', () => {
    assert.deepStrictEqual(
      toGoogleAdsConversionPayload(
        'AW-17979105489',
        '1E9OCP6wkZAcENHBjf1C',
        'appointment-123'
      ),
      {
        send_to: 'AW-17979105489/1E9OCP6wkZAcENHBjf1C',
        value: 1.0,
        currency: 'EUR',
        transaction_id: 'appointment-123'
      }
    )
  })

  it('keeps send_to on the AW destination when the current field contains the known GT tag', () => {
    assert.deepStrictEqual(
      toGoogleAdsConversionPayload('GT-NFDCLRLC', '1E9OCP6wkZAcENHBjf1C'),
      {
        send_to: 'AW-17979105489/1E9OCP6wkZAcENHBjf1C',
        value: 1.0,
        currency: 'EUR'
      }
    )
  })
})

describe('Google Ads conversion firing', () => {
  it('fires the official gtag event with a fallback callback envelope', () => {
    const commands: unknown[][] = []
    const scheduled: Array<() => void> = []
    const image = { src: '' }

    const fired = fireGoogleAdsConversion({
      gtag: (...args: unknown[]) => {
        commands.push(args)
      },
      googleAdsId: 'AW-17979105489',
      conversionLabel: '1E9OCP6wkZAcENHBjf1C',
      consent: 'all',
      transactionId: 'appointment-123',
      createImage: () => image,
      scheduleFallback: (callback) => {
        scheduled.push(callback)
      },
      now: () => 12345
    })

    assert.equal(fired, true)
    assert.equal(commands.length, 1)
    assert.deepStrictEqual(commands[0][0], 'event')
    assert.deepStrictEqual(commands[0][1], 'conversion')
    assert.deepStrictEqual(commands[0][2], {
      send_to: 'AW-17979105489/1E9OCP6wkZAcENHBjf1C',
      value: 1.0,
      currency: 'EUR',
      transaction_id: 'appointment-123',
      event_callback: (commands[0][2] as { event_callback: () => void }).event_callback,
      event_timeout: 2000
    })

    assert.equal(scheduled.length, 1)
    scheduled[0]()
    assert.equal(
      image.src,
      'https://googleads.g.doubleclick.net/pagead/conversion/17979105489/?label=1E9OCP6wkZAcENHBjf1C&value=1.0&currency_code=EUR&guid=ON&script=0&random=12345'
    )
  })

  it('does not fire the fallback pixel when advertising consent is denied', () => {
    const commands: unknown[][] = []
    const scheduled: Array<() => void> = []
    const image = { src: '' }

    const fired = fireGoogleAdsConversion({
      gtag: (...args: unknown[]) => {
        commands.push(args)
      },
      googleAdsId: 'AW-17979105489',
      conversionLabel: '1E9OCP6wkZAcENHBjf1C',
      consent: 'essential',
      createImage: () => image,
      scheduleFallback: (callback) => {
        scheduled.push(callback)
      },
      now: () => 12345
    })

    assert.equal(fired, true)
    assert.equal(commands.length, 1)
    assert.equal(scheduled.length, 0)
    assert.equal(image.src, '')
  })

  it('fires the direct pixel when gtag is unavailable but consent is granted', () => {
    const image = { src: '' }

    const fired = fireGoogleAdsConversion({
      gtag: null,
      googleAdsId: 'AW-17979105489',
      conversionLabel: '1E9OCP6wkZAcENHBjf1C',
      consent: 'all',
      createImage: () => image,
      now: () => 12345
    })

    assert.equal(fired, true)
    assert.equal(
      image.src,
      'https://googleads.g.doubleclick.net/pagead/conversion/17979105489/?label=1E9OCP6wkZAcENHBjf1C&value=1.0&currency_code=EUR&guid=ON&script=0&random=12345'
    )
  })

  it('does not fire the direct pixel without a known conversion destination or label', () => {
    const image = { src: '' }

    assert.equal(
      fireGoogleAdsConversionPixel({
        googleAdsId: 'GT-UNKNOWN1',
        conversionLabel: '1E9OCP6wkZAcENHBjf1C',
        createImage: () => image,
        now: () => 12345
      }),
      false
    )
    assert.equal(image.src, '')
  })
})
