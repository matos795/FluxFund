import type {
  ReceiptDirection,
  ReceiptSourceType,
  ReceiptStatus,
  ReceiptType,
} from "./receipt-types"

export const receiptStatusLabels:
  Record<
    ReceiptStatus,
    string
  > = {
  DRAFT:
    "Rascunho",

  ISSUED:
    "Emitido",

  CANCELED:
    "Cancelado",
}

export const receiptSourceTypeLabels:
  Record<
    ReceiptSourceType,
    string
  > = {
  MANUAL:
    "Manual",

  TRANSACTION:
    "Transação",

  ALLOCATION:
    "Alocação",
}

export const receiptTypeLabels:
  Record<
    ReceiptType,
    string
  > = {
  DONATION:
    "Doação recebida",

  MEMBER_CONTRIBUTION:
    "Contribuição recebida",

  CUSTOMER_PAYMENT:
    "Pagamento de cliente",

  SPONSORSHIP:
    "Patrocínio recebido",

  OTHER_INCOME:
    "Outro recebimento",

  SUPPORT_PAYMENT:
    "Pagamento de sustento",

  SUPPLIER_PAYMENT:
    "Pagamento a fornecedor",

  SERVICE_PAYMENT:
    "Pagamento por serviço",

  REIMBURSEMENT:
    "Reembolso",

  OTHER_PAYMENT:
    "Outro pagamento",
}

export const receiptDirectionLabels:
  Record<
    ReceiptDirection,
    string
  > = {
  RECEIVED_BY_ORGANIZATION:
    "Recebido pela organização",

  PAID_BY_ORGANIZATION:
    "Pago pela organização",
}

export const incomingReceiptTypes:
  ReceiptType[] = [
    "DONATION",
    "MEMBER_CONTRIBUTION",
    "CUSTOMER_PAYMENT",
    "SPONSORSHIP",
    "OTHER_INCOME",
  ]

export const outgoingReceiptTypes:
  ReceiptType[] = [
    "SUPPORT_PAYMENT",
    "SUPPLIER_PAYMENT",
    "SERVICE_PAYMENT",
    "REIMBURSEMENT",
    "OTHER_PAYMENT",
  ]

export function isIncomingReceiptType(
  receiptType:
    ReceiptType,
) {
  return incomingReceiptTypes
    .includes(
      receiptType,
    )
}