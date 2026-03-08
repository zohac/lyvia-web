export type ProviderAccountResponse = {
  email: string
  firstname: string
  lastname: string
  bio: string | null
  specialties: string[]
  slug: string
  defaultDiscoveryDurationMinutes: number
  discoveryBufferAfterMinutes: number
  updatedAt?: string
}

export type UpdateProviderAccountRequest = {
  firstname?: string
  lastname?: string
  bio?: string | null
  specialties?: string[]
  slug?: string
  defaultDiscoveryDurationMinutes?: number
  discoveryBufferAfterMinutes?: number
}
