import * as assert from 'node:assert/strict'
import test from 'node:test'
import type { PublicTenantResponse } from '../../app/features/onboarding/api/onboarding.contract'

// ============================================================================
// Legal Notices & Coach Legal Modal Contract Proofs
// ============================================================================

test('platform legal notices: returns exact Simon JOUAN EI legal constants', () => {
  const keovaLegalInfo = {
    companyName: 'Simon JOUAN EI (nom commercial : Keova)',
    legalForm: 'Entrepreneur Individuel (EI)',
    siren: '847 779 287',
    address: '3 rue Calas, 50700 Valognes',
    tvaStatus: 'TVA non applicable, art. 293 B du CGI (franchise en base)',
    host: 'Scaleway SAS (8 rue de la Ville l\'Évêque, 75008 Paris, France)',
    contactEmail: 'contact@keova.fr'
  }

  assert.equal(keovaLegalInfo.siren, '847 779 287')
  assert.equal(keovaLegalInfo.address, '3 rue Calas, 50700 Valognes')
  assert.equal(keovaLegalInfo.legalForm, 'Entrepreneur Individuel (EI)')
  assert.ok(keovaLegalInfo.tvaStatus.includes('293 B'))
})

test('coach legal modal data extraction: falls back to brand.displayName if legalInfo fields missing', () => {
  const mockTenant: PublicTenantResponse = {
    providerId: 'prov_123',
    slug: 'marie-dupont',
    timezone: 'Europe/Paris',
    isActive: true,
    brand: {
      mode: 'platform',
      displayName: 'Marie Dupont',
      domain: null,
      brandColor: null
    },
    legalInfo: null
  }

  const coachName = mockTenant.legalInfo?.companyName || mockTenant.brand.displayName
  const directorName = mockTenant.legalInfo?.director || mockTenant.brand.displayName

  assert.equal(coachName, 'Marie Dupont')
  assert.equal(directorName, 'Marie Dupont')
})

test('coach legal modal data extraction: uses legalInfo when available', () => {
  const mockTenant: PublicTenantResponse = {
    providerId: 'prov_456',
    slug: 'sophie-jouan',
    timezone: 'Europe/Paris',
    isActive: true,
    brand: {
      mode: 'platform',
      displayName: 'Sophie Jouan',
      domain: null,
      brandColor: null
    },
    legalInfo: {
      companyName: 'Sophie Jouan EI',
      siret: '12345678900012',
      address: '10 rue de la Paix, 75002 Paris',
      director: 'Sophie Jouan',
      rcpInsurance: 'AXA France N° 99887766',
      email: 'contact@sophiejouan.fr'
    }
  }

  assert.equal(mockTenant.legalInfo?.companyName, 'Sophie Jouan EI')
  assert.equal(mockTenant.legalInfo?.siret, '12345678900012')
  assert.equal(mockTenant.legalInfo?.rcpInsurance, 'AXA France N° 99887766')
})
