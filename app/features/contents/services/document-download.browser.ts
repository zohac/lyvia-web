/**
 * Browser half of the client document download (Story diffusion-9, AC2).
 *
 * Only the last step — turning a blob already fetched through the authenticated
 * route into a file the browser saves — lives here. It is deliberately thin and
 * separate from `createClientDocumentDownload` so the state machine and its
 * ordering stay executable by `node --test`, which has no DOM.
 */

/**
 * Files the blob under `filename` without navigating: a temporary anchor
 * carrying `download` is clicked and removed. The reader keeps the page, and no
 * URL of any kind (storage or API) is left in the DOM afterwards.
 */
export function saveDocumentBlob(blob: Blob, filename: string): void {
  if (typeof document === 'undefined' || typeof URL.createObjectURL !== 'function') return

  const href = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = href
  anchor.download = filename
  anchor.rel = 'noopener'
  anchor.style.display = 'none'
  document.body.appendChild(anchor)

  try {
    anchor.click()
  } finally {
    anchor.remove()
    // The browser reads the blob asynchronously once the click starts it:
    // revoking synchronously can cancel the download.
    setTimeout(() => URL.revokeObjectURL(href), 0)
  }
}
