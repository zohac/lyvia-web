export type ProviderClientStatus = 'onboarding' | 'in_progress' | 'completed'

export type ProviderClientStats = {
  consultationsCompleted: number
  appointmentsTotal: number
  lastAppointmentAt: string | null
  nextAppointmentAt: string | null
}

export type ProviderClientDetailStats = {
  consultationsCompleted: number
  lastAppointmentAt: string | null
  nextConsultationAt: string | null
}

export type ProviderClientDetailProfile = {
  clientProfileId: string
  firstname: string
  lastname: string
  email: string
  phone: string
}

export type ProviderClientDetailProgram = {
  currentProgramMonth: number | null
  totalMonths: number
}

export type ProviderClientListItem = {
  clientProfileId: string
  firstname: string
  lastname: string
  email: string
  phone: string
  onboardingCallDone: boolean
  currentProgramMonth: number | null
  computedStatus: ProviderClientStatus
  stats: ProviderClientStats
  createdAt: string
}

export type ProviderClientsPage = {
  limit: number
  nextCursor: string | null
}

export type ListProviderClientsResponse = {
  items: ProviderClientListItem[]
  page: ProviderClientsPage
}

export type ListProviderClientsParams = {
  q?: string
  status?: ProviderClientStatus
  limit?: number
  cursor?: string
  sort?: 'createdAt' | 'lastname' | 'nextAppointmentAt'
}

export type ProviderClientDetailResponse = {
  client: ProviderClientDetailProfile
  onboardingCallDone: boolean
  program: ProviderClientDetailProgram
  stats: ProviderClientDetailStats
  computedStatus: ProviderClientStatus
  timezone: string
  appointments: unknown[]
  payments: unknown[]
}
