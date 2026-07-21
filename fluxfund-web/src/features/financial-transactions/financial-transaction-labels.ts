import type { FinancialTransaction, FinancialTransactionSource, FinancialTransactionStatus, FinancialTransactionType, FiscalDocumentPolicy, TransferDirection } from "./financial-transaction-types"

export const financialTransactionTypeLabels: Record<FinancialTransactionType, string> = {
  INCOME: "Receita",
  EXPENSE: "Despesa",
  TRANSFER: "Transferência",
}

export const financialTransactionStatusLabels: Record<FinancialTransactionStatus, string> = {
  PENDING: "Pendente",
  SETTLED: "Baixada",
  CANCELED: "Cancelada",
  IMPORTED: "Importada",
}

export const financialTransactionSourceLabels: Record<FinancialTransactionSource, string> = {
  MANUAL: "Manual",
  OFX: "OFX",
  CSV: "CSV",
  CREDIT_CARD: "Cartão de crédito",
}

export const transferDirectionLabels: Record<TransferDirection, string> = {
  IN: "Entrada",
  OUT: "Saída",
}

export const fiscalDocumentPolicyLabels: Record<FiscalDocumentPolicy, string> = {
  CATEGORY: "Seguir regra da categoria",
  REQUIRED: "Exigir nesta transação",
  WAIVED: "Dispensar nesta transação",
  MISSING: "Não possuo o documento",
}

export const fiscalDocumentPolicyDescriptions: Record<FiscalDocumentPolicy, string> = {
  CATEGORY:
    "Usa a configuração definida na categoria selecionada.",
  REQUIRED:
    "Use quando esta transação precisa de documento fiscal, mesmo que a categoria não exija.",
  WAIVED:
    "Use para exceções legítimas em que o documento fiscal não deve ser exigido.",
  MISSING:
    "Use quando o documento deveria existir, mas não está disponível.",
}

export function fiscalDocumentPolicyRequiresNote(
  policy: FiscalDocumentPolicy,
) {
  return policy === "WAIVED" || policy === "MISSING"
}

export function normalizeFiscalDocumentNote(
  policy: FiscalDocumentPolicy,
  note?: string | null,
) {
  if (!fiscalDocumentPolicyRequiresNote(policy)) {
    return null
  }

  const normalizedNote = note?.trim()

  return normalizedNote ? normalizedNote : null
}

export function getFinancialTransactionStatusLabel(
  transaction: Pick<
    FinancialTransaction,
    | "status"
    | "source"
    | "creditCardStatementId"
  >,
) {
  const isCreditCardItem =
    transaction.source === "CREDIT_CARD" &&
    Boolean(transaction.creditCardStatementId)

  if (
    isCreditCardItem &&
    transaction.status === "SETTLED"
  ) {
    return "Compra lançada"
  }

  return financialTransactionStatusLabels[
    transaction.status
  ]
}