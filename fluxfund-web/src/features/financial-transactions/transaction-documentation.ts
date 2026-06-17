import type { OrganizationSettings } from "@/features/organization-settings/organization-settings-types"
import type { FinancialTransaction } from "./financial-transaction-types"

export type TransactionDocumentationStatus =
  | "NOT_REQUIRED"
  | "MISSING"
  | "PARTIAL"
  | "OK"

export type TransactionDocumentationResult = {
  status: TransactionDocumentationStatus
  requiresFiscalDocument: boolean
  requiresPaymentProof: boolean
  requiresIncomeProof: boolean
  missingFiscalDocument: boolean
  missingPaymentProof: boolean
  missingIncomeProof: boolean
}

export function getTransactionDocumentationStatus(
  transaction: FinancialTransaction,
  settings?: OrganizationSettings,
): TransactionDocumentationResult {
  const attachmentCount = transaction.attachmentCount ?? 0
  const fiscalCount = transaction.fiscalAttachmentCount ?? 0
  const paymentProofCount = transaction.paymentProofAttachmentCount ?? 0

  if (
    transaction.status === "CANCELED" ||
    transaction.type === "TRANSFER" ||
    transaction.status !== "SETTLED"
  ) {
    return emptyResult("NOT_REQUIRED")
  }

  const category = transaction.category

  const organizationRequiresExpenseFiscal =
    settings?.requireFiscalDocumentForExpenses ?? true

  const organizationRequiresIncomeProof =
    settings?.requireProofForIncomes ?? false

  const requiresFiscalDocument =
    transaction.type === "EXPENSE" &&
    organizationRequiresExpenseFiscal &&
    (category?.requiresFiscalDocument ?? true)

  const requiresPaymentProof =
    Boolean(category?.requiresPaymentProof)

  const requiresIncomeProof =
    transaction.type === "INCOME" && organizationRequiresIncomeProof

  const missingFiscalDocument =
    requiresFiscalDocument && fiscalCount === 0

  const missingPaymentProof =
    requiresPaymentProof && paymentProofCount === 0

  const missingIncomeProof =
    requiresIncomeProof && attachmentCount === 0

  const hasAnyRequirement =
    requiresFiscalDocument ||
    requiresPaymentProof ||
    requiresIncomeProof

  if (!hasAnyRequirement) {
    return {
      status: "NOT_REQUIRED",
      requiresFiscalDocument,
      requiresPaymentProof,
      requiresIncomeProof,
      missingFiscalDocument,
      missingPaymentProof,
      missingIncomeProof,
    }
  }

  const hasAnyMissing =
    missingFiscalDocument ||
    missingPaymentProof ||
    missingIncomeProof

  if (!hasAnyMissing) {
    return {
      status: "OK",
      requiresFiscalDocument,
      requiresPaymentProof,
      requiresIncomeProof,
      missingFiscalDocument,
      missingPaymentProof,
      missingIncomeProof,
    }
  }

  return {
    status: attachmentCount > 0 ? "PARTIAL" : "MISSING",
    requiresFiscalDocument,
    requiresPaymentProof,
    requiresIncomeProof,
    missingFiscalDocument,
    missingPaymentProof,
    missingIncomeProof,
  }
}

function emptyResult(
  status: TransactionDocumentationStatus,
): TransactionDocumentationResult {
  return {
    status,
    requiresFiscalDocument: false,
    requiresPaymentProof: false,
    requiresIncomeProof: false,
    missingFiscalDocument: false,
    missingPaymentProof: false,
    missingIncomeProof: false,
  }
}