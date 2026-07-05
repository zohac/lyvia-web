import type { PaymentStatus } from './client-payments.contract'

export type ProviderPaymentClient = {
  firstname: string
  lastname: string
  stage: 'lead' | 'active'
}

export type ProviderPaymentListItem = {
  id: string
  status: PaymentStatus
  amountCents: number
  platformFeeCents: number
  stripeFeeCents: number | null
  // Null while the actual Stripe fee is unknown (HF18): never an exact net computed with a 0 fee.
  netAmountCents: number | null
  currency: string
  receiptUrl: string | null
  createdAt: string
  clientProfileId: string
  client: ProviderPaymentClient
  appointmentScheduledAt?: string | null
}

export type ProviderPaymentsPage = {
  limit: number
  nextCursor: string | null
}

export type ListProviderPaymentsResponse = {
  payments: ProviderPaymentListItem[]
  page: ProviderPaymentsPage
}
