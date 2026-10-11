declare function useState<T>(key: string, init?: () => T): { value: T }
declare function useCookie<T>(name: string, options?: unknown): { value: T }

// Nitro globals read by `server/routes/preferences-submit.post.ts`.
//
// Nitro injects them as auto-imports at build time; `tsc -p tsconfig.tests.json`
// compiles the same file standalone, so they must be declared or the handler
// cannot be type-checked — and therefore cannot be mounted by the test that
// amends Task 4.2. Declared, not implemented: the test supplies both on
// `globalThis` before invoking the handler, so the assertions run against the
// shipped code path rather than against a declaration.
declare function useRuntimeConfig(): { apiBase?: string }
declare function $fetch<T = unknown>(
  request: string,
  options?: {
    method?: string
    body?: unknown
    headers?: HeadersInit
  }
): Promise<T>
