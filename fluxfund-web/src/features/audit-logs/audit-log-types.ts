export type AuditAction =
  | "CREATE"
  | "UPDATE"
  | "CANCEL"
  | "CLASSIFY"
  | "ADD_ALLOCATION"
  | "UPDATE_ALLOCATION"
  | "REMOVE_ALLOCATION"
  | "UPLOAD_ATTACHMENT"
  | "DELETE_ATTACHMENT"
  | "ACTIVATE"
  | "DEACTIVATE"
  | "CHANGE_DEFAULT_FUND"
  | "IMPORT_OFX"
  | "CHANGE_ROLE"
  | "REGENERATE_INVITATION"
  | "ACCEPT_INVITATION"

export type AuditEntityType =
  | "FINANCIAL_TRANSACTION"
  | "TRANSACTION_ALLOCATION"
  | "ATTACHMENT"
  | "SUPPORT_AGREEMENT"
  | "ORGANIZATION_SETTINGS"
  | "OFX_IMPORT"
  | "FUND"
  | "ORGANIZATION_USER"
  | "ORGANIZATION_USER_INVITATION"

export type AuditLog = {
  id: string
  organizationId: string
  actorUserId: string
  actorName: string | null
  actorEmail: string | null
  entityType: AuditEntityType
  entityId: string
  action: AuditAction
  description: string | null
  createdAt: string
}