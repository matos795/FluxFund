import axios from "axios"
import { FileText, Upload } from "lucide-react"
import {
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { closingDossierExtraDocumentTypeLabels } from "../closing-dossier-extra-document-labels"
import type { ClosingDossierExtraDocumentType } from "../closing-dossier-types"
import { validateClosingDossierExtraDocument } from "../closing-dossier-extra-document-validation"
import { useUploadClosingDossierExtraDocument } from "../hooks/use-closing-dossier-extra-document-mutations"

const DEFAULT_DOCUMENT_TYPE: ClosingDossierExtraDocumentType =
  "ACCOUNTS_PAYABLE_REPORT"

type ClosingDossierExtraDocumentUploadDialogProps = {
  periodStartDate: string
  periodEndDate: string
}

export function ClosingDossierExtraDocumentUploadDialog({
  periodStartDate,
  periodEndDate,
}: ClosingDossierExtraDocumentUploadDialogProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const [open, setOpen] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [documentType, setDocumentType] =
    useState<ClosingDossierExtraDocumentType>(DEFAULT_DOCUMENT_TYPE)
  const [title, setTitle] = useState("")

  const uploadMutation = useUploadClosingDossierExtraDocument()

  function resetForm() {
    setFile(null)
    setDocumentType(DEFAULT_DOCUMENT_TYPE)
    setTitle("")

    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen)

    if (!nextOpen) {
      resetForm()
    }
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const selectedFile = event.target.files?.[0] ?? null

    if (!selectedFile) {
      setFile(null)
      return
    }

    const validationError =
      validateClosingDossierExtraDocument(selectedFile)

    if (validationError) {
      toast.error(validationError)

      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }

      setFile(null)
      return
    }

    setFile(selectedFile)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const normalizedTitle = title.trim()

    if (!normalizedTitle) {
      toast.error("Informe um título para o documento.")
      return
    }

    if (!file) {
      toast.error("Selecione o PDF antes de enviar.")
      return
    }

    try {
      await uploadMutation.mutateAsync({
        periodStartDate,
        periodEndDate,
        documentType,
        title: normalizedTitle,
        file,
      })

      toast.success("Documento complementar enviado com sucesso.")

      handleOpenChange(false)
    } catch (error) {
      if (axios.isAxiosError(error)) {
        toast.error(
          error.response?.data?.message ??
            "Não foi possível enviar o documento complementar.",
        )
        return
      }

      toast.error("Não foi possível enviar o documento complementar.")
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Upload className="mr-2 size-4" />
          Adicionar documento
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Documento complementar</DialogTitle>

          <DialogDescription>
            O arquivo será incluído após o sumário e antes das contas no PDF
            do Dossiê.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="rounded-lg border bg-muted/40 p-3 text-sm">
            <p className="font-medium">Período do fechamento</p>

            <p className="mt-1 text-muted-foreground">
              {periodStartDate} até {periodEndDate}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="closing-dossier-extra-document-type">
              Tipo do documento
            </Label>

            <Select
              value={documentType}
              onValueChange={(value) =>
                setDocumentType(
                  value as ClosingDossierExtraDocumentType,
                )
              }
            >
              <SelectTrigger id="closing-dossier-extra-document-type">
                <SelectValue />
              </SelectTrigger>

              <SelectContent>
                {Object.entries(
                  closingDossierExtraDocumentTypeLabels,
                ).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="closing-dossier-extra-document-title">
              Título exibido no Dossiê
            </Label>

            <Input
              id="closing-dossier-extra-document-title"
              value={title}
              maxLength={180}
              placeholder="Ex.: Extrato de aplicações Bradesco — Maio/2026"
              onChange={(event) => setTitle(event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="closing-dossier-extra-document-file">
              Arquivo PDF
            </Label>

            <Input
              ref={fileInputRef}
              id="closing-dossier-extra-document-file"
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

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
            >
              Cancelar
            </Button>

            <Button type="submit" disabled={uploadMutation.isPending}>
              <Upload className="mr-2 size-4" />

              {uploadMutation.isPending
                ? "Enviando..."
                : "Enviar documento"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}