import * as assert from 'node:assert/strict'
import test, { describe } from 'node:test'

import {
  applySectionsConfigSnapshot,
  snapshotSectionsConfig
} from '../../app/features/coach/section-config-rollback'

/**
 * Story 0-26 round Codex CR R1-F1 + R1-F4 — Tests comportementaux purs sur
 * le helper de rollback `sectionsConfig`. Couvre la régression "rollback
 * retourne à `{}` au lieu du dernier état serveur" mentionnée par la review.
 *
 * Si le code casse cette logique (ex: oubli du `delete` des clés actuelles,
 * remplacement par `Object.assign(target, snapshot)` seul → keys orphelines),
 * ces tests échouent.
 */

describe('snapshotSectionsConfig — capture du dernier état serveur', () => {
  test('clone l\'objet source (mutations ultérieures ne touchent pas le snapshot)', () => {
    const source: Record<string, boolean> = { bio: false, pillars: true }
    const snap = snapshotSectionsConfig(source)

    source.bio = true
    source.faq = false

    assert.deepStrictEqual(snap, { bio: false, pillars: true }, 'snapshot doit être un clone, pas un alias')
  })

  test('retourne un objet vide si la source est null', () => {
    assert.deepStrictEqual(snapshotSectionsConfig(null), {})
  })

  test('retourne un objet vide si la source est undefined', () => {
    assert.deepStrictEqual(snapshotSectionsConfig(undefined), {})
  })

  test('préserve les valeurs false (la sémantique "désactivé" ne doit pas être perdue)', () => {
    const source = { bio: false, pillars: false }
    const snap = snapshotSectionsConfig(source)
    assert.deepStrictEqual(snap, { bio: false, pillars: false })
  })
})

describe('applySectionsConfigSnapshot — rollback en place du store réactif', () => {
  test('remplace les clés actuelles par celles du snapshot (R1-F1 : retour au dernier état serveur)', () => {
    // Sophie a fait un toggle optimistic qui a échoué → on doit retourner à l'état serveur.
    const target: Record<string, boolean> = { bio: false, faq: true, pillars: false }
    const lastServerState: Record<string, boolean> = { bio: true }

    applySectionsConfigSnapshot(target, lastServerState)

    assert.deepStrictEqual(target, { bio: true }, 'target doit refléter exactement le snapshot')
  })

  test('mute en place (préserve la référence pour la réactivité Vue)', () => {
    const target: Record<string, boolean> = { bio: false }
    const targetRef = target

    applySectionsConfigSnapshot(target, { faq: true })

    assert.strictEqual(target, targetRef, 'target ne doit pas être remplacé par une nouvelle référence')
    assert.deepStrictEqual(target, { faq: true })
  })

  test('snapshot vide → target vidé (pas de fuite de keys orphelines)', () => {
    const target: Record<string, boolean> = { bio: false, pillars: true }
    applySectionsConfigSnapshot(target, {})
    assert.deepStrictEqual(target, {}, 'toutes les clés actuelles doivent être supprimées si le snapshot est vide')
  })

  test('snapshot avec keys disjointes → toutes les anciennes keys disparaissent', () => {
    // Anti-régression : si on faisait juste `Object.assign(target, snapshot)` sans
    // delete préalable, `bio: false` resterait dans target — c'est exactement le bug
    // que R1-F1 décrit ("rollback vers `{}` au lieu du dernier état serveur").
    const target: Record<string, boolean> = { bio: false }
    const snapshot = { faq: true, testimonials: false }

    applySectionsConfigSnapshot(target, snapshot)

    assert.deepStrictEqual(target, { faq: true, testimonials: false })
    assert.equal('bio' in target, false, 'la clé bio doit avoir été supprimée')
  })

  test('rollback successif après plusieurs toggles → toujours retourne au snapshot original', () => {
    const target: Record<string, boolean> = {}
    const lastServerState = { bio: true, pillars: false }

    // Sophie toggle bio → false (optimistic)
    target.bio = false
    // Puis pillars → true (optimistic)
    target.pillars = true
    // Sauvegarde échoue → rollback
    applySectionsConfigSnapshot(target, lastServerState)

    assert.deepStrictEqual(target, { bio: true, pillars: false })
  })
})
