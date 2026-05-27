export type AttachmentType =
  | "RECEIPT"
  | "INVOICE"
  | "PROOF_OF_PAYMENT"
  | "CONTRACT"
  | "OTHER"

export type Attachment = {
  id: string
  type: AttachmentType
  originalFilename: string
  contentType: string | null
  sizeBytes: number | null
  uploadedAt: string
  createdAt: string
  updatedAt: string | null
}