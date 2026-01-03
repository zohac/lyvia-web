export type PaymentStatus = 'pending' | 'succeeded' | 'failed'

export type ClientPaymentListItem = {
  id: string
  status: PaymentStatus
  amountCents: number
  currency: string
  receiptUrl: string | null
  createdAt: string
}

export type ClientPaymentsPage = {
  limit: number
  nextCursor: string | null
}

export type ListClientPaymentsResponse = {
  payments: ClientPaymentListItem[]
  page: ClientPaymentsPage
}
