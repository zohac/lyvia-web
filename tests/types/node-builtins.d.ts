declare module 'node:test' {
  const test: (name: string, fn: () => unknown | Promise<unknown>) => unknown
  export const describe: (name: string, fn: () => unknown | Promise<unknown>) => unknown
  export const it: (name: string, fn: () => unknown | Promise<unknown>) => unknown
  export default test
}

declare module 'node:assert/strict' {
  const assert: {
    equal(actual: unknown, expected: unknown, message?: string): void
    deepStrictEqual(actual: unknown, expected: unknown, message?: string): void
    ok(value: unknown, message?: string): void
  }
  export function equal(actual: unknown, expected: unknown, message?: string): void
  export function deepStrictEqual(actual: unknown, expected: unknown, message?: string): void
  export function ok(value: unknown, message?: string): void
  export default assert
}
