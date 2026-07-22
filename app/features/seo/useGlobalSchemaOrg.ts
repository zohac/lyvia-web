import { getDomainContext } from '#shared/utils/domain-context'
import { usePublicTenantHome } from '~/composables/usePublicTenantHome'
import { KEOVA_DEMO_VIDEO_ID } from '~/features/marketing/youtube-embed'

// Detection logic is covered by tests/shared/platform-host.test.ts + domain-context.test.ts.
export async function useGlobalSchemaOrg() {
  const requestUrl = useRequestURL()
  const origin = requestUrl.origin
  const hostname = requestUrl.hostname.toLowerCase()

  const runtimeConfig = useRuntimeConfig()
  const platformDomain = runtimeConfig.public.platformDomain?.toLowerCase() || 'keova.fr'
  const platformDomainB2B = (runtimeConfig.public.platformDomainB2B as string)?.toLowerCase() || ''
  // `isB2B` est nécessaire en plus de `isPlatform` : `isPlatform` couvre B2C ET B2B, or la
  // vidéo de démo n'existe que sur la landing B2B (keova.app). Voir le VideoObject plus bas.
  const { isPlatform, isB2B } = getDomainContext(hostname, platformDomain, platformDomainB2B || undefined)

  if (isPlatform) {
    useSchemaOrg([
      defineOrganization({
        name: 'Keova',
        url: origin,
        logo: {
          '@type': 'ImageObject',
          '@id': `${origin}/#logo`,
          'url': `${origin}/images/keova-logo.webp`,
          'contentUrl': `${origin}/images/keova-logo.webp`,
          'caption': 'Keova',
          'width': 512,
          'height': 512
        },
        description: 'Keova réunit agenda, paiements et suivi client dans un espace pro conçu pour les spécialistes ménopause et bien-être.',
        foundingDate: '2026',
        areaServed: { '@type': 'Country', 'name': 'France' },
        contactPoint: { '@type': 'ContactPoint', 'contactType': 'customer support', 'availableLanguage': 'fr' },
        sameAs: []
      }),
      defineWebSite({
        name: 'Keova',
        inLanguage: 'fr-FR'
      }),
      defineWebPage({
        inLanguage: 'fr-FR'
      }),
      // SoftwareApplication with Review (AC-14) + VideoObject (Story 0-35 AC-9)
      //
      // Offer (révisé en code review du 2026-07-22, amende la spec §3 règle 1) :
      // `offers.price` est une propriété REQUISE par Google pour SoftwareApplication.
      // La retirer purement et simplement sortait l'entité de l'éligibilité au rich
      // result et générait une erreur Search Console permanente. L'objectif de la spec
      // était de supprimer un prix FAUX (l'ancien Offer à zéro et son libellé promettant
      // une beta sans frais, périmés depuis que la beta est payante), pas l'éligibilité.
      // On pose donc le prix
      // réel d'entrée, avec `PreOrder` qui décrit exactement un accès sur waitlist —
      // `Offer` n'exige aucun checkout self-serve. Prix TTC (décision Simon 2026-07-22).
      {
        '@type': 'SoftwareApplication',
        'name': 'Keova',
        'applicationCategory': 'BusinessApplication',
        'operatingSystem': 'Web',
        'url': origin,
        'description': 'Logiciel tout-en-un pour spécialistes ménopause : agenda en ligne, paiements automatiques, suivi client.',
        'offers': {
          '@type': 'Offer',
          'price': '29',
          'priceCurrency': 'EUR',
          'availability': 'https://schema.org/PreOrder',
          'url': `${origin}/#tarifs`
        },
        // VideoObject gaté sur isB2B et NON sur isPlatform : la landing B2C (keova.fr)
        // n'embarque aucune vidéo, et Google exige que le markup VideoObject soit posé sur
        // une page où la vidéo est réellement visionnable. Un markup orphelin fait perdre
        // le rich result vidéo, et un historique de markup invalide peut le faire perdre à
        // l'échelle du site.
        ...(isB2B
          ? {
              video: {
                '@type': 'VideoObject',
                'name': 'Démo Keova',
                'description': 'Démonstration de Keova : site professionnel, prise de rendez-vous en ligne, paiements sécurisés, rappels automatiques et suivi des clientes — dans une seule application.',
                // Poster servi depuis notre propre origine plutôt que depuis le CDN de
                // miniatures YouTube : le fichier en est la copie octet pour octet, mais
                // hébergé chez nous il reste sous notre contrôle et correspond au poster
                // réellement rendu par URL, pas seulement par contenu.
                'thumbnailUrl': `${origin}/images/video-poster-keova.jpg`,
                'uploadDate': '2026-07-05T09:00:00+02:00',
                'duration': 'PT5M28S',
                'embedUrl': `https://www.youtube-nocookie.com/embed/${KEOVA_DEMO_VIDEO_ID}`
              }
            }
          : {}),
        'review': {
          '@type': 'Review',
          'author': {
            '@type': 'Person',
            'name': 'Sophie Jouan',
            'jobTitle': 'Spécialiste ménopause',
            'address': { '@type': 'PostalAddress', 'addressLocality': 'Valognes', 'addressRegion': 'Normandie' }
          },
          'reviewBody': 'Keova a remplacé mes 5 outils par un seul espace. Ma page pro était en ligne en quelques minutes.',
          'reviewRating': { '@type': 'Rating', 'ratingValue': '5', 'bestRating': '5' }
        }
      }
    ])
    return
  }

  // White-label: register WebSite BEFORE await to preserve Nuxt context.
  // Person schema is NOT injected here — useCoachSchemaOrg (T2.3) is the single source
  // for Person data on coach pages (with enriched profile: bio, specialties, image).
  const coachName = ref('Coach')

  useSchemaOrg([
    defineWebSite({
      name: () => coachName.value,
      inLanguage: 'fr-FR'
    })
  ])

  // Override og:site_name for white-label (static "Keova" set in nuxt.config.ts)
  useSeoMeta({
    ogSiteName: () => coachName.value
  })

  // Fetch tenant data AFTER composable registration.
  // Shared composable ensures same key + handler as index.vue (no "Incompatible options" warning).
  const { data: tenant } = await usePublicTenantHome()

  // Update ref reactively — WebSite name and og:site_name pick up the new value
  watchEffect(() => {
    coachName.value = tenant.value?.brand.displayName?.trim() || 'Coach'
  })
}
