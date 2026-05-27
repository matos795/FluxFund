import type { AttachmentType } from "./attachment-types"

export const attachmentTypeLabels: Record<AttachmentType, string> = {
  RECEIPT: "Recibo",
  INVOICE: "Nota fiscal",
  PROOF_OF_PAYMENT: "Comprovante",
  CONTRACT: "Contrato",
  OTHER: "Outro",
}