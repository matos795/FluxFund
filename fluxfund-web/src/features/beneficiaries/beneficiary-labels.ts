import type { BeneficiaryType } from "./beneficiary-types";

export const beneficiaryTypeLabels: Record<BeneficiaryType, string> = {
    MISSIONARY: "Missionário",
    SUPPLIER: "Fornecedor",
    EMPLOYEE: "Funcionário",
    PROJECT_RESPONSIBLE: "Responsável por Projeto",
    OTHER: "Outro"
}