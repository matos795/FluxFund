import { httpClient } from "@/api/http-client"
import type {
  ClosingDossierExtraDocument,
  ClosingDossierExtraDocumentType,
  ClosingDossierPreview,
  ClosingDossierPreviewRequest,
} from "./closing-dossier-types"

export async function previewClosingDossier(
  data: ClosingDossierPreviewRequest,
) {
  const response = await httpClient.post<ClosingDossierPreview>(
    "/api/v1/reports/closing-dossier/preview",
    data,
  )

  return response.data
}

export async function exportClosingDossierPdf(
  data: ClosingDossierPreviewRequest,
) {
  const response = await httpClient.post<Blob>(
    "/api/v1/reports/closing-dossier/export.pdf",
    data,
    {
      responseType: "blob",
    },
  )

  return response.data
}

export async function getClosingDossierExtraDocuments({
  periodStartDate,
  periodEndDate,
}: {
  periodStartDate: string
  periodEndDate: string
}) {
  const response = await httpClient.get<ClosingDossierExtraDocument[]>(
    "/api/v1/closing-dossier-extra-documents",
    {
      params: {
        periodStartDate,
        periodEndDate,
      },
    },
  )

  return response.data
}

export async function uploadClosingDossierExtraDocument({
  periodStartDate,
  periodEndDate,
  documentType,
  title,
  sortOrder,
  file,
}: {
  periodStartDate: string
  periodEndDate: string
  documentType: ClosingDossierExtraDocumentType
  title: string
  sortOrder?: number
  file: File
}) {
  const formData = new FormData()

  formData.append("periodStartDate", periodStartDate)
  formData.append("periodEndDate", periodEndDate)
  formData.append("documentType", documentType)
  formData.append("title", title)
  formData.append("file", file)

  if (sortOrder !== undefined) {
    formData.append("sortOrder", String(sortOrder))
  }

  const response = await httpClient.post<ClosingDossierExtraDocument>(
    "/api/v1/closing-dossier-extra-documents",
    formData,
  )

  return response.data
}

export async function downloadClosingDossierExtraDocument(
  documentId: string,
) {
  const response = await httpClient.get<Blob>(
    `/api/v1/closing-dossier-extra-documents/${documentId}/download`,
    {
      responseType: "blob",
    },
  )

  return response.data
}

export async function deleteClosingDossierExtraDocument(
  documentId: string,
) {
  await httpClient.delete(
    `/api/v1/closing-dossier-extra-documents/${documentId}`,
  )
}