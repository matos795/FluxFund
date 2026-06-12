import { FileSpreadsheet } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { getApiErrorMessage } from "@/utils/api-error"
import type { CreditCardStatement } from "../credit-card-statement-types"
import { useImportCreditCardStatementFile } from "../hooks/use-import-credit-card-statement-file"

type ImportCreditCardStatementFileDialogProps = {
  statement: CreditCardStatement
}

export function ImportCreditCardStatementFileDialog({
  statement,
}: ImportCreditCardStatementFileDialogProps) {
  const [open, setOpen] = useState(false)
  const [file, setFile] = useState<File | null>(null)

  const importMutation = useImportCreditCardStatementFile()

  const canImport = statement.status === "OPEN" || statement.status === "CLOSED"

  function handleOpenChange(value: boolean) {
    if (!value) {
      setFile(null)
    }

    setOpen(value)
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!file) {
      toast.error("Selecione a planilha da fatura.")
      return
    }

    importMutation.mutate(
      {
        statementId: statement.id,
        profile: "BRADESCO_CREDIT_CARD_XLSX",
        file,
      },
      {
        onSuccess: (result) => {
          toast.success(
            `Planilha importada: ${result.importedCount} itens importados, ${result.ignoredDuplicateCount} duplicados, ${result.failedCount} falhas.`,
          )

          if (result.errors.length > 0) {
            toast.warning("Algumas linhas não foram importadas.")
          }

          handleOpenChange(false)
        },
        onError: (error) => {
          toast.error(
            getApiErrorMessage(
              error,
              "Não foi possível importar a planilha da fatura.",
            ),
          )
        },
      },
    )
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" disabled={!canImport}>
          <FileSpreadsheet className="mr-2 size-4" />
          Importar planilha
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Importar planilha da fatura</DialogTitle>
          <DialogDescription>
            Envie a planilha XLSX exportada pelo Bradesco. Os lançamentos serão criados como itens pendentes da fatura.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="rounded-lg border bg-muted/40 p-3 text-sm">
            <p className="font-medium">{statement.name}</p>
            <p className="text-muted-foreground">
              Cartão: {statement.creditCardAccount?.name ?? "-"}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="statementFile">Planilha XLSX</Label>
            <Input
              id="statementFile"
              type="file"
              accept=".xlsx"
              onChange={(event) => {
                setFile(event.target.files?.[0] ?? null)
              }}
            />
          </div>

          {file && (
            <p className="text-sm text-muted-foreground">
              Arquivo selecionado: {file.name}
            </p>
          )}

          <div className="flex flex-col-reverse gap-2 border-t pt-4 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="ghost"
              disabled={importMutation.isPending}
              onClick={() => handleOpenChange(false)}
            >
              Cancelar
            </Button>

            <Button type="submit" disabled={importMutation.isPending}>
              {importMutation.isPending ? "Importando..." : "Importar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}