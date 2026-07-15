import type { CreditCardStatementPaymentStatus, CreditCardStatementStatus } from "./credit-card-statement-types"

export const creditCardStatementStatusLabels: Record<
  CreditCardStatementStatus,
  string
> = {
  OPEN: "Aberta",
  CLOSED: "Fechada",
  PAID: "Paga",
  CANCELED: "Cancelada",
}

export const creditCardStatementPaymentStatusLabels: Record<
  CreditCardStatementPaymentStatus,
  string
> = {

  UNPAID:
    "Não paga",

  PARTIALLY_PAID:
    "Parcialmente paga",

  PAID:
    "Paga",
}