import type { AccountType } from "@/features/accounts/types"

export const accountTypeLabels: Record<AccountType, string> = {
  BANK: "Conta bancária",
  CASH: "Caixa físico",
  DIGITAL_WALLET: "Carteira digital",
  CREDIT_CARD: "Cartão de Crédito",
}