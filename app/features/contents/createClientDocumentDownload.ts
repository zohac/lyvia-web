import { ref } from 'vue'

/**
 * Download of the PDF attached to a client content (Story diffusion-9, AC2).
 *
 * The route `GET /content/:slug/document` is authenticated with the access
 * token, which lives **in memory** (`useAuthState`): a plain `<a href>` cannot
 * send it, so an anchor would answer `401 {"code":"UNAUTHORIZED"}` and replace
 * the reading page with that JSON. The download is therefore a programmatic
 * `fetch` through `apiFetch` (Bearer header, refresh-once retry), then the blob
 * is handed to the browser. The storage URL never reaches the DOM either way.
 *
 * The behaviour lives here, not in the page, so a test can execute it: the page
 * is `ssr: false` and its click handler is unreachable from `renderToString`.
 */
export const CLIENT_DOCUMENT_DOWNLOAD_ERROR = 'Le téléchargement du document a échoué. Veuillez réessayer.'

/** The document `Content-Disposition` fallback when a filename is unusable. */
export const CLIENT_DOCUMENT_FALLBACK_FILENAME = 'document.pdf'

export interface ClientDocumentTarget {
  slug: string
  /** Stored filename, used as the download name; the server sends its own copy. */
  filename: string | null
}

export interface CreateClientDocumentDownloadDependencies {
  /** Authenticated `GET /content/:slug/document`, resolved as a blob. */
  fetchDocument: (slug: string) => Promise<Blob>
  /** Hands the blob to the browser; never touches the network. */
  save: (blob: Blob, filename: string) => void
}

/** `true` when `candidate` is a slug worth a request. */
function isDownloadableSlug(candidate: string): boolean {
  return candidate.trim().length > 0
}

/** A download name the browser accepts: no path separators, never empty. */
export function downloadFilename(filename: string | null | undefined): string {
  const cleaned = (filename ?? '').replace(/[\\/]/g, '_').trim()
  return cleaned.length > 0 ? cleaned : CLIENT_DOCUMENT_FALLBACK_FILENAME
}

export function createClientDocumentDownload(deps: CreateClientDocumentDownloadDependencies) {
  const downloading = ref(false)
  const errorMessage = ref<string | null>(null)

  /**
   * A second click while the first request is in flight is ignored: two blobs
   * for one document would fight over the same filename.
   */
  async function download(target: ClientDocumentTarget): Promise<void> {
    if (downloading.value) return
    if (!isDownloadableSlug(target.slug)) return

    downloading.value = true
    errorMessage.value = null

    try {
      const blob = await deps.fetchDocument(target.slug)
      deps.save(blob, downloadFilename(target.filename))
    } catch {
      errorMessage.value = CLIENT_DOCUMENT_DOWNLOAD_ERROR
    } finally {
      downloading.value = false
    }
  }

  function resetError(): void {
    errorMessage.value = null
  }

  return { downloading, errorMessage, download, resetError }
}
