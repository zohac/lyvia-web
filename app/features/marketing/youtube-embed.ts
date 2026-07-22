/**
 * Story 0-35 — Helper pur pour l'embed vidéo YouTube en facade lazy.
 *
 * On construit l'URL d'embed `youtube-nocookie.com` (RGPD : aucun cookie
 * n'est posé tant que le visiteur n'a pas cliqué sur la vignette). L'iframe
 * n'est injectée qu'au clic (cf. `YoutubeFacade.vue`), donc `autoplay=1` est
 * ajouté uniquement à ce moment-là pour démarrer la lecture immédiatement.
 *
 * Extrait en module pur (convention C5) pour être testé sans monter le composant.
 */

/** ID de la vidéo de démonstration Keova (https://youtu.be/BipPKn46gtw). */
export const KEOVA_DEMO_VIDEO_ID = 'BipPKn46gtw'

/**
 * Construit l'URL d'embed nocookie pour une vidéo YouTube.
 *
 * @param videoId — identifiant YouTube (ex. `BipPKn46gtw`)
 * @param opts.autoplay — ajoute `autoplay=1` (utilisé au clic sur la facade)
 */
export function buildYoutubeEmbedUrl(
  videoId: string,
  opts?: { autoplay?: boolean }
): string {
  const params = new URLSearchParams({
    rel: '0',
    modestbranding: '1',
    playsinline: '1'
  })

  if (opts?.autoplay) {
    params.set('autoplay', '1')
  }

  return `https://www.youtube-nocookie.com/embed/${videoId}?${params.toString()}`
}
