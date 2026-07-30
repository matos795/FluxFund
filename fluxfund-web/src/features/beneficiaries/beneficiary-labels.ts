import type {
    BeneficiaryType,
} from "./beneficiary-types"

export const beneficiaryTypeLabels: Record<
    BeneficiaryType,
    string
> = {
    DONOR: "Doador",
    SUPPORTER: "Apoiador",
    CUSTOMER: "Cliente",
    SPONSOR: "Patrocinador",
    MEMBER: "Membro",
    SUPPLIER: "Fornecedor",
    SERVICE_PROVIDER:
        "Prestador de serviço",
    EMPLOYEE: "Funcionário",
    MISSIONARY: "Missionário",
    PROJECT_RESPONSIBLE:
        "Responsável por Projeto",
    OTHER: "Outro",
}