import type {
  FinancialPartyClassification,
  FinancialPartyRole,
  FinancialPartyType,
} from "./financial-party-types"

export const financialPartyTypeLabels: Record<
  FinancialPartyType,
  string
> = {
  INDIVIDUAL: "Pessoa física",
  LEGAL_ENTITY: "Pessoa jurídica",
}

export const financialPartyRoleLabels: Record<
  FinancialPartyRole,
  string
> = {
  INCOME_SOURCE: "Origem de receita",
  PAYMENT_RECIPIENT: "Recebedor de pagamento",
}

export const financialPartyClassificationLabels: Record<
  FinancialPartyClassification,
  string
> = {
  DONOR: "Doador",
  SUPPORTER: "Apoiador",
  CUSTOMER: "Cliente",
  SPONSOR: "Patrocinador",
  MEMBER: "Membro",
  SUPPLIER: "Fornecedor",
  SERVICE_PROVIDER: "Prestador de serviço",
  EMPLOYEE: "Funcionário",
  MISSIONARY: "Missionário",
  PROJECT_RESPONSIBLE: "Responsável por projeto",
  OTHER: "Outro",
}

export function formatFinancialPartyDocument(
  document: string | null,
  partyType: FinancialPartyType,
) {
  if (!document) {
    return "-"
  }

  const digits = document.replace(/\D/g, "")

  if (
    partyType === "INDIVIDUAL" &&
    digits.length === 11
  ) {
    return digits.replace(
      /^(\d{3})(\d{3})(\d{3})(\d{2})$/,
      "$1.$2.$3-$4",
    )
  }

  if (
    partyType === "LEGAL_ENTITY" &&
    digits.length === 14
  ) {
    return digits.replace(
      /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
      "$1.$2.$3/$4-$5",
    )
  }

  return document
}