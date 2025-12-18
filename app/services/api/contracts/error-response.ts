/**
 * Standard API error payload (must match backend `ErrorResponse` contract).
 *
 * Backend reference:
 * `repositories/lyvia-api/src/core/http/contracts/error-response.ts`
 */
export type ErrorResponse = {
  code: string
  message: string
  details?: Record<string, unknown>
}

