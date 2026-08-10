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

export const financialPartyClassificationDescriptions:
  Record<
    FinancialPartyClassification,
    string
  > = {
  DONOR:
    "Pessoa ou empresa que realiza doações pontuais, ofertas ou contribuições sem contrapartida.",

  SUPPORTER:
    "Pessoa ou organização que mantém apoio recorrente, como uma contribuição mensal ou um compromisso contínuo.",

  CUSTOMER:
    "Pessoa ou empresa que paga por produtos, inscrições ou serviços oferecidos pela organização.",

  SPONSOR:
    "Parceiro que financia uma ação ou projeto por meio de patrocínio formal, normalmente com acordo ou contrapartida.",

  MEMBER:
    "Pessoa vinculada à organização ou igreja na condição de membro.",

  SUPPLIER:
    "Pessoa ou empresa que fornece produtos, materiais ou mercadorias para a organização.",

  SERVICE_PROVIDER:
    "Profissional ou empresa contratada para realizar um serviço.",

  EMPLOYEE:
    "Pessoa que recebe salário ou outros pagamentos relacionados a um vínculo de trabalho.",

  MISSIONARY:
    "Missionário que recebe sustento, repasses ou recursos destinados ao seu trabalho.",

  PROJECT_RESPONSIBLE:
    "Pessoa responsável por administrar ou receber recursos destinados a um projeto.",

  OTHER:
    "Use quando nenhuma das classificações anteriores representar corretamente o relacionamento.",
}

export const financialPartyClassificationSearchTerms:
  Record<
    FinancialPartyClassification,
    string
  > = {
  DONOR:
    "doacao doador oferta ofertante eventual pontual contribuicao",

  SUPPORTER:
    "apoio apoiador mantenedor mensal recorrente parceiro contribuinte",

  CUSTOMER:
    "cliente compra venda produto inscricao mensalidade",

  SPONSOR:
    "patrocinio patrocinador parceria marca contrapartida",

  MEMBER:
    "membro igreja associado congregado",

  SUPPLIER:
    "fornecedor produto material mercadoria compra",

  SERVICE_PROVIDER:
    "prestador servico autonomo terceirizado honorario",

  EMPLOYEE:
    "funcionario colaborador empregado salario folha",

  MISSIONARY:
    "missionario sustento repasse campo missionario",

  PROJECT_RESPONSIBLE:
    "projeto responsavel gestor coordenador destinatario",

  OTHER:
    "outro diversos sem classificacao",
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