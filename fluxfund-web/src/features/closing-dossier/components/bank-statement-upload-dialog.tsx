import axios from "axios"
import { FileText, Upload } from "lucide-react"
import { useRef, useState, type ChangeEvent, type FormEvent } from "react"
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
import { useUploadBankStatementDocument } from "../hooks/use-bank-statement-document-mutations"
import {
  validateBankStatementPdf,
} from "@/features/bank-statement-documents/bank-statement-document-validation"

type BankStatementUploadDialogProps = {
  accountId: string
  accountName: string
  periodStartDate: string
  periodEndDate: string
  onUploaded: () => void
}

export function BankStatementUploadDialog({
  accountId,
  accountName,
  periodStartDate,
  periodEndDate,
  onUploaded,
}: BankStatementUploadDialogProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const [open, setOpen] = useState(false)
  const [file, setFile] = useState<File | null>(null)

  const uploadMutation = useUploadBankStatementDocument()

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
    }
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const selectedFile = event.target.files?.[0] ?? null

    if (!selectedFile) {
      setFile(null)
      return
    }

    const validationError = validateBankStatementPdf(selectedFile)

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
      toast.error("Selecione o PDF do extrato antes de enviar.")
      return
    }

    try {
      await uploadMutation.mutateAsync({
        accountId,
        periodStartDate,
        periodEndDate,
        file,
      })

      toast.success("Extrato bancário enviado com sucesso.")

      resetFile()
      setOpen(false)
      onUploaded()
    } catch (error) {
      if (axios.isAxiosError(error)) {
        toast.error(
          error.response?.data?.message ??
          "Não foi possível enviar o extrato.",
        )
        return
      }

      toast.error("Não foi possível enviar o extrato.")
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Upload className="mr-2 size-4" />
          Enviar extrato
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Enviar extrato bancário</DialogTitle>

          <DialogDescription>
            Envie o PDF oficial de <strong>{accountName}</strong> para o
            período selecionado.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="rounded-lg border bg-muted/40 p-3 text-sm">
            <p className="font-medium">{accountName}</p>
            <p className="mt-1 text-muted-foreground">
              Período: {periodStartDate} até {periodEndDate}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor={`bank-statement-file-${accountId}`}>
              Arquivo PDF
            </Label>

            <Input
              ref={fileInputRef}
              id={`bank-statement-file-${accountId}`}
              type="file"
              accept=".pdf,application/pdf"
              onChange={handleFileChange}
            />

            <p className="text-xs text-muted-foreground">
              Somente PDF oficial do banco, com no máximo 10 MB.
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
              {uploadMutation.isPending ? "Enviando..." : "Enviar extrato"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}