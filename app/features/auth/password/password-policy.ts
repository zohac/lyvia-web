const COMMON_PASSWORDS = [
  'password',
  'motdepasse',
  '1234567890',
  'qwertyuiop',
  'azertyuiop',
  'welcome'
] as const

export type PasswordCriteria = {
  minLength: boolean
  hasLetter: boolean
  hasDigit: boolean
  hasSpecial: boolean
  notCommon: boolean
}

export function getPasswordCriteria(password: string): PasswordCriteria {
  const normalized = password.trim().toLowerCase()

  return {
    minLength: password.length >= 10,
    hasLetter: /[a-z]/i.test(password),
    hasDigit: /\d/.test(password),
    hasSpecial: /[^a-z0-9]/i.test(password),
    notCommon: normalized.length > 0 && !COMMON_PASSWORDS.includes(normalized as any)
  }
}

export function isPasswordStrong(password: string): boolean {
  const criteria = getPasswordCriteria(password)
  return Object.values(criteria).every(Boolean)
}

