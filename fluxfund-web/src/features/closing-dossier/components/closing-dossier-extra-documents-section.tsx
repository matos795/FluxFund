import {
  Download,
  FileStack,
  FileText,
  Trash2,
} from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

import { ConfirmActionDialog } from "@/components/layout/confirm-action-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { downloadFile } from "@/utils/download-file"
import { getApiErrorMessage } from "@/utils/api-error"

import { downloadClosingDossierExtraDocument } from "../closing-dossier-api"
import { closingDossierExtraDocumentTypeLabels } from "../closing-dossier-extra-document-labels"
import type { ClosingDossierExtraDocument } from "../closing-dossier-types"
import { useDeleteClosingDossierExtraDocument } from "../hooks/use-closing-dossier-extra-document-mutations"
import { useClosingDossierExtraDocuments } from "../hooks/use-closing-dossier-extra-documents"
import { ClosingDossierExtraDocumentUploadDialog } from "./closing-dossier-extra-document-upload-dialog"

type ClosingDossierExtraDocumentsSectionProps = {
  periodStartDate: string
  periodEndDate: string
  canManageDocuments: boolean
}

export function ClosingDossierExtraDocumentsSection({
  periodStartDate,
  periodEndDate,
  canManageDocuments,
}: ClosingDossierExtraDocumentsSectionProps) {
  const [documentToDelete, setDocumentToDelete] =
    useState<ClosingDossierExtraDocument | null>(null)

  const documentsQuery = useClosingDossierExtraDocuments(
    periodStartDate,
    periodEndDate,
  )

  const deleteMutation = useDeleteClosingDossierExtraDocument()

  const documents = documentsQuery.data ?? []

  async function handleDownload(
    document: ClosingDossierExtraDocument,
  ) {
    try {
      const blob = await downloadClosingDossierExtraDocument(document.id)

      downloadFile(blob, document.originalFilename)
    } catch (error) {
      toast.error(
        getApiErrorMessage(
          error,
          "Não foi possível baixar o documento complementar.",
        ),
      )
    }
  }

  async function handleDelete() {
    if (!documentToDelete) {
      return
    }

    try {
      await deleteMutation.mutateAsync(documentToDelete.id)

      toast.success("Documento complementar removido com sucesso.")
      setDocumentToDelete(null)
    } catch (error) {
      toast.error(
        getApiErrorMessage(
          error,
          "Não foi possível remover o documento complementar.",
        ),
      )
    }
  }

  return (
    <>
      <Card className="shadow-sm">
        <CardHeader className="flex flex-col gap-4 space-y-0 md:flex-row md:items-start md:justify-between">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-primary/10 p-3">
              <FileStack className="size-5 text-primary" />
            </div>

            <div>
              <CardTitle>Documentos complementares</CardTitle>

              <p className="mt-1 text-sm text-muted-foreground">
                Relatórios e extratos gerais do fechamento. Eles serão
                incluídos após o sumário e antes das contas.
              </p>
            </div>
          </div>

          {canManageDocuments && (
            <ClosingDossierExtraDocumentUploadDialog
              periodStartDate={periodStartDate}
              periodEndDate={periodEndDate}
            />
          )}
        </CardHeader>

        <CardContent>
          {documentsQuery.isLoading ? (
            <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
              Carregando documentos complementares...
            </div>
          ) : documentsQuery.isError ? (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
              Não foi possível carregar os documentos complementares.
            </div>
          ) : documents.length === 0 ? (
            <div className="rounded-lg border border-dashed p-5 text-sm text-muted-foreground">
              Nenhum documento complementar foi enviado para este período.
            </div>
          ) : (
            <div className="space-y-3">
              {documents.map((document) => (
                <div
                  key={document.id}
                  className="flex flex-col gap-4 rounded-xl border bg-muted/20 p-4 lg:flex-row lg:items-center lg:justify-between"
                >
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="rounded-lg bg-background p-2">
                      <FileText className="size-4 text-muted-foreground" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-sm font-medium">
                          {document.title}
                        </p>

                        <Badge variant="secondary">
                          {
                            closingDossierExtraDocumentTypeLabels[
                              document.documentType
                            ]
                          }
                        </Badge>
                      </div>

                      <p className="mt-1 truncate text-xs text-muted-foreground">
                        {document.originalFilename}
                      </p>

                      <p className="mt-1 text-xs text-muted-foreground">
                        {formatFileSize(document.sizeBytes)} · enviado em{" "}
                        {formatDateTime(document.uploadedAt)}
                      </p>
                    </div>
                  </div>

                  <div className="flex shrink-0 gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownload(document)}
                    >
                      <Download className="mr-2 size-4" />
                      Baixar
                    </Button>

                    {canManageDocuments && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setDocumentToDelete(document)}
                      >
                        <Trash2 className="mr-2 size-4" />
                        Remover
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <ConfirmActionDialog
        open={Boolean(documentToDelete)}
        onOpenChange={(open) => {
          if (!open) {
            setDocumentToDelete(null)
          }
        }}
        title="Remover documento complementar?"
        description={
          <>
            O arquivo{" "}
            <strong>
              {documentToDelete?.originalFilename ?? "selecionado"}
            </strong>{" "}
            será removido e não será incluído em novos Dossiês.
          </>
        }
        confirmLabel="Remover"
        pendingLabel="Removendo..."
        isPending={deleteMutation.isPending}
        isDestructive
        onConfirm={handleDelete}
      />
    </>
  )
}

function formatFileSize(sizeBytes: number) {
  if (sizeBytes < 1024) {
    return `${sizeBytes} B`
  }

  if (sizeBytes < 1024 * 1024) {
    return `${(sizeBytes / 1024).toFixed(1)} KB`
  }

  return `${(sizeBytes / 1024 / 1024).toFixed(1)} MB`
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value))
}