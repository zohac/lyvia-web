import * as assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  buildProviderListItem,
  buildProfessionalService
} from '../../app/features/seo/b2c-landing-schema-helpers'
import type { FeaturedProvider } from '../../app/features/seo/api/featured-provider.contract'

const origin = 'https://keova.fr'

const baseProvider: FeaturedProvider = {
  slug: 'sophie-jouan',
  displayName: 'Sophie Jouan',
  firstName: 'Sophie',
  lastName: 'Jouan',
  bio: 'Naturopathe spécialisée ménopause',
  specialties: ['Naturopathie', 'Nutrition'],
  city: 'Strasbourg',
  profilePhotoUrl: 'https://cdn.example.com/photo.jpg',
  profilePhotoAlt: 'Sophie Jouan',
  customDomain: null,
  discoveryDurationMinutes: 15
}

// --- buildProfessionalService ---

describe('buildProfessionalService', () => {
  it('returns ProfessionalService with correct @id and origin', () => {
    const result = buildProfessionalService(origin)
    assert.equal(result['@type'], 'ProfessionalService')
    assert.equal(result['@id'], 'https://keova.fr/#service')
    assert.equal(result.url, origin)
    assert.equal(result.areaServed.name, 'France')
    assert.equal(result.provider['@id'], 'https://keova.fr/#organization')
  })

  it('includes service description mentioning périménopause and ménopause', () => {
    const result = buildProfessionalService(origin)
    assert.ok(result.description.includes('périménopause'))
    assert.ok(result.description.includes('ménopause'))
  })
})

// --- buildProviderListItem ---

describe('buildProviderListItem', () => {
  it('returns ListItem with correct position (1-based)', () => {
    const result = buildProviderListItem(baseProvider, 0, origin)
    assert.equal(result['@type'], 'ListItem')
    assert.equal(result.position, 1)
  })

  it('maps person name and jobTitle', () => {
    const result = buildProviderListItem(baseProvider, 0, origin)
    assert.equal(result.item.name, 'Sophie Jouan')
    assert.equal(result.item.jobTitle, 'Spécialiste ménopause')
  })

  it('includes image when profilePhotoUrl is present', () => {
    const result = buildProviderListItem(baseProvider, 0, origin)
    assert.equal(result.item.image, 'https://cdn.example.com/photo.jpg')
  })

  it('excludes image when profilePhotoUrl is null', () => {
    const noPhoto = { ...baseProvider, profilePhotoUrl: null }
    const result = buildProviderListItem(noPhoto, 0, origin)
    assert.equal('image' in result.item, false)
  })

  it('includes city as PostalAddress when present', () => {
    const result = buildProviderListItem(baseProvider, 0, origin)
    assert.deepStrictEqual(result.item.address, {
      '@type': 'PostalAddress',
      'addressLocality': 'Strasbourg'
    })
  })

  it('excludes address when city is null', () => {
    const noCity = { ...baseProvider, city: null }
    const result = buildProviderListItem(noCity, 0, origin)
    assert.equal('address' in result.item, false)
  })

  it('includes knowsAbout from specialties', () => {
    const result = buildProviderListItem(baseProvider, 0, origin)
    assert.deepStrictEqual(result.item.knowsAbout, ['Naturopathie', 'Nutrition'])
  })

  it('excludes knowsAbout when specialties is empty', () => {
    const noSpec = { ...baseProvider, specialties: [] }
    const result = buildProviderListItem(noSpec, 0, origin)
    assert.equal('knowsAbout' in result.item, false)
  })

  it('uses /coach/{slug} URL when no customDomain', () => {
    const result = buildProviderListItem(baseProvider, 0, origin)
    assert.equal(result.item.url, 'https://keova.fr/coach/sophie-jouan')
  })

  it('uses https://{customDomain} URL when customDomain is set', () => {
    const withDomain = { ...baseProvider, customDomain: 'sophie-jouan.fr' }
    const result = buildProviderListItem(withDomain, 0, origin)
    assert.equal(result.item.url, 'https://sophie-jouan.fr')
  })

  it('position increments for each provider', () => {
    const r0 = buildProviderListItem(baseProvider, 0, origin)
    const r1 = buildProviderListItem(baseProvider, 1, origin)
    const r2 = buildProviderListItem(baseProvider, 2, origin)
    assert.equal(r0.position, 1)
    assert.equal(r1.position, 2)
    assert.equal(r2.position, 3)
  })
})
