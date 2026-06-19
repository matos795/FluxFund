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
}

export const auditEntityTypeLabels: Record<AuditEntityType, string> = {
  FINANCIAL_TRANSACTION: "Transação financeira",
  TRANSACTION_ALLOCATION: "Alocação",
  ATTACHMENT: "Anexo",
  SUPPORT_AGREEMENT: "Compromisso",
  ORGANIZATION_SETTINGS: "Configurações",
  OFX_IMPORT: "Importação OFX",
  FUND: "Fundo",
}