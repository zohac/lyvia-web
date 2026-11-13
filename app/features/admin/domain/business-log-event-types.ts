// Familles de business logs proposées par le panneau admin.
//
// Source de vérité UNIQUE des préfixes envoyés à l'API : chaque famille liste
// les préfixes réels émis par le code (grep des écritures dans
// public.business_logs). Une famille peut couvrir plusieurs préfixes, dont les
// pluriels (PAYMENTS_*, APPOINTMENTS_*) qui ne sont pas couverts par le
// singulier (PAYMENT_ ne matche pas PAYMENTS_* : le « S » n'est pas dans le
// préfixe). Voir story em-2.
export type BusinessLogEventFamily = {
  key: string
  label: string
  prefixes: string[]
}

export const BUSINESS_LOG_EVENT_FAMILIES: BusinessLogEventFamily[] = [
  { key: 'payment', label: 'Paiements', prefixes: ['PAYMENT_', 'PAYMENTS_'] },
  { key: 'appointment', label: 'RDV', prefixes: ['APPOINTMENT_', 'APPOINTMENTS_'] },
  { key: 'client', label: 'Clients', prefixes: ['CLIENT_'] },
  { key: 'provider', label: 'Providers', prefixes: ['PROVIDER_'] },
  { key: 'stripe', label: 'Stripe', prefixes: ['STRIPE_'] },
  { key: 'auth', label: 'Auth', prefixes: ['AUTH_'] }
]
