declare module 'node:test' {
  const test: (name: string, fn: () => unknown | Promise<unknown>) => unknown
  export default test
}

declare module 'node:assert/strict' {
  export function equal(actual: unknown, expected: unknown, message?: string): void
  export function ok(value: unknown, message?: string): void
}
