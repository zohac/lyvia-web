/**
 * Auth API contracts (Feature F).
 *
 * Backend reference:
 * `repositories/lyvia-api/src/features/auth/presentation/auth.controller.ts`
 *
 * Endpoints:
 * - `POST /auth/login`
 * - `POST /auth/refresh`
 * - `POST /auth/logout`
 * - `GET /auth/me`
 * - `POST /auth/forgot-password`
 * - `POST /auth/reset-password`
 */

export type UserRole = 'CLIENT' | 'PROVIDER' | 'ADMIN'

export type AuthUser = {
  id: string
  email: string
  role: UserRole
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
  reset: true
  sessionsRevoked: true
}
