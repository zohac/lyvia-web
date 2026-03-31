export interface FeaturedProvider {
  slug: string
  displayName: string
  firstName: string
  lastName: string
  bio: string | null
  specialties: string[]
  city: string | null
  profilePhotoUrl: string | null
  profilePhotoAlt: string | null
  customDomain: string | null
  discoveryDurationMinutes: number
}
