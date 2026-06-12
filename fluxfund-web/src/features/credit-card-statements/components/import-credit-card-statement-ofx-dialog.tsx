import { FileUp } from "lucide-react"
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
import { useImportCreditCardStatementOfx } from "../hooks/use-import-credit-card-statement-ofx"

type ImportCreditCardStatementOfxDialogProps = {
  statement: CreditCardStatement
}

export function ImportCreditCardStatementOfxDialog({
  statement,
}: ImportCreditCardStatementOfxDialogProps) {
  const [open, setOpen] = useState(false)
  const [file, setFile] = useState<File | null>(null)

  const importMutation = useImportCreditCardStatementOfx()

  const canImport = statement.status === "OPEN" || statement.status === "CLOSED"

  function handleOpenChange(value: boolean) {
    if (!value) {
      setFile(null)
    }

    setOpen(value)
  }

  function handleImport(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!file) {
      toast.error("Selecione um arquivo OFX.")
      return
    }

    importMutation.mutate(
      {
        statementId: statement.id,
        file,
      },
      {
        onSuccess: (result) => {
          toast.success(
            `Importação concluída: ${result.imported} importados, ${result.ignoredDuplicates} duplicados, ${result.failed} falhas.`,
          )

          if (result.errors.length > 0) {
            toast.warning("Alguns itens não foram importados. Veja os detalhes no retorno da API.")
          }

          handleOpenChange(false)
        },
        onError: (error) => {
          toast.error(
            getApiErrorMessage(error, "Não foi possível importar o OFX da fatura."),
          )
        },
      },
    )
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" disabled={!canImport}>
          <FileUp className="mr-2 size-4" />
          Importar OFX
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Importar OFX da fatura</DialogTitle>
          <DialogDescription>
            Importe o extrato do cartão dentro desta fatura. Os itens serão criados como despesas de cartão pendentes e poderão ser classificados depois.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleImport} className="space-y-4">
          <div className="rounded-lg border bg-muted/40 p-3 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">{statement.name}</p>
            <p>
              Cartão: {statement.creditCardAccount?.name ?? "-"}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="ofxFile">Arquivo OFX</Label>
            <Input
              id="ofxFile"
              type="file"
              accept=".ofx"
              onChange={(event) => {
                setFile(event.target.files?.[0] ?? null)
              }}
            />
          </div>

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