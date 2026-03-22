import * as assert from 'node:assert/strict'
import test, { describe } from 'node:test'

import type { Ref } from 'vue'
import {
  buildCoachUrls,
  buildBookingBreadcrumbItems,
  buildPersonAddress,
  buildCredentialSchemaItems,
  mapProfileToSchemaRefs
} from '../../app/features/seo/schema-helpers'
import type { PublicProviderProfile } from '../../app/features/seo/api/public-provider-profile.contract'

// --- buildCoachUrls ---

describe('buildCoachUrls', () => {
  const origin = 'https://keova.fr'
  const slug = 'sophie-jouan'

  test('platform: returns /coach/{slug} URLs', () => {
    const result = buildCoachUrls(origin, slug, true)
    assert.equal(result.coachUrl, 'https://keova.fr/coach/sophie-jouan')
    assert.equal(result.bookingUrl, 'https://keova.fr/coach/sophie-jouan/onboarding/discovery')
  })

  test('white-label: returns root URLs', () => {
    const result = buildCoachUrls(origin, slug, false)
    assert.equal(result.coachUrl, 'https://keova.fr/')
    assert.equal(result.bookingUrl, 'https://keova.fr/onboarding/discovery')
  })
})

// --- buildBookingBreadcrumbItems ---

describe('buildBookingBreadcrumbItems', () => {
  const origin = 'https://keova.fr'
  const slug = 'sophie-jouan'
  const displayName = () => 'Sophie Jouan'

  test('platform: 3-level breadcrumb (Accueil > displayName > Appel découverte)', () => {
    const items = buildBookingBreadcrumbItems(origin, slug, displayName, true)
    assert.equal(items.length, 3)
    assert.deepStrictEqual(items[0], { name: 'Accueil', item: 'https://keova.fr/' })
    assert.equal(items[1].name, displayName)
    assert.equal(items[1].item, 'https://keova.fr/coach/sophie-jouan')
    assert.deepStrictEqual(items[2], {
      name: 'Appel découverte',
      item: 'https://keova.fr/coach/sophie-jouan/onboarding/discovery'
    })
  })

  test('white-label: 2-level breadcrumb (Accueil > Appel découverte)', () => {
    const items = buildBookingBreadcrumbItems(origin, slug, displayName, false)
    assert.equal(items.length, 2)
    assert.deepStrictEqual(items[0], { name: 'Accueil', item: 'https://keova.fr/' })
    assert.deepStrictEqual(items[1], {
      name: 'Appel découverte',
      item: 'https://keova.fr/onboarding/discovery'
    })
  })
})

// --- mapProfileToSchemaRefs ---

describe('mapProfileToSchemaRefs', () => {
  // Minimal ref implementation for testing (no Vue runtime needed)
  function createRef<T>(initial: T): Ref<T> {
    return { value: initial } as Ref<T>
  }

  function createRefs() {
    return {
      name: createRef('Coach'),
      bio: createRef<string | undefined>(undefined),
      imageUrl: createRef<string | undefined>(undefined),
      specialties: createRef<string[]>([]),
      credentials: createRef<Array<{ title: string, institution?: string, year?: number }>>([]),
      sameAs: createRef<string[]>([]),
      city: createRef<string | undefined>(undefined)
    }
  }

  const fullProfile: PublicProviderProfile = {
    slug: 'sophie-jouan',
    firstName: 'Sophie',
    lastName: 'Jouan',
    displayName: 'Sophie Jouan',
    bio: 'Coach certifiée en nutrition',
    specialties: ['Nutrition', 'Bien-être'],
    timezone: 'Europe/Paris',
    imageUrl: 'https://cdn.example.com/photo.jpg',
    discoveryDurationMinutes: 15,
    discoveryBufferAfterMinutes: 15,
    isActive: true,
    longBio: null,
    credentials: [],
    city: null,
    region: null,
    socialLinks: {},
    publicPhone: null,
    urgencyText: null,
    heroHeadline: null,
    testimonialsJson: [],
    secondaryPhotoUrl: null
  }

  test('maps all profile fields to refs', () => {
    const refs = createRefs()
    mapProfileToSchemaRefs(fullProfile, refs)

    assert.equal(refs.name.value, 'Sophie Jouan')
    assert.equal(refs.bio.value, 'Coach certifiée en nutrition')
    assert.equal(refs.imageUrl.value, 'https://cdn.example.com/photo.jpg')
    assert.deepStrictEqual(refs.specialties.value, ['Nutrition', 'Bien-être'])
  })

  test('null profile: keeps default ref values (fetch failed gracefully)', () => {
    const refs = createRefs()
    mapProfileToSchemaRefs(null, refs)

    assert.equal(refs.name.value, 'Coach')
    assert.equal(refs.bio.value, undefined)
    assert.equal(refs.imageUrl.value, undefined)
    assert.deepStrictEqual(refs.specialties.value, [])
    assert.deepStrictEqual(refs.credentials.value, [])
    assert.deepStrictEqual(refs.sameAs.value, [])
    assert.equal(refs.city.value, undefined)
  })

  test('empty displayName: falls back to "Coach"', () => {
    const refs = createRefs()
    mapProfileToSchemaRefs({ ...fullProfile, displayName: '' }, refs)

    assert.equal(refs.name.value, 'Coach')
  })

  test('null bio: ref stays undefined', () => {
    const refs = createRefs()
    mapProfileToSchemaRefs({ ...fullProfile, bio: null }, refs)

    assert.equal(refs.bio.value, undefined)
  })

  test('null imageUrl: ref stays undefined', () => {
    const refs = createRefs()
    mapProfileToSchemaRefs({ ...fullProfile, imageUrl: null }, refs)

    assert.equal(refs.imageUrl.value, undefined)
  })

  test('empty specialties: ref stays empty array', () => {
    const refs = createRefs()
    mapProfileToSchemaRefs({ ...fullProfile, specialties: [] }, refs)

    assert.deepStrictEqual(refs.specialties.value, [])
  })

  // --- E-E-A-T fields (Story U1.1) ---

  test('maps credentials to refs', () => {
    const refs = createRefs()
    mapProfileToSchemaRefs({
      ...fullProfile,
      credentials: [
        { title: 'DU Naturopathie', institution: 'ISUPNAT', year: 2020 }
      ]
    }, refs)

    assert.deepStrictEqual(refs.credentials.value, [
      { title: 'DU Naturopathie', institution: 'ISUPNAT', year: 2020 }
    ])
  })

  test('maps social links to sameAs array', () => {
    const refs = createRefs()
    mapProfileToSchemaRefs({
      ...fullProfile,
      socialLinks: {
        linkedin: 'https://linkedin.com/in/sophie',
        instagram: 'https://instagram.com/sophie'
      }
    }, refs)

    assert.deepStrictEqual(refs.sameAs.value, [
      'https://linkedin.com/in/sophie',
      'https://instagram.com/sophie'
    ])
  })

  test('maps city to ref', () => {
    const refs = createRefs()
    mapProfileToSchemaRefs({ ...fullProfile, city: 'Paris' }, refs)

    assert.equal(refs.city.value, 'Paris')
  })

  test('null city: ref stays undefined', () => {
    const refs = createRefs()
    mapProfileToSchemaRefs({ ...fullProfile, city: null }, refs)

    assert.equal(refs.city.value, undefined)
  })

  test('empty credentials: ref stays empty', () => {
    const refs = createRefs()
    mapProfileToSchemaRefs({ ...fullProfile, credentials: [] }, refs)

    assert.deepStrictEqual(refs.credentials.value, [])
  })

  test('empty social links: sameAs stays empty', () => {
    const refs = createRefs()
    mapProfileToSchemaRefs({ ...fullProfile, socialLinks: {} }, refs)

    assert.deepStrictEqual(refs.sameAs.value, [])
  })
})

// --- buildPersonAddress (Story U1.1 — CR3) ---

describe('buildPersonAddress', () => {
  test('returns PostalAddress with addressLocality when city provided', () => {
    const result = buildPersonAddress('Paris')
    assert.deepStrictEqual(result, {
      '@type': 'PostalAddress',
      'addressLocality': 'Paris'
    })
  })

  test('returns undefined when city is undefined', () => {
    assert.equal(buildPersonAddress(undefined), undefined)
  })

  test('returns undefined when city is empty string', () => {
    assert.equal(buildPersonAddress(''), undefined)
  })
})

// --- buildCredentialSchemaItems (Story U1.1 — CR3) ---

describe('buildCredentialSchemaItems', () => {
  test('returns EducationalOccupationalCredential items', () => {
    const result = buildCredentialSchemaItems([
      { title: 'DU Naturopathie', institution: 'ISUPNAT', year: 2020 }
    ])
    assert.deepStrictEqual(result, [{
      '@type': 'EducationalOccupationalCredential',
      'credentialCategory': 'DU Naturopathie',
      'recognizedBy': { '@type': 'Organization', 'name': 'ISUPNAT' },
      'dateCreated': '2020'
    }])
  })

  test('omits institution when not provided', () => {
    const result = buildCredentialSchemaItems([{ title: 'Formation coaching' }])
    assert.ok(result)
    assert.equal(result![0].credentialCategory, 'Formation coaching')
    assert.equal(result![0].recognizedBy, undefined)
  })

  test('omits year when not provided', () => {
    const result = buildCredentialSchemaItems([{ title: 'Certification' }])
    assert.ok(result)
    assert.equal(result![0].dateCreated, undefined)
  })

  test('returns undefined for empty credentials', () => {
    assert.equal(buildCredentialSchemaItems([]), undefined)
  })

  test('handles multiple credentials', () => {
    const result = buildCredentialSchemaItems([
      { title: 'DU A' },
      { title: 'DU B', institution: 'Univ', year: 2021 }
    ])
    assert.ok(result)
    assert.equal(result!.length, 2)
    assert.equal(result![0].credentialCategory, 'DU A')
    assert.equal(result![1].credentialCategory, 'DU B')
  })
})
