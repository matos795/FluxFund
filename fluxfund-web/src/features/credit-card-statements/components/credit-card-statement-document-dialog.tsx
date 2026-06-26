import {
  Download,
  FileText,
  Trash2,
  Upload,
} from "lucide-react"
import {
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react"
import { toast } from "sonner"

import {
  AppDialogBody,
  AppDialogContent,
  AppDialogFooter,
  AppDialogHeader,
} from "@/components/layout/app-dialog"
import { ConfirmActionDialog } from "@/components/layout/confirm-action-dialog"
import { Button } from "@/components/ui/button"
import { Dialog, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { getApiErrorMessage } from "@/utils/api-error"
import { downloadFile } from "@/utils/download-file"

import {
  downloadCreditCardStatementDocument,
} from "../credit-card-statement-api"
import { validateCreditCardStatementDocument } from "../credit-card-statement-document-validation"
import type { CreditCardStatement } from "../credit-card-statement-types"
import {
  useDeleteCreditCardStatementDocument,
  useUploadCreditCardStatementDocument,
} from "../hooks/use-credit-card-statement-document-mutations"

type CreditCardStatementDocumentDialogProps = {
  statement: CreditCardStatement
  canManageDocuments: boolean
}

export function CreditCardStatementDocumentDialog({
  statement,
  canManageDocuments,
}: CreditCardStatementDocumentDialogProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const [open, setOpen] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [deleteConfirmationOpen, setDeleteConfirmationOpen] =
    useState(false)

  const uploadMutation = useUploadCreditCardStatementDocument()
  const deleteMutation = useDeleteCreditCardStatementDocument()

  const document = statement.statementDocument

  function resetFile() {
    setFile(null)

    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen)

    if (!nextOpen) {
      resetFile()
      setDeleteConfirmationOpen(false)
    }
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const selectedFile = event.target.files?.[0] ?? null

    if (!selectedFile) {
      setFile(null)
      return
    }

    const validationError =
      validateCreditCardStatementDocument(selectedFile)

    if (validationError) {
      toast.error(validationError)
      resetFile()
      return
    }

    setFile(selectedFile)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!file) {
      toast.error("Selecione o PDF oficial da fatura antes de enviar.")
      return
    }

    try {
      await uploadMutation.mutateAsync({
        statementId: statement.id,
        file,
      })

      toast.success(
        document
          ? "PDF oficial da fatura substituído com sucesso."
          : "PDF oficial da fatura enviado com sucesso.",
      )

      handleOpenChange(false)
    } catch (error) {
      toast.error(
        getApiErrorMessage(
          error,
          "Não foi possível enviar o PDF da fatura.",
        ),
      )
    }
  }

  async function handleDownload() {
    if (!document) {
      return
    }

    try {
      const blob = await downloadCreditCardStatementDocument(statement.id)

      downloadFile(blob, document.originalFilename)
    } catch (error) {
      toast.error(
        getApiErrorMessage(
          error,
          "Não foi possível baixar o PDF da fatura.",
        ),
      )
    }
  }

  async function handleDelete() {
    if (!document) {
      return
    }

    try {
      await deleteMutation.mutateAsync(statement.id)

      toast.success("PDF oficial da fatura removido com sucesso.")

      setDeleteConfirmationOpen(false)
      handleOpenChange(false)
    } catch (error) {
      toast.error(
        getApiErrorMessage(
          error,
          "Não foi possível remover o PDF da fatura.",
        ),
      )
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild>
          <Button size="sm" variant="outline">
            <FileText className="mr-2 size-4" />
            PDF
          </Button>
        </DialogTrigger>

        <AppDialogContent size="md">
          <AppDialogHeader
            icon={<FileText className="size-4 text-muted-foreground" />}
            title="PDF oficial da fatura"
            description="O PDF será incluído no Dossiê quando esta fatura for paga."
          />

          <form onSubmit={handleSubmit} className="contents">
            <AppDialogBody className="space-y-5">
              <div className="rounded-xl border bg-muted/40 p-4 text-sm">
                <p className="font-medium">{statement.name}</p>

                <p className="mt-1 text-muted-foreground">
                  Cartão: {statement.creditCardAccount.name}
                </p>

                <p className="text-muted-foreground">
                  Vencimento: {statement.dueDate}
                </p>
              </div>

              {document ? (
                <section className="rounded-xl border bg-background p-4">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex min-w-0 items-start gap-3">
                      <div className="rounded-lg bg-muted p-2">
                        <FileText className="size-4 text-muted-foreground" />
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {document.originalFilename}
                        </p>

                        <p className="mt-1 text-xs text-muted-foreground">
                          {formatFileSize(document.sizeBytes)} · enviado em{" "}
                          {formatDateTime(document.uploadedAt)}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={handleDownload}
                      >
                        <Download className="mr-2 size-4" />
                        Baixar
                      </Button>

                      {canManageDocuments && (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="text-destructive hover:text-destructive"
                          onClick={() => setDeleteConfirmationOpen(true)}
                        >
                          <Trash2 className="mr-2 size-4" />
                          Remover
                        </Button>
                      )}
                    </div>
                  </div>
                </section>
              ) : (
                <div className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
                  Nenhum PDF oficial foi enviado para esta fatura.
                </div>
              )}

              {canManageDocuments && (
                <div className="space-y-2">
                  <Label htmlFor={`credit-card-statement-pdf-${statement.id}`}>
                    {document
                      ? "Substituir PDF oficial"
                      : "Selecionar PDF oficial"}
                  </Label>

                  <Input
                    ref={fileInputRef}
                    id={`credit-card-statement-pdf-${statement.id}`}
                    type="file"
                    accept=".pdf,application/pdf"
                    onChange={handleFileChange}
                  />

                  <p className="text-xs text-muted-foreground">
                    Somente PDF, com no máximo 10 MB.
                  </p>

                  {file && (
                    <div className="flex items-center gap-2 rounded-lg border bg-muted/40 p-3 text-sm">
                      <FileText className="size-4 text-muted-foreground" />
                      <span className="truncate font-medium">{file.name}</span>
                    </div>
                  )}
                </div>
              )}
            </AppDialogBody>

            <AppDialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
              >
                Fechar
              </Button>

              {canManageDocuments && (
                <Button
                  type="submit"
                  disabled={!file || uploadMutation.isPending}
                >
                  <Upload className="mr-2 size-4" />

                  {uploadMutation.isPending
                    ? "Enviando..."
                    : document
                      ? "Substituir PDF"
                      : "Enviar PDF"}
                </Button>
              )}
            </AppDialogFooter>
          </form>
        </AppDialogContent>
      </Dialog>

      <ConfirmActionDialog
        open={deleteConfirmationOpen}
        onOpenChange={setDeleteConfirmationOpen}
        title="Remover PDF da fatura?"
        description={
          <>
            O PDF <strong>{document?.originalFilename}</strong> será removido
            desta fatura e não será incluído em novos Dossiês.
          </>
        }
        confirmLabel="Remover PDF"
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