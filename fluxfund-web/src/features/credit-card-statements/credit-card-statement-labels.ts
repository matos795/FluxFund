import type { CreditCardStatementStatus } from "./credit-card-statement-types"

export const creditCardStatementStatusLabels: Record<
  CreditCardStatementStatus,
  string
> = {
  OPEN: "Aberta",
  CLOSED: "Fechada",
  PAID: "Paga",
  CANCELED: "Cancelada",
}
