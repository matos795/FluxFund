import type { AuditAction, AuditEntityType } from "./audit-log-types"

export const auditActionLabels: Record<AuditAction, string> = {
  CREATE: "Criação",
  UPDATE: "Atualização",
  CANCEL: "Cancelamento",
  CLASSIFY: "Classificação",

  ADD_ALLOCATION: "Alocação adicionada",
  UPDATE_ALLOCATION: "Alocação alterada",
  REMOVE_ALLOCATION: "Alocação removida",

  UPLOAD_ATTACHMENT: "Anexo enviado",
  DELETE_ATTACHMENT: "Anexo removido",

  ACTIVATE: "Ativação",
  DEACTIVATE: "Desativação",

  CHANGE_DEFAULT_FUND: "Fundo padrão alterado",

  IMPORT_OFX: "Importação OFX",

  UPLOAD_BANK_STATEMENT_DOCUMENT:
    "Extrato bancário enviado",

  DELETE_BANK_STATEMENT_DOCUMENT:
    "Extrato bancário removido",

  GENERATE_CLOSING_DOSSIER:
    "Dossiê de fechamento gerado",

  UPLOAD_CLOSING_DOSSIER_EXTRA_DOCUMENT:
    "Documento extra do Dossiê enviado",

  UPDATE_CLOSING_DOSSIER_EXTRA_DOCUMENT:
    "Documento extra do Dossiê alterado",

  DELETE_CLOSING_DOSSIER_EXTRA_DOCUMENT:
    "Documento extra do Dossiê removido",

  UPLOAD_CREDIT_CARD_STATEMENT_PDF:
    "PDF da fatura enviado",

  DELETE_CREDIT_CARD_STATEMENT_PDF:
    "PDF da fatura removido",

  UPLOAD_ORGANIZATION_LOGO:
    "Logo da organização enviada",

  DELETE_ORGANIZATION_LOGO:
    "Logo da organização removida",

  CHANGE_ROLE:
    "Papel de acesso alterado",

  REGENERATE_INVITATION:
    "Link de convite regenerado",

  ACCEPT_INVITATION:
    "Convite aceito",

  DELETE_RECEIPT_DRAFT:
    "Rascunho de recibo removido",

  ISSUE_RECEIPT:
    "Recibo emitido",

  CANCEL_RECEIPT:
    "Recibo cancelado",

  REISSUE_RECEIPT:
    "Reemissão de recibo iniciada",
}

export const auditEntityTypeLabels: Record<
  AuditEntityType,
  string
> = {
  FINANCIAL_TRANSACTION:
    "Transação financeira",

  TRANSACTION_ALLOCATION:
    "Alocação",

  FINANCIAL_PARTY:
    "Contato financeiro",

  ATTACHMENT:
    "Anexo",

  FINANCIAL_COMMITMENT:
    "Compromisso financeiro",

  SUPPORT_AGREEMENT:
    "Compromisso",

  ORGANIZATION_SETTINGS:
    "Configurações",

  OFX_IMPORT:
    "Importação OFX",

  FUND:
    "Fundo",

  BANK_STATEMENT_DOCUMENT:
    "Extrato bancário",

  CREDIT_CARD_STATEMENT:
    "Fatura de cartão",

  CLOSING_DOSSIER:
    "Dossiê de fechamento",

  CLOSING_DOSSIER_EXTRA_DOCUMENT:
    "Documento extra do Dossiê",

  ORGANIZATION:
    "Organização",

  ORGANIZATION_USER:
    "Usuário da organização",

  ORGANIZATION_USER_INVITATION:
    "Convite de acesso",

  RECEIPT:
    "Recibo",
}

export function getAuditActionLabel(
  action: string,
) {
  return (
    auditActionLabels[action as AuditAction] ??
    `Ação não mapeada (${action})`
  )
}

export function getAuditEntityTypeLabel(
  entityType: string,
) {
  return (
    auditEntityTypeLabels[
    entityType as AuditEntityType
    ] ??
    `Entidade não mapeada (${entityType})`
  )
}