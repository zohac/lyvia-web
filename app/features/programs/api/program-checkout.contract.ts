/**
 * Program checkout contracts (Stripe Checkout for program subscriptions).
 *
 * Source of truth: repositories/lyvia-api/openapi.yaml
 * verified against OpenAPI spec
 */

// ============================================================================
// Checkout Request / Response
// ============================================================================

export type ProgramCheckoutPaymentMode = 'one_time' | 'installments'

/**
 * Request body for creating a program checkout session.
 * Maps to CreateProgramCheckoutDto in OpenAPI.
 */
export type CreateProgramCheckoutRequest = {
  programId: string
  paymentMode: ProgramCheckoutPaymentMode
  returnUrls: {
    success: string
    cancel: string
  }
}

/**
 * Response from creating a program checkout session.
 * Maps to CreateProgramCheckoutResponseDto in OpenAPI.
 */
export type CreateProgramCheckoutResponse = {
  checkoutSessionUrl: string
}
