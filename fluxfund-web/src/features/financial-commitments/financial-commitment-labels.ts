import type {
  FinancialCommitmentDirection,
  FinancialCommitmentRecurrence,
  FinancialCommitmentStatus,
  FinancialCommitmentType,
} from "./financial-commitment-types"

export const financialCommitmentDirectionLabels:
  Record<
    FinancialCommitmentDirection,
    string
  > = {
  RECEIVABLE: "A receber",
  PAYABLE: "A pagar",
}

export const financialCommitmentRecurrenceLabels:
  Record<
    FinancialCommitmentRecurrence,
    string
  > = {
  ONE_TIME: "Uma única vez",
  MONTHLY: "Mensal",
}

export const financialCommitmentStatusLabels:
  Record<
    FinancialCommitmentStatus,
    string
  > = {
  ACTIVE: "Vigente",
  SCHEDULED: "Agendado",
  EXPIRED: "Encerrado",
  INACTIVE: "Desativado",
}

export const financialCommitmentTypeLabels:
  Record<
    FinancialCommitmentType,
    string
  > = {
  DONATION: "Doação",
  CUSTOMER_PAYMENT:
    "Pagamento de cliente",
  SPONSORSHIP: "Patrocínio",
  MEMBER_CONTRIBUTION:
    "Contribuição de membro",
  SUPPLIER_PAYMENT:
    "Pagamento de fornecedor",
  SALARY: "Salário",
  SERVICE_PAYMENT:
    "Prestação de serviço",
  REIMBURSEMENT: "Reembolso",
  OTHER: "Outro",
}

export const receivableCommitmentTypes:
  FinancialCommitmentType[] = [
  "DONATION",
  "CUSTOMER_PAYMENT",
  "SPONSORSHIP",
  "MEMBER_CONTRIBUTION",
  "OTHER",
]

export const payableCommitmentTypes:
  FinancialCommitmentType[] = [
  "SUPPLIER_PAYMENT",
  "SALARY",
  "SERVICE_PAYMENT",
  "REIMBURSEMENT",
  "OTHER",
]

export function getCommitmentTypesByDirection(
  direction:
    FinancialCommitmentDirection,
) {
  return direction === "RECEIVABLE"
    ? receivableCommitmentTypes
    : payableCommitmentTypes
}