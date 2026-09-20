/**
 * V2.2e — Banner-publish sequence used by the list screen (`/provider/pages`).
 *
 * The list has no editor state: publishing from the preview banner is a plain
 * `publish` + list reload. Extracted so the sequence (publish → reload, with
 * error mapping) is unit-tested instead of living only in the page.
 */
import { resolvePageSaveError, type PageSaveError } from './page-editor'

export interface PreviewPublishDependencies {
  publish: (id: string) => Promise<unknown>
  /** Refreshes the list; always called, even when the publish failed. */
  reload: () => Promise<unknown>
}

export type PreviewPublishResult
  = | { ok: true }
    | { ok: false, error: PageSaveError }

export async function publishPreviewPage(
  id: string,
  deps: PreviewPublishDependencies
): Promise<PreviewPublishResult> {
  try {
    await deps.publish(id)
    return { ok: true }
  } catch (error: unknown) {
    return { ok: false, error: resolvePageSaveError(error) }
  } finally {
    await deps.reload()
  }
}
