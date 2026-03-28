/**
 * Auth API contracts (Feature F).
 *
 * Sources of truth:
 * - `repositories/lyvia-api/openapi.yaml`
 * - `repositories/lyvia-api/src/features/auth/presentation/auth.controller.ts`
 *
 * Endpoints:
 * - `POST /auth/login`
 * - `POST /auth/refresh`
 * - `POST /auth/logout`
 * - `GET /auth/me`
 * - `POST /auth/forgot-password`
 * - `POST /auth/reset-password`
 * - `POST /auth/change-password`
 * - `POST /auth/request-email-change`
 * - `GET /auth/sessions`
 * - `POST /auth/sessions/:id/revoke`
 */

export type UserRole = 'CLIENT' | 'PROVIDER' | 'ADMIN'

export type AuthUser = {
  id: string
  email: string
  role: UserRole
  /** First name from profile (null for ADMIN or if profile not found) */
  firstname: string | null
  /** Last name from profile (null for ADMIN or if profile not found) */
  lastname: string | null
  /** Display name (e.g., "Marie D.") or null if profile not found */
  displayName: string | null
  /** Whether this is a test provider account (only present for PROVIDER role) */
  isTest?: boolean
}

export type LoginRequest = {
  email: string
  password: string
}

export type LoginResponse = {
  accessToken: string
  expiresInSeconds: number
  user: AuthUser
  redirect: { path: string }
}

export type RefreshResponse = {
  accessToken: string
  expiresInSeconds: number
}

export type LogoutResponse = {
  loggedOut: boolean
}

export type MeResponse = {
  user: AuthUser
}

export type ForgotPasswordRequest = {
  email: string
}

export type ForgotPasswordResponse = {
  accepted: boolean
  resetToken?: string
  expiresAt?: string
}

export type ResetPasswordRequest = {
  token: string
  newPassword: string
}

export type ResetPasswordResponse = {
  reset: boolean
  sessionsRevoked: boolean
}

export type Session = {
  id: string
  createdAt: string
  expiresAt: string
  ip: string | null
  userAgent: string | null
}

export type ListSessionsResponse = {
  sessions: Session[]
}

export type RevokeSessionResponse = {
  revoked: boolean
}

export type ChangePasswordRequest = {
  currentPassword: string
  newPassword: string
}

export type ChangePasswordResponse = {
  changed: boolean
  sessionsRevoked: number
}

export type RequestEmailChangeRequest = {
  newEmail: string
  currentPassword: string
}

export type RequestEmailChangeResponse = {
  accepted: boolean
  message: string
}

export type VerifyEmailChangeResponse = {
  verified: true
  newEmail: string
  sessionsRevoked: true
}
