import type { PaymentStatus } from '../api/client-payments.contract'

export type PaymentStatusDisplay = {
  label: string
  tone: 'neutral' | 'success' | 'danger'
}

export function getPaymentStatusDisplay(status: PaymentStatus): PaymentStatusDisplay {
  switch (status) {
    case 'pending':
      return { label: 'En attente', tone: 'neutral' }
    case 'succeeded':
      return { label: 'Payé', tone: 'success' }
    case 'failed':
      return { label: 'Échoué', tone: 'danger' }
  }
}
