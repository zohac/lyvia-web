export type CreateConsultationPricePlanRequest = {
  label: string
  durationMinutes: number
  amountCents: number
  sortOrder?: number
}

export type ConsultationPricePlanIdResponse = {
  planId: string
}

export type UpdateConsultationPricePlanRequest = {
  label?: string
  sortOrder?: number
  isActive?: boolean
}
