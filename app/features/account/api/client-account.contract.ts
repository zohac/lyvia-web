export type ClientAccountResponse = {
  email: string
  firstname: string
  lastname: string
  phone: string
  updatedAt?: string
}

export type UpdateClientAccountRequest = {
  firstname?: string
  lastname?: string
  phone?: string
}
