import * as assert from 'node:assert/strict'
import * as fs from 'node:fs'
import * as path from 'node:path'
import * as Vue from 'vue'
import test, { describe } from 'node:test'

import { renderSfc } from '../helpers/render-sfc'
import { UInput, UButton, UIcon } from '../helpers/sfc-vnode-harness'

const appRoot = path.resolve(process.cwd(), 'app')
const BRANDING_CARD_REL = 'components/organisms/CoachPageBrandingCard.vue'
const PALETTE_EDITOR_REL = 'components/organisms/CoachPagePaletteEditor.vue'
const BRANDING_CARD = 'app/components/organisms/CoachPageBrandingCard.vue'
const PALETTE_EDITOR = 'app/components/organisms/CoachPagePaletteEditor.vue'

function readBrandingCard(): string {
  return fs.readFileSync(path.join(appRoot, BRANDING_CARD_REL), 'utf-8')
}

function readPaletteEditor(): string {
  return fs.readFileSync(path.join(appRoot, PALETTE_EDITOR_REL), 'utf-8')
}

describe('CPD.6 — CoachPageBrandingCard : frontière et markup', () => {
  test('AC-1 : le titre et le champ nom de marque + compteur sont dans la carte', () => {
    const source = readBrandingCard()
    assert.match(source, /Nom de marque/)
    assert.match(source, /brandNameCharCount/)
    assert.match(source, /BRAND_NAME_MAX_LENGTH/)
  })

  test('AC-2 : les trois états du logo sont présents', () => {
    const source = readBrandingCard()
    // sans logo
    assert.match(source, /Téléverser un logo/)
    // fichier sélectionné
    assert.match(source, /brand-logo-local-preview/)
    assert.match(source, /Annuler/)
    // logo téléversé
    assert.match(source, /brand-logo-current-preview/)
    assert.match(source, />\s*Remplacer\s*</)
    assert.match(source, />\s*Supprimer\s*</)
  })

  test('AC-2 : un fichier refusé affiche l\'erreur de validateBrandLogoFile', () => {
    const source = readBrandingCard()
    assert.match(source, /validateBrandLogoFile/)
    assert.match(source, /brand-logo-error/)
  })

  test('AC-3 : les émissions sont explicites', () => {
    const source = readBrandingCard()
    assert.match(source, /emit\('update:brand-name'/)
    assert.match(source, /emit\('save'\)/)
    assert.match(source, /emit\('logo-uploaded'/)
    assert.match(source, /emit\('logo-removed'\)/)
    assert.match(source, /uploadAsset\(\s*'brand_logo'\s*,/)
    // la carte n'appelle jamais updateAccount (aucun appel, même en commentaire)
    assert.ok(!/updateAccount\s*\(/.test(source), 'la carte ne doit jamais appeler updateAccount')
  })

  test('AC-1 : le logoPreviewSrc donne la priorité à l\'aperçu local', () => {
    const source = readBrandingCard()
    assert.match(source, /logoLocalPreview\.value \?\? props\.logoServerUrl/)
  })
})

describe('CPD.6 — CoachPagePaletteEditor : seuils de contraste', () => {
  test('AC-4 : les seuils 3.0 et 2.5 sont présents et distincts', () => {
    const source = readPaletteEditor()
    assert.match(source, /ratio < 3\.0/)
    assert.match(source, /ratio < 2\.5/)
  })

  test('AC-4 : les émissions sont explicites', () => {
    const source = readPaletteEditor()
    assert.match(source, /emit\('update:brand-color'/)
    assert.match(source, /emit\('update:brand-accent-color'/)
    assert.match(source, /emit\('save'\)/)
  })

  test('AC-4 : brandColor #F5F5F5 rend l\'avertissement, #5B4B6E non', async () => {
    const lowHtml = await renderSfc(PALETTE_EDITOR, {
      props: { brandColor: '#F5F5F5', brandAccentColor: '#D4956A' },
      globals: { ...Vue },
      stubs: { UInput, UButton, UIcon }
    })
    assert.ok(lowHtml.includes('Attention : cette couleur est très claire sur fond blanc'), 'avertissement attendu pour #F5F5F5')

    const okHtml = await renderSfc(PALETTE_EDITOR, {
      props: { brandColor: '#5B4B6E', brandAccentColor: '#D4956A' },
      globals: { ...Vue },
      stubs: { UInput, UButton, UIcon }
    })
    assert.ok(!okHtml.includes('Attention : cette couleur est très claire sur fond blanc'), 'aucun avertissement pour #5B4B6E')
  })
})