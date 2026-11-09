/**
 * Named, justified `ignoreErrors` list for the Sentry browser SDK.
 *
 * Kept in a pure module so that the list (and the matching logic) can be
 * unit-tested without initialising the SDK. Each entry corresponds to an
 * identified browser noise source. None of them can match an application
 * exception (a `TypeError`, a `ReferenceError`, a thrown `Error`): they are
 * platform notifications and transport-level cancellations whose stack starts
 * in the browser or in an extension, not in app code.
 */

export const IGNORE_ERRORS: Array<string | RegExp> = [
  // ResizeObserver notifications emitted on layout thrash — not an application bug.
  'ResizeObserver loop limit exceeded',
  'ResizeObserver loop completed with undelivered notifications',
  // Aborted / blocked network requests (ad blockers, navigation cancellation).
  'NetworkError when attempting to fetch resource',
  'Failed to fetch',
  'Load failed',
  // Unhandled promise rejections without an Error instance (browser noise).
  'Non-Error promise rejection captured'
]

/**
 * Minimal reproduction of Sentry's ignoreErrors matching: a string entry matches
 * when the error message contains it; a RegExp entry matches via `.test()`.
 */
export function isIgnoredError(
  message: string,
  list: ReadonlyArray<string | RegExp> = IGNORE_ERRORS
): boolean {
  return list.some((entry) => {
    if (entry instanceof RegExp) return entry.test(message)
    return typeof message === 'string' && message.includes(entry)
  })
}
