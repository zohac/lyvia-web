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
  reload: () => Promise<boolean>
}

export type PreviewPublishResult
  = | { ok: true, /** The publish succeeded but the list refresh failed. */ reloadFailed: boolean }
    | { ok: false, error: PageSaveError, reloadFailed: boolean }

export async function publishPreviewPage(
  id: string,
  deps: PreviewPublishDependencies
): Promise<PreviewPublishResult> {
  let publishError: PageSaveError | null = null
  try {
    await deps.publish(id)
  } catch (error: unknown) {
    publishError = resolvePageSaveError(error, 'publication')
  }

  let reloadFailed = false
  try {
    reloadFailed = (await deps.reload()) === false
  } catch {
    reloadFailed = true
  }

  return publishError
    ? { ok: false, error: publishError, reloadFailed }
    : { ok: true, reloadFailed }
}
