/**
 * visuel-template.test.ts — Tests structurels et unitaires pour le template Visuel.
 */
import * as assert from 'node:assert/strict'
import * as fs from 'node:fs'
import * as path from 'node:path'
import test, { describe } from 'node:test'
import {
  SUPPORTED_COACH_TEMPLATE_CODES,
  isKnownTemplateCode,
  resolveCoachTemplateCode
} from '../../app/composables/coach-template-registry'
import {
  isTemplateLocked,
  STANDARD_COACH_TEMPLATE_CODES
} from '../../app/features/plans/domain/template-lock'

const appRoot = path.resolve(process.cwd(), 'app')

function readFile(relativePath: string): string {
  return fs.readFileSync(path.join(appRoot, relativePath), 'utf-8')
}

describe('Story 0-38 — Template Visuel (Essentiel tier)', () => {
  describe('Coach Template Registry', () => {
    test('declares visuel in supported codes and resolves correctly', () => {
      assert.ok(SUPPORTED_COACH_TEMPLATE_CODES.includes('visuel'))
      assert.equal(isKnownTemplateCode('visuel'), true)
      assert.equal(resolveCoachTemplateCode('visuel'), 'visuel')
    })
  })

  describe('Template Locking (Essentiel tier)', () => {
    test('visuel template is in STANDARD_COACH_TEMPLATE_CODES', () => {
      assert.ok(STANDARD_COACH_TEMPLATE_CODES.includes('visuel'))
    })

    test('isTemplateLocked returns false for visuel without premium feature', () => {
      assert.equal(isTemplateLocked({ code: 'visuel' }, false), false)
    })
  })

  describe('Vue Components existence & structure', () => {
    const components = [
      'components/templates/coach-pages/CoachPageVisuel.vue',
      'components/templates/coach-pages/visuel/CoachVisuelHeader.vue',
      'components/templates/coach-pages/visuel/CoachVisuelHero.vue',
      'components/templates/coach-pages/visuel/CoachVisuelProblem.vue',
      'components/templates/coach-pages/visuel/CoachVisuelBio.vue',
      'components/templates/coach-pages/visuel/CoachVisuelPillars.vue',
      'components/templates/coach-pages/visuel/CoachVisuelSteps.vue',
      'components/templates/coach-pages/visuel/CoachVisuelMidCta.vue'
    ]

    for (const comp of components) {
      test(`${comp} exists`, () => {
        const filePath = path.join(appRoot, comp)
        assert.ok(fs.existsSync(filePath), `${comp} must exist`)
      })
    }

    test('CoachPageVisuel uses contrast gradients and dynamic brand colors', () => {
      const content = readFile('components/templates/coach-pages/CoachPageVisuel.vue')
      assert.ok(content.includes('CoachVisuelHero'))
      assert.ok(content.includes('CoachVisuelProblem'))
      assert.ok(content.includes('CoachVisuelBio'))
      assert.ok(content.includes('CoachVisuelPillars'))
      assert.ok(content.includes('CoachVisuelSteps'))
      assert.ok(content.includes('CoachVisuelMidCta'))
    })

    test('Default fallback assets exist and are referenced in Visuel components', () => {
      const publicDir = path.resolve(process.cwd(), 'public/images/templates/visuel')
      assert.ok(fs.existsSync(path.join(publicDir, 'hero-default.webp')), 'hero-default.webp must exist')
      assert.ok(fs.existsSync(path.join(publicDir, 'band-default.webp')), 'band-default.webp must exist')
      assert.ok(fs.existsSync(path.join(publicDir, 'bio-default.webp')), 'bio-default.webp must exist')

      const heroContent = readFile('components/templates/coach-pages/visuel/CoachVisuelHero.vue')
      assert.ok(heroContent.includes('hero-default.webp'), 'Hero should reference hero-default.webp')

      const midCtaContent = readFile('components/templates/coach-pages/visuel/CoachVisuelMidCta.vue')
      assert.ok(midCtaContent.includes('band-default.webp'), 'MidCTA should reference band-default.webp')

      const bioContent = readFile('components/templates/coach-pages/visuel/CoachVisuelBio.vue')
      assert.ok(bioContent.includes('bio-default.webp'), 'Bio should reference bio-default.webp')
    })

    test('CoachVisuel image components have width, height, proper loading and @error fallbacks (AC-3)', () => {
      const hero = readFile('components/templates/coach-pages/visuel/CoachVisuelHero.vue')
      assert.ok(hero.includes('fetchpriority="high"'), 'Hero must have fetchpriority="high"')
      assert.ok(hero.includes('loading="eager"'), 'Hero must have loading="eager"')
      assert.ok(hero.includes('width="1920"') && hero.includes('height="1080"'), 'Hero must have width and height dimensions')
      assert.ok(hero.includes('@error="($event.target as HTMLImageElement).src = \'/images/templates/visuel/hero-default.webp\'"'), 'Hero must have @error fallback')

      const bio = readFile('components/templates/coach-pages/visuel/CoachVisuelBio.vue')
      assert.ok(bio.includes('loading="lazy"'), 'Bio image must have loading="lazy"')
      assert.ok(bio.includes('width="480"') && bio.includes('height="560"'), 'Bio image must have width and height dimensions')
      assert.ok(bio.includes('@error="($event.target as HTMLImageElement).src = \'/images/templates/visuel/bio-default.webp\'"'), 'Bio image must have @error fallback')

      const midCta = readFile('components/templates/coach-pages/visuel/CoachVisuelMidCta.vue')
      assert.ok(midCta.includes('loading="lazy"'), 'MidCta image must have loading="lazy"')
      assert.ok(midCta.includes('width="1200"') && midCta.includes('height="480"'), 'MidCta image must have width and height dimensions')
      assert.ok(midCta.includes('@error="($event.target as HTMLImageElement).src = \'/images/templates/visuel/band-default.webp\'"'), 'MidCta image must have @error fallback')
    })
  })
})
