/**
 * Story 0-35 — Landing waitlist keova.app : vidéo démo + section pricing.
 *
 * Le projet n'embarque pas de framework de mount DOM : les composants Vue sont
 * testés par (1) l'exécution de leurs helpers/données purs et (2) la lecture de
 * la source `.vue` pour vérifier que le câblage correspond aux ACs verbatim.
 *
 * Ces tests échouent si :
 *  - les 2 plans pricing divergent des montants/copy de la spec §2.2,
 *  - le plan Fondatrice ou un plan Découverte/commission réapparaît (AC-4),
 *  - la facade injecte l'iframe au premier rendu (AC-2),
 *  - la section vidéo n'est plus après le hero / avant le Bloc Douleur (AC-1),
 *  - la section pricing n'est plus avant la FAQ (AC-3),
 *  - le copy live « gratuit » (P.S. + FAQ) n'est pas corrigé (AC-10),
 *  - le schema porte encore un Offer 0 € / « gratuite », perd son Offer requis,
 *    ou émet le VideoObject hors du contexte B2B (AC-9),
 *  - la FAQ et les cartes affichent des montants divergents.
 *
 * Révision code review 2026-07-22 : les assertions d'ordre ciblent désormais les
 * composants et non des commentaires HTML, les gardes regex du schema ne sont plus
 * contournables par un simple changement de quotes, et le copy est asserté avec
 * l'apostrophe droite U+0027 de la spec (la suite protégeait auparavant la dérive).
 */
import * as assert from 'node:assert/strict'
import * as fs from 'node:fs'
import * as path from 'node:path'
import test, { describe } from 'node:test'

import {
  PRICING_PLANS,
  PRICING_HEADING,
  PRICING_CHAPO,
  PRICING_REASSURANCE,
  PRICING_MICROCOPY
} from '../../app/features/marketing/pricing-plans'
import {
  KEOVA_DEMO_VIDEO_ID,
  buildYoutubeEmbedUrl
} from '../../app/features/marketing/youtube-embed'

const appRoot = path.resolve(process.cwd(), 'app')

function read(relPath: string): string {
  return fs.readFileSync(path.join(appRoot, relPath), 'utf-8')
}

const FACADE_PATH = 'components/molecules/YoutubeFacade.vue'
const PRICING_PATH = 'components/organisms/LandingPricing.vue'
const LANDING_PATH = 'components/templates/MarketingLandingB2B.vue'
const SCHEMA_PATH = 'features/seo/useGlobalSchemaOrg.ts'
const PLANS_PATH = 'features/marketing/pricing-plans.ts'

/** Apostrophe typographique U+2019 — proscrite : la spec §2 utilise U+0027. */
const TYPOGRAPHIC_APOSTROPHE = '’'

// ------------------------------------------------------------------ Pricing data (AC-3, AC-4, AC-10)

describe('0-35 — Pricing plans data (AC-3, AC-4, spec §2.2)', () => {
  test('exactement 2 plans : Essentiel puis Premium', () => {
    assert.equal(PRICING_PLANS.length, 2)
    assert.deepEqual(PRICING_PLANS.map(p => p.id), ['essentiel', 'premium'])
    assert.deepEqual(PRICING_PLANS.map(p => p.name), ['Essentiel', 'Premium'])
  })

  test('Essentiel : 29 € TTC / mois, sans palier, non mis en avant', () => {
    const essentiel = PRICING_PLANS[0]!
    assert.equal(essentiel.priceLabel, '29 € TTC / mois')
    assert.equal(essentiel.priceSuffix, undefined)
    assert.equal(essentiel.audience, 'Pour lancer votre pratique.')
    assert.equal(essentiel.featured, false)
    assert.equal(essentiel.ctaLabel, 'Je réserve ma place')
    // « 0 % de commission » est expliqué une seule fois, en nommant l'alternative
    // (les annuaires) plutôt qu'en répétant un taux nu — décision Simon 2026-07-22.
    assert.match(essentiel.keyLine, /ne prélève aucun pourcentage sur vos séances/)
    assert.match(essentiel.keyLine, /annuaires/)
    assert.deepEqual(essentiel.bullets, [
      'Site, agenda et paiements réunis',
      'Réservation en ligne',
      'Aucun frais d\'installation'
    ])
  })

  test('Premium : 49 € TTC 1ʳᵉ année, suffixe cadré « verrouillé », badge Tarif fondateur', () => {
    const premium = PRICING_PLANS[1]!
    assert.equal(premium.priceLabel, '49 € TTC / mois la 1ʳᵉ année')
    assert.equal(premium.audience, 'Pour développer votre clientèle.')
    assert.equal(premium.featured, true)
    assert.equal(premium.badge, 'Tarif fondateur')
    assert.equal(premium.ctaLabel, 'Je réserve ma place')
    assert.match(premium.keyLine, /sans logo Keova/)
    // Spec §2.2 : cadrer « verrouillé pour les inscrites beta », pas « ça va augmenter ».
    // Un « puis 99 € / mois » nu se lit comme une menace, pas comme une affaire.
    assert.match(premium.priceSuffix!, /99 €/, 'l\'ancrage 99 € reste visible')
    assert.match(premium.priceSuffix!, /reste à 49 €/, 'le tarif de la 1ʳᵉ année est cadré comme verrouillé')
  })

  test('AC-4 : aucun plan Fondatrice, Découverte, ni mention de commission perçue', () => {
    const blob = JSON.stringify(PRICING_PLANS).toLowerCase()
    assert.ok(!blob.includes('fondatrice'), 'Le plan Fondatrice ne doit jamais apparaître')
    assert.ok(!blob.includes('découverte'), 'Aucun plan Découverte ne doit apparaître')
    // Tout taux de commission non nul est interdit — l'ancienne garde `1[0-9]`
    // laissait passer « 5 % » et « 20 % » alors que le test s'annonce exhaustif.
    assert.ok(
      !/\b(?!0\b)\d+\s*%\s*de commission/.test(blob),
      'aucun taux de commission non nul ne doit apparaître'
    )
  })

  test('constantes copy verbatim — chapô asserté en entier, pas seulement sa 1ʳᵉ phrase', () => {
    assert.equal(PRICING_HEADING, 'Nos tarifs, sans surprise')
    assert.equal(
      PRICING_CHAPO,
      'Un abonnement, 0 % de commission, sans engagement. Essentiel est à 29 € / mois, sans palier. Le tarif fondateur — Premium à 49 € au lieu de 99 € — est réservé aux inscrites d\'aujourd\'hui, sur toute leur première année.'
    )
    assert.equal(PRICING_REASSURANCE, '0 % de commission · Sans engagement · Sans frais d\'installation')
    assert.equal(
      PRICING_MICROCOPY,
      'Rien à payer ici : vous rejoignez la liste en 30 secondes, et vous choisissez votre formule avec nous avant l\'ouverture de votre compte.'
    )
  })

  test('le chapô scope le tarif fondateur au Premium (pas de promesse floue aux 2 cartes)', () => {
    // Une lectrice Essentiel ne doit pas croire qu'elle verrouille une remise inexistante,
    // ni craindre que 29 € augmente vers un montant non borné.
    assert.match(PRICING_CHAPO, /Essentiel est à 29 € \/ mois, sans palier/)
    assert.match(PRICING_CHAPO, /Premium à 49 € au lieu de 99 €/)
  })

  test('la micro-copy n\'évoque plus « sans carte bancaire » sous une grille payante', () => {
    // La beta est facturée dès l'accès : « sans carte bancaire » (marqueur conventionnel
    // de l'essai gratuit en SaaS FR) se lisait « je peux essayer sans payer ».
    assert.ok(
      !/carte bancaire/i.test(PRICING_MICROCOPY),
      'la micro-copy pricing ne doit pas suggérer un essai gratuit'
    )
  })

  test('aucune apostrophe typographique U+2019 dans le module de copy (spec §2 = U+0027)', () => {
    // Garde-fou : la même phrase apparaît dans pricing-plans.ts ET dans la FAQ de la
    // landing. Une divergence d'apostrophe la rend visiblement incohérente sur la page.
    const src = read(PLANS_PATH)
    assert.ok(
      !src.includes(TYPOGRAPHIC_APOSTROPHE),
      'utiliser l\'apostrophe droite U+0027, comme la spec et le reste de la page'
    )
  })
})

// ------------------------------------------------------------------ YouTube embed helper (AC-2)

describe('0-35 — YouTube embed helper (AC-2)', () => {
  test('videoId de la démo Keova', () => {
    assert.equal(KEOVA_DEMO_VIDEO_ID, 'BipPKn46gtw')
  })

  test('URL nocookie sans autoplay par défaut', () => {
    const url = buildYoutubeEmbedUrl(KEOVA_DEMO_VIDEO_ID)
    assert.match(url, /^https:\/\/www\.youtube-nocookie\.com\/embed\//)
    assert.ok(url.includes(KEOVA_DEMO_VIDEO_ID))
    assert.ok(!url.includes('autoplay'), 'pas d\'autoplay tant que le visiteur n\'a pas cliqué')
  })

  test('autoplay=1 uniquement au clic (opts.autoplay)', () => {
    const url = buildYoutubeEmbedUrl(KEOVA_DEMO_VIDEO_ID, { autoplay: true })
    assert.match(url, /autoplay=1/)
    assert.match(url, /youtube-nocookie\.com/)
  })
})

// ------------------------------------------------------------------ YoutubeFacade component (AC-2, AC-7)

describe('0-35 — YoutubeFacade.vue (AC-2 facade lazy, AC-7 a11y)', () => {
  test('l\'iframe est conditionnée au clic (v-if isPlaying) — pas au premier rendu', () => {
    const src = read(FACADE_PATH)
    assert.match(src, /<iframe/i, 'un iframe doit exister dans le composant')
    assert.match(src, /v-if="isPlaying"/, 'l\'iframe ne doit être rendue qu\'après clic')
    assert.match(src, /const isPlaying\s*=\s*ref\(false\)/, 'état de lecture initial = false')
  })

  test('utilise le helper d\'embed nocookie (pas d\'URL youtube.com en dur)', () => {
    const src = read(FACADE_PATH)
    assert.match(src, /buildYoutubeEmbedUrl/, 'doit passer par le helper pur')
    assert.ok(!/src="https:\/\/www\.youtube\.com/.test(src), 'pas d\'embed youtube.com direct')
  })

  test('réserve le ratio 16:9 pour éviter le CLS (aspect-video ou aspect-[16/9])', () => {
    const src = read(FACADE_PATH)
    assert.match(src, /aspect-video|aspect-\[16\/9\]/)
  })

  test('a11y : bouton play avec aria-label + poster avec alt', () => {
    const src = read(FACADE_PATH)
    assert.match(src, /:aria-label="playButtonLabel"/, 'le bouton play doit avoir un aria-label')
    assert.match(src, /:alt="posterAlt"/, 'le poster doit avoir un alt')
  })

  test('a11y : le label du bouton résiste à une chaîne vide', () => {
    const src = read(FACADE_PATH)
    // `??` ne garde que null/undefined : `playLabel=""` produirait un aria-label vide,
    // qui écrase l'alt interne et laisse le bouton sans nom accessible.
    assert.match(src, /playLabel\?\.trim\(\)\s*\|\|/, 'utiliser ?.trim() || et non ??')
  })

  test('a11y : anneau de focus INSET (le conteneur overflow-hidden clippe un outline externe)', () => {
    const src = read(FACADE_PATH)
    assert.match(src, /focus-visible:ring-inset/, 'ring inset requis, sinon clippé par overflow-hidden')
  })

  test('a11y : le focus est transféré à l\'iframe après le clic (WCAG 2.4.3)', () => {
    const src = read(FACADE_PATH)
    assert.match(src, /playerRef/, 'une ref sur l\'iframe est nécessaire pour transférer le focus')
    assert.match(src, /nextTick\(\)/, 'attendre le montage de l\'iframe avant de focus')
    assert.match(src, /playerRef\.value\?\.focus\(\)/, 'le focus doit être déplacé sur le player')
  })

  test('amélioration progressive : un vrai lien vers la vidéo, neutralisé par le JS', () => {
    const src = read(FACADE_PATH)
    // Sans JS (ou sur échec d'hydratation), la facade doit rester actionnable :
    // le poster est un <a href> vers YouTube, que @click.prevent intercepte quand le JS
    // est là. Un simple <button> laissait un visuel inerte sous un H2 promettant une démo.
    assert.match(src, /:href="watchUrl"/, 'le poster doit être un lien réel')
    assert.match(src, /youtu\.be\//, 'watchUrl doit pointer vers la vidéo')
    assert.match(src, /@click\.prevent="play"/, 'le JS annule la navigation et joue en place')
    assert.match(src, /rel="noopener noreferrer"/, 'lien externe target=_blank sécurisé')
    // Balise réelle en début de ligne — pas la simple occurrence du mot, qui apparaît
    // légitimement dans le commentaire expliquant pourquoi on ne l'utilise pas.
    assert.ok(!/^\s*<noscript>/m.test(src), 'pas de <noscript> : risque de mismatch d\'hydratation')
  })

  test('prefers-reduced-motion est respecté (parité avec LandingPricing)', () => {
    const src = read(FACADE_PATH)
    assert.match(src, /motion-reduce:/, 'les animations doivent être neutralisées en reduced-motion')
  })

  test('le poster est servi de façon responsive (sizes)', () => {
    const src = read(FACADE_PATH)
    assert.match(src, /sizes="/, 'sans sizes, un mobile télécharge le poster 1280px pleine largeur')
  })
})

// ------------------------------------------------------------------ LandingPricing component (AC-3, AC-5, AC-6)

describe('0-35 — LandingPricing.vue (AC-3, AC-5, AC-6)', () => {
  test('rend les 2 cartes depuis PRICING_PLANS (pas de duplication en dur)', () => {
    const src = read(PRICING_PATH)
    assert.match(src, /v-for="plan in PRICING_PLANS"/, 'les cartes sont générées depuis les données')
  })

  test('AC-5 : le CTA émet un événement waitlist (pas de checkout/Stripe)', () => {
    const src = read(PRICING_PATH)
    assert.match(src, /defineEmits/, 'le composant émet un événement')
    assert.match(src, /@click="emit\('reserve'\)"/, 'le CTA se contente d\'émettre reserve')
    assert.ok(!/stripe|loadstripe|navigateTo/i.test(src), 'aucun câblage paiement/navigation Stripe')
  })

  test('AC-6 : fallback scroll-reveal — contenu visible par défaut (opacity:1)', () => {
    const src = read(PRICING_PATH)
    // Garde-fou hotfix-12 : .scroll-reveal doit être visible par défaut.
    assert.match(src, /\.scroll-reveal\s*\{[^}]*opacity:\s*1/s)
    assert.match(src, /js-scroll-ready/, 'hide-before-reveal gaté par JS uniquement')
  })

  test('le badge du plan mis en avant est réellement rendu', () => {
    const src = read(PRICING_PATH)
    // Cible le rendu, pas la simple présence du mot « badge » (qui apparaît en doc-block).
    assert.match(src, /v-if="plan\.badge"/, 'le badge est rendu conditionnellement depuis les données')
    assert.match(src, /\{\{ plan\.badge \}\}/, 'la valeur du badge est interpolée')
    assert.match(src, /\{\{ PRICING_REASSURANCE \}\}/, 'bandeau réassurance depuis la constante')
  })

  test('les effets de survol sont gardés par @media (hover: hover)', () => {
    const src = read(PRICING_PATH)
    // Sans cette garde, un tap sur tactile laisse la carte Premium soulevée et agrandie.
    assert.match(src, /@media \(hover: hover\)/)
  })

  test('AC-7 : le texte posé sur le FOND DE SECTION passe le contraste AA', () => {
    const src = read(PRICING_PATH)
    // Nuance importante : crepuscule-500 (#7a6b8e) donne 4,86:1 sur le blanc des cartes
    // (conforme), mais seulement 3,98:1 sur le crepuscule-100 de la section (non conforme).
    // Seuls le chapô et la micro-copy sont posés sur le fond de section.
    for (const constant of ['PRICING_CHAPO', 'PRICING_MICROCOPY']) {
      const idx = src.indexOf(`{{ ${constant} }}`)
      assert.ok(idx > -1, `${constant} doit être rendu`)
      const openingTag = src.lastIndexOf('<p', idx)
      const markup = src.slice(openingTag, idx)
      assert.ok(
        !markup.includes('--color-crepuscule-500'),
        `${constant} est sur le fond de section : crepuscule-500 y plafonne à 3,98:1`
      )
    }
  })
})

// ------------------------------------------------------------------ Landing wiring (AC-1, AC-3, AC-10)

describe('0-35 — MarketingLandingB2B.vue wiring (AC-1, AC-3, AC-5, AC-10)', () => {
  test('AC-1 : la section vidéo est insérée entre le hero et le Bloc Douleur', () => {
    const src = read(LANDING_PATH)
    // On cible les COMPOSANTS et les ancres réelles, pas des commentaires HTML :
    // un commentaire laissé en place pendant que le composant se déplace ailleurs
    // laissait auparavant ce test au vert.
    const heroIdx = src.indexOf('id="essence"')
    const videoIdx = src.indexOf('<YoutubeFacade')
    const douleurIdx = src.indexOf('BLOC DOULEUR')
    assert.ok(videoIdx > -1, '<YoutubeFacade> doit être monté')
    assert.ok(heroIdx > -1 && douleurIdx > -1)
    assert.ok(heroIdx < videoIdx && videoIdx < douleurIdx, 'ordre hero → vidéo → douleur')
    assert.match(src, /Keova en vidéo, sans vous inscrire/, 'H2 vidéo verbatim spec §2.1')
  })

  test('AC-1 : la section vidéo est atteignable par l\'affordance « Explorer » du hero', () => {
    const src = read(LANDING_PATH)
    // Le bouton annonce « défiler vers la section suivante » : il ne doit pas enjamber
    // la nouvelle section vidéo pour atterrir sur #pourquoi.
    assert.match(src, /id="video"/, 'la section vidéo doit porter une ancre')
    assert.match(src, /@click="scrollTo\('video'\)"/, 'Explorer doit viser la section vidéo')
  })

  test('AC-3 : la section pricing est insérée avant la FAQ', () => {
    const src = read(LANDING_PATH)
    const pricingIdx = src.indexOf('<LandingPricing')
    const faqIdx = src.indexOf('id="faq"')
    assert.ok(pricingIdx > -1, 'LandingPricing doit être monté')
    assert.ok(faqIdx > -1)
    assert.ok(pricingIdx < faqIdx, 'pricing avant la FAQ (ordre validé 2026-07-13)')
  })

  test('AC-5 : le CTA pricing ouvre la modale waitlist', () => {
    const src = read(LANDING_PATH)
    assert.match(src, /<LandingPricing[^>]*@reserve="isWaitlistModalOpen\s*=\s*true"/s)
  })

  test('AC-10 : le P.S. « gratuit pendant toute la beta » est corrigé', () => {
    const src = read(LANDING_PATH)
    assert.ok(!src.includes('gratuit pendant toute la beta'), 'le P.S. « gratuit » périmé doit être retiré')
    assert.match(src, /Les places en beta sont limitées/, 'nouveau P.S.')
  })

  test('AC-10 : le P.S. n\'affirme plus être moins cher que « vos 5 outils actuels »', () => {
    const src = read(LANDING_PATH)
    // Recalcul en review : les 5 outils nommés par la page coûtent ≈ 25-30 €/mois,
    // donc l'affirmation s'inverse face au Premium à 49 €. Affirmation invérifiable
    // retirée sur une page dont l'argument central est « faits > adjectifs ».
    assert.ok(
      !/en[- ]dessous de ce que coûtent vos 5 outils/.test(src),
      'comparaison de coût non sourcée retirée'
    )
  })

  test('AC-10 : la FAQ « Keova est-il gratuit ? » est remplacée par « Combien coûte Keova ? »', () => {
    const src = read(LANDING_PATH)
    assert.ok(!src.includes('Keova est-il gratuit'), 'l\'entrée FAQ « gratuit » doit disparaître')
    assert.match(src, /Combien coûte Keova/, 'nouvelle entrée FAQ pricing (spec §2.3)')
    assert.match(src, /Puis-je utiliser mon propre nom de domaine/, 'entrée FAQ domaine propre (spec §2.3)')
  })

  test('la FAQ traite l\'objection de sortie, sans promettre d\'export inexistant', () => {
    const src = read(LANDING_PATH)
    assert.match(src, /Que se passe-t-il si j\\'arrête Keova/, 'entrée FAQ sortie')
    // Aucun endpoint d'export n'existe côté API : ne rien promettre sur ce terrain.
    // On inspecte la CHAÎNE `content` seule, pas le bloc de code autour (les commentaires
    // de code parlent légitimement d'export).
    const contentMatch = /content: '([^']*(?:\\'[^']*)*)',\s*\n\s*value: 'faq-sortie'/.exec(src)
    if (!contentMatch) {
      throw new Error('réponse de l\'entrée faq-sortie introuvable')
    }
    assert.ok(
      !/export/i.test(contentMatch[1] ?? ''),
      'ne pas promettre un export de données inexistant'
    )
  })

  test('la FAQ et les cartes affichent les mêmes montants (pas de dérive silencieuse)', () => {
    const src = read(LANDING_PATH)
    const faqAnswer = src.slice(src.indexOf('value: \'faq-1\'') - 700, src.indexOf('value: \'faq-1\''))
    // Les montants vivent dans PRICING_PLANS ; la réponse FAQ les redit en dur.
    // Sans ce test, les deux peuvent diverger avec la suite au vert.
    for (const amount of ['29 €', '49 €', '99 €']) {
      assert.ok(faqAnswer.includes(amount), `la FAQ doit mentionner ${amount}`)
    }
    assert.ok(
      PRICING_PLANS[0]!.priceLabel.includes('29 €'),
      'la carte Essentiel doit porter le même montant que la FAQ'
    )
    assert.ok(
      PRICING_PLANS[1]!.priceLabel.includes('49 €') && PRICING_PLANS[1]!.priceSuffix!.includes('99 €'),
      'la carte Premium doit porter les mêmes montants que la FAQ'
    )
  })

  test('AC-7 : le sous-titre vidéo n\'utilise pas crepuscule-500 (contraste)', () => {
    const src = read(LANDING_PATH)
    const videoSection = src.slice(src.indexOf('id="video"'), src.indexOf('BLOC DOULEUR'))
    assert.ok(
      !/text-\[var\(--color-crepuscule-500\)\]/.test(videoSection),
      'crepuscule-500 sur crepuscule-100 = 3,98:1, sous le seuil AA'
    )
  })
})

// ------------------------------------------------------------------ Navigation

describe('0-35 — Ancre #tarifs et cohérence de la nav', () => {
  const NAV_SOURCES = [
    path.join(appRoot, 'pages/index.vue'),
    path.join(appRoot, 'composables/usePublicHeaderInit.ts'),
    path.join(appRoot, 'features/public/state/public-header.state.ts')
  ]

  test('les 3 sources de nav déclarent toutes le lien Tarifs vers l\'ancre existante', () => {
    // Le layout rend le header AVANT le setup de la page : une divergence entre ces
    // fichiers provoque un premier paint à N liens puis un swap (flicker).
    for (const file of NAV_SOURCES) {
      const src = fs.readFileSync(file, 'utf-8')
      assert.match(src, /\{ label: 'Tarifs', href: '#tarifs' \}/, `lien Tarifs manquant dans ${path.basename(file)}`)
      assert.match(src, /\{ label: 'Témoignages', href: '#temoignage' \}/, `libellé Témoignages non aligné dans ${path.basename(file)}`)
    }
  })

  test('l\'ancre #tarifs existe réellement dans la section pricing', () => {
    const src = read(PRICING_PATH)
    assert.match(src, /id="tarifs"/, 'la nav ne doit pas pointer vers une ancre morte')
  })
})

// ------------------------------------------------------------------ Schema.org (AC-9)

describe('0-35 — useGlobalSchemaOrg.ts (AC-9)', () => {
  test('l\'Offer price:"0" et la mention « gratuite » sont retirés', () => {
    const src = read(SCHEMA_PATH)
    // Garde robuste : quotes simples OU doubles, clé quotée ou non, valeur chaîne ou nombre.
    assert.ok(
      !/["']?price["']?\s*:\s*["']?0["']?\s*[,}]/.test(src),
      'aucun Offer price:"0" (la beta est payante)'
    )
    assert.ok(!src.includes('Beta privée gratuite'), 'aucune mention « gratuite » dans le schema')
  })

  test('un Offer PreOrder au prix réel préserve l\'éligibilité rich result', () => {
    const src = read(SCHEMA_PATH)
    // `offers.price` est REQUIS par Google pour SoftwareApplication : le retirer
    // générait une erreur Search Console permanente. PreOrder décrit exactement
    // un accès sur waitlist et n'exige aucun checkout self-serve.
    assert.match(src, /'@type':\s*'Offer'/)
    assert.match(src, /'price':\s*'29'/, 'le prix d\'entrée réel est exposé')
    assert.match(src, /'priceCurrency':\s*'EUR'/)
    assert.match(src, /schema\.org\/PreOrder/, 'availability PreOrder = accès sur waitlist')
  })

  test('un VideoObject avec métadonnées réelles est présent (uploadDate 2026-07-05, PT5M28S)', () => {
    const src = read(SCHEMA_PATH)
    assert.match(src, /'@type':\s*'VideoObject'/, 'le type doit être déclaré, pas seulement cité en commentaire')
    assert.match(src, /2026-07-05/, 'uploadDate réelle')
    assert.match(src, /PT5M28S/, 'duration réelle 5:28')
  })

  test('le VideoObject est gaté sur isB2B (keova.fr n\'embarque aucune vidéo)', () => {
    const src = read(SCHEMA_PATH)
    // isPlatform couvre B2C ET B2B : gater dessus faisait déclarer une vidéo absente
    // de la page sur keova.fr, ce que Google traite comme un markup trompeur.
    assert.match(src, /isB2B/, 'isB2B doit être extrait du contexte de domaine')
    assert.match(src, /\.\.\.\(isB2B/, 'le bloc video doit être conditionné à isB2B')
  })

  test('le videoId vient de la constante partagée, pas d\'un littéral dupliqué', () => {
    const src = read(SCHEMA_PATH)
    assert.match(src, /KEOVA_DEMO_VIDEO_ID/, 'importer la constante depuis youtube-embed')
    assert.ok(
      !src.includes(KEOVA_DEMO_VIDEO_ID),
      'aucun littéral d\'ID vidéo en dur : une ré-upload désynchroniserait player et JSON-LD'
    )
  })

  test('la miniature est servie depuis notre origine', () => {
    const src = read(SCHEMA_PATH)
    assert.ok(!src.includes('i.ytimg.com'), 'préférer le poster local, sous notre contrôle')
    assert.match(src, /images\/video-poster-keova\.jpg/)
  })
})
