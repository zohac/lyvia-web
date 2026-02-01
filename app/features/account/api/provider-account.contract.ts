export type ProviderAccountResponse = {
  email: string
  firstname: string
  lastname: string
  bio: string | null
  specialties: string[]
  updatedAt?: string
}

export type UpdateProviderAccountRequest = {
  firstname?: string
  lastname?: string
  bio?: string | null
  specialties?: string[]
}
