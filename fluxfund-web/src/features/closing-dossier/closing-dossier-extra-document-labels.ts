import type { ClosingDossierExtraDocumentType } from "./closing-dossier-types"

export const closingDossierExtraDocumentTypeLabels: Record<
  ClosingDossierExtraDocumentType,
  string
> = {
  ACCOUNTS_PAYABLE_REPORT: "Relatório de contas a pagar",
  ACCOUNTS_RECEIVABLE_REPORT: "Relatório de contas a receber",
  MISSIONARY_SUPPORT_REPORT: "Relatório de sustento missionário",
  CIELO_STATEMENT: "Extrato Cielo",
  INVESTMENT_STATEMENT: "Extrato de aplicações",
  OTHER: "Outro documento",
}

export const closingDossierExtraDocumentTypes =
  Object.keys(
    closingDossierExtraDocumentTypeLabels,
  ) as ClosingDossierExtraDocumentType[]