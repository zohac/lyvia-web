import { EMAIL_REGEX } from './validation-regex'

export function validateClientFields(form: { firstName: string, lastName: string, email: string }): Record<string, string> {
  const errors: Record<string, string> = {}
  if (!form.firstName.trim()) errors.firstName = 'Le prénom est requis'
  if (!form.lastName.trim()) errors.lastName = 'Le nom est requis'
  if (!form.email.trim()) errors.email = 'L\'email est requis'
  else if (!EMAIL_REGEX.test(form.email)) errors.email = 'Format email invalide'
  return errors
}
