import * as assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  buildConsentWithdrawalPatch,
  consentRedirectTarget,
  CONSENT_NOOP_NOTICE,
  CONSENT_SUBMIT_FIELDS,
  CONSENT_TOKEN_MAX_LENGTH,
  hasConsentWithdrawal,
  isPassiveConsentSubmission,
  isUsableConsentToken,
  parseConsentWithdrawals,
  readConsentPageState,
  readConsentToken,
  serializeConsentWithdrawals
} from '../../app/features/preferences/consent-page'
import { pickConsentSubmitFields } from '../../server/utils/preferences-submit'

/**
 * CC.2b — the pure rules of the tokenized withdrawal page.
 *
 * These are the decisions the JS path and the no-JS relay both depend on. A page
 * that renders fine and a relay that works can still disagree about what
 * `retrait=email` means, and nothing in the type system or the linter would say
 * so — so the rules are tested by running them.
 */

describe('parseConsentWithdrawals', () => {
  it('lit les deux canaux d\'une liste séparée par des virgules', () => {
    assert.deepEqual(parseConsentWithdrawals('email,sms'), ['email', 'sms'])
    assert.deepEqual(parseConsentWithdrawals('sms,email'), ['email', 'sms'])
  })

  it('lit la forme répétée d\'un groupe de cases à cocher', () => {
    // C'est ce que `form.getAll('retrait')` renvoie : un tableau.
    assert.deepEqual(parseConsentWithdrawals(['email']), ['email'])
    assert.deepEqual(parseConsentWithdrawals(['email', 'sms']), ['email', 'sms'])
  })

  it('lit un `FormData` de cases natives', () => {
    const form = new FormData()
    form.append('retrait', 'email')
    form.append('retrait', 'sms')

    assert.deepEqual(parseConsentWithdrawals(form), ['email', 'sms'])
  })

  it('ignore les canaux inconnus, les doublons et le bruit', () => {
    // L'entrée est contrôlable par n'importe qui (chaîne de requête) : une
    // valeur inconnue n'a aucun champ API correspondant, elle doit être ignorée.
    assert.deepEqual(parseConsentWithdrawals('email,phone,postal'), ['email'])
    assert.deepEqual(parseConsentWithdrawals('email,email,sms'), ['email', 'sms'])
    assert.deepEqual(parseConsentWithdrawals(' EMAIL , Sms '), ['email', 'sms'])
  })

  it('rend une liste vide pour une soumission passive', () => {
    assert.deepEqual(parseConsentWithdrawals(''), [])
    assert.deepEqual(parseConsentWithdrawals(null), [])
    assert.deepEqual(parseConsentWithdrawals(undefined), [])
    assert.deepEqual(parseConsentWithdrawals([]), [])
    assert.deepEqual(new Set(), new Set(parseConsentWithdrawals('inconnu')))
  })

  it('effectue un aller-retour à l\'identique via la sérialisation', () => {
    const channels = parseConsentWithdrawals(['sms', 'email'])
    assert.deepEqual(parseConsentWithdrawals(serializeConsentWithdrawals(channels)), channels)
  })
})

describe('buildConsentWithdrawalPatch', () => {
  it('n\'envoie qu\'un `false` explicite par canal coché', () => {
    assert.deepEqual(buildConsentWithdrawalPatch('tok', ['email']), {
      token: 'tok',
      emailMarketingOptIn: false
    })
    assert.deepEqual(buildConsentWithdrawalPatch('tok', ['sms']), {
      token: 'tok',
      smsMarketingOptIn: false
    })
    assert.deepEqual(buildConsentWithdrawalPatch('tok', ['email', 'sms']), {
      token: 'tok',
      emailMarketingOptIn: false,
      smsMarketingOptIn: false
    })
  })

  it('n\'envoie JAMAIS `true` — la page est un canal de retrait', () => {
    // Un `true` ferait de cette page un opt-in, exactement l'inverse du geste
    // que l'AC exige. Cette assertion tombe si quelqu'un « complète » le patch.
    const patch = buildConsentWithdrawalPatch('tok', ['email', 'sms'])
    assert.equal(patch.emailMarketingOptIn, false)
    assert.equal(patch.smsMarketingOptIn, false)
    assert.equal(Object.values(patch).includes(true), false)
  })

  it('laisse ABSENT le canal non coché, plutôt que d\'écrire une valeur', () => {
    // Il n\'y a pas de lecture : la valeur courante est inconnue, donc l\'absence
    // est le seul moyen de ne pas écraser un canal intact.
    const patch = buildConsentWithdrawalPatch('tok', ['email'])
    assert.equal('smsMarketingOptIn' in patch, false)
  })

  it('demande une écriture vide quand rien n\'est coché', () => {
    const patch = buildConsentWithdrawalPatch('tok', [])
    assert.deepEqual(patch, { token: 'tok' })
    assert.equal(Object.keys(patch).length, 1)
  })
})

describe('hasConsentWithdrawal', () => {
  it('distingue la soumission passive d\'un vrai retrait', () => {
    assert.equal(hasConsentWithdrawal([]), false)
    assert.equal(hasConsentWithdrawal(['email']), true)
  })
})

describe('isUsableConsentToken', () => {
  it('accepte un token non vide dans les bornes du DTO', () => {
    assert.equal(isUsableConsentToken('abc123'), true)
    assert.equal(isUsableConsentToken('a'.repeat(CONSENT_TOKEN_MAX_LENGTH)), true)
  })

  it('refuse un token vide ou hors bornes', () => {
    assert.equal(isUsableConsentToken(''), false)
    assert.equal(isUsableConsentToken('a'.repeat(CONSENT_TOKEN_MAX_LENGTH + 1)), false)
  })
})

describe('isPassiveConsentSubmission', () => {
  it('est passive sans case cochée, quel que soit le token', () => {
    assert.equal(isPassiveConsentSubmission({ token: 'tok', channels: [] }), true)
  })

  it('est passive quand le token ne peut pas être utilisé', () => {
    // Un lien tronqué (token vide) ou forgé (> 512) ne doit PAS produire
    // `error` : la réponse doit rester neutre pour toute forme de token.
    assert.equal(isPassiveConsentSubmission({ token: '', channels: ['email'] }), true)
    assert.equal(
      isPassiveConsentSubmission({ token: 'a'.repeat(513), channels: ['email'] }),
      true
    )
  })

  it('n\'est passive ni avec un canal coché ni avec un token utilisable', () => {
    assert.equal(isPassiveConsentSubmission({ token: 'tok', channels: ['email'] }), false)
  })
})

describe('readConsentPageState', () => {
  it('n\'accepte que les deux états neutres', () => {
    assert.equal(readConsentPageState('saved'), 'saved')
    assert.equal(readConsentPageState('error'), 'error')
  })

  it('ramène tout le reste à l\'état neutre initial', () => {
    // Une chaîne de requête est éditable à la main : `?state=expired` ne doit
    // pas pouvoir afficher une phrase qui évoque l\'état du lien.
    for (const hostile of ['expired', 'invalide', 'EXPIRED', '', 'saved ', null, undefined, 42, { a: 1 }]) {
      assert.equal(readConsentPageState(hostile), null, `${String(hostile)} ne doit rien afficher`)
    }
  })

  it('tolère un tableau de query (paramètre répété) et prend le premier', () => {
    assert.equal(readConsentPageState(['error', 'saved']), 'error')
    assert.equal(readConsentPageState([]), null)
  })
})

describe('readConsentToken', () => {
  it('lit le token de la query', () => {
    assert.equal(readConsentToken('abc123'), 'abc123')
    assert.equal(readConsentToken(' abc123 '), 'abc123')
  })

  it('rend une chaîne vide plutôt qu\'undefined pour une query absente', () => {
    assert.equal(readConsentToken(undefined), '')
    assert.equal(readConsentToken(null), '')
    assert.equal(readConsentToken(['abc']), 'abc')
  })
})

describe('consentRedirectTarget', () => {
  it('porte le token et l\'état de succès', () => {
    const target = consentRedirectTarget({ token: 'tok', state: 'saved', channels: ['email'] })
    assert.match(target, /^\/preferences\?/)
    assert.match(target, /token=tok/)
    assert.match(target, /state=saved/)
    // Rien à réessayer après un succès : la sélection est volontairement absente.
    assert.equal(/retrait=/.test(target), false)
  })

  it('porte les canaux cochés sur l\'erreur, pour les recocher', () => {
    const target = consentRedirectTarget({
      token: 'tok',
      state: 'error',
      channels: ['email', 'sms']
    })
    assert.match(target, /state=error/)
    assert.match(target, /retrait=email%2Csms/)
  })

  it('ne porte pas de sélection quand rien n\'a été coché', () => {
    const target = consentRedirectTarget({ token: 'tok', state: 'error', channels: [] })
    assert.equal(/retrait=/.test(target), false)
  })

  it('reste sur la page neutre pour une soumission passive', () => {
    const target = consentRedirectTarget({ token: 'tok', state: null, channels: [] })
    assert.equal(/state=/.test(target), false)
    assert.match(target, /token=tok/)
  })

  it('produit la même cible pour n\'importe quelle valeur de token', () => {
    // La cible ne mentionne ni la validité, ni une raison de refus : une
    // comparaison valide/invalide doit être indiscernable.
    const valid = consentRedirectTarget({ token: 'tok', state: 'saved', channels: ['email'] })
    const invalid = consentRedirectTarget({ token: 'nimporte', state: 'saved', channels: ['email'] })
    assert.equal(valid.replace(/token=[^&]+/, 'token=X'), invalid.replace(/token=[^&]+/, 'token=X'))
  })

  it('encode le token dans l\'URL', () => {
    const target = consentRedirectTarget({ token: 'a b&c', state: 'saved', channels: [] })
    assert.match(target, /token=a\+b%26c/)
  })
})

describe('la page ne rend aucun état dépendant du token', () => {
  it('n\'expose que deux états, tous deux neutres', () => {
    const outcomes = ['saved', 'error', null] as const
    const states = outcomes.map(state => consentRedirectTarget({ token: 'tok', state, channels: ['email'] }))

    // Aucun de ces chemins ne contient un mot qui évoquerait un lien périmé ou
    // une validité. C'est l'invariant central de la feature.
    for (const target of states) {
      assert.equal(/expir|invalid|introuv|échoué|expired/i.test(target), false)
    }
  })

  it('le texte neutre d\'une soumission passive ne mentionne pas le token', () => {
    assert.equal(/token|expir|invalid/i.test(CONSENT_NOOP_NOTICE), false)
    assert.match(CONSENT_NOOP_NOTICE, /rien ne change/i)
  })
})

describe('la liste blanche du formulaire', () => {
  it('ne declare que `token` et `retrait`', () => {
    assert.deepEqual([...CONSENT_SUBMIT_FIELDS], ['token', 'retrait'])
  })

  it('alimente les lectures du relais — la constante n\'est pas décorative', () => {
    // La version précédente comparait `CONSENT_SUBMIT_FIELDS` à son propre
    // littéral : rien ne garantissait que le relais lise ces noms. Les noms
    // postés ici sont des LITORAUX — ceux que la page rend et que le navigateur
    // envoie — et non la constante : une constante divergente ferait alors
    // échouer la lecture, ce qui est exactement ce qu'on veut détecter.
    const form = new FormData()
    form.append('token', 'tok')
    form.append('retrait', 'email')

    assert.deepEqual(pickConsentSubmitFields(form), {
      token: 'tok',
      channels: ['email']
    })
  })

  it('ne relaie que les deux noms déclarés par la liste blanche', () => {
    // Un nom hors liste blanche ne doit jamais produire d'effet : c'est ce qui
    // empêche un `FormData` forgé de transformer cette page de retrait en
    // opt-in. Le `retrait` posté ici est le littéral du formulaire.
    const form = new FormData()
    form.append('token', 'tok')
    form.append('retrait', 'email')
    form.append('emailMarketingOptIn', 'true')
    form.append('consentSource', 'settings')

    const picked = pickConsentSubmitFields(form)
    assert.deepEqual(Object.keys(picked).sort(), ['channels', 'token'])
  })
})
