declare module 'node:test' {
  const test: (name: string, fn: () => unknown | Promise<unknown>) => unknown
  export const describe: (name: string, fn: () => unknown | Promise<unknown>) => unknown
  export const it: (name: string, fn: () => unknown | Promise<unknown>) => unknown
  export default test
}

declare module 'node:assert/strict' {
  const assert: {
    equal(actual: unknown, expected: unknown, message?: string): void
    strictEqual(actual: unknown, expected: unknown, message?: string): void
    notEqual(actual: unknown, expected: unknown, message?: string): void
    deepEqual(actual: unknown, expected: unknown, message?: string): void
    deepStrictEqual(actual: unknown, expected: unknown, message?: string): void
    ok(value: unknown, message?: string): void
    match(actual: string, expected: RegExp, message?: string): void
    doesNotMatch(actual: string, expected: RegExp, message?: string): void
    fail(message?: string): never
  }
  export function equal(actual: unknown, expected: unknown, message?: string): void
  export function strictEqual(actual: unknown, expected: unknown, message?: string): void
  export function notEqual(actual: unknown, expected: unknown, message?: string): void
  export function deepEqual(actual: unknown, expected: unknown, message?: string): void
  export function deepStrictEqual(actual: unknown, expected: unknown, message?: string): void
  export function ok(value: unknown, message?: string): void
  export function match(actual: string, expected: RegExp, message?: string): void
  export function doesNotMatch(actual: string, expected: RegExp, message?: string): void
  export function fail(message?: string): never
  export default assert
}
