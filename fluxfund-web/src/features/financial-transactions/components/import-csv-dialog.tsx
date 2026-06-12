import { FileText } from "lucide-react"
import { useMemo, useState } from "react"
import { toast } from "sonner"

import { EntityCombobox } from "@/components/form/entity-combobox"
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
import { useAccounts } from "@/features/accounts/hooks/use-accounts"
import { getApiErrorMessage } from "@/utils/api-error"
import { useImportCsvFile } from "../hooks/use-import-csv-file"

export function ImportCsvDialog() {
  const [open, setOpen] = useState(false)
  const [accountId, setAccountId] = useState("")
  const [file, setFile] = useState<File | null>(null)

  const accountsQuery = useAccounts({ page: 0, size: 200 })
  const importCsvFile = useImportCsvFile()

  const bankAccounts = useMemo(() => {
    return (
      accountsQuery.data?.content.filter(
        (account) => account.type !== "CREDIT_CARD",
      ) ?? []
    )
  }, [accountsQuery.data?.content])

  function handleOpenChange(value: boolean) {
    if (!value) {
      setAccountId("")
      setFile(null)
    }

    setOpen(value)
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!accountId) {
      toast.error("Selecione a conta do extrato.")
      return
    }

    if (!file) {
      toast.error("Selecione o arquivo CSV.")
      return
    }

    importCsvFile.mutate(
      {
        accountId,
        profile: "MERCADO_PAGO_ACCOUNT_CSV",
        file,
      },
      {
        onSuccess: (response) => {
          toast.success(
            `CSV importado: ${response.imported} transações importadas, ${response.ignoredDuplicates} duplicadas ignoradas.`,
          )

          if (response.failed > 0) {
            toast.warning(`${response.failed} linhas falharam na importação.`)
          }

          handleOpenChange(false)
        },
        onError: (error) => {
          toast.error(
            getApiErrorMessage(error, "Não foi possível importar o CSV."),
          )
        },
      },
    )
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <FileText className="mr-2 size-4" />
          Importar CSV
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Importar CSV bancário</DialogTitle>
          <DialogDescription>
            Selecione a conta Mercado Pago e envie o extrato CSV. As linhas serão importadas como transações baixadas, aguardando classificação.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label>Conta</Label>
            <EntityCombobox
              value={accountId}
              options={bankAccounts.map((account) => ({
                value: account.id,
                label: account.bankName
                  ? `${account.name} · ${account.bankName}`
                  : account.name,
              }))}
              placeholder="Selecione a conta"
              searchPlaceholder="Buscar conta..."
              emptyMessage="Nenhuma conta bancária encontrada."
              onChange={setAccountId}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="csvFile">Arquivo CSV</Label>
            <Input
              id="csvFile"
              type="file"
              accept=".csv"
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

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={importCsvFile.isPending}
              onClick={() => handleOpenChange(false)}
            >
              Cancelar
            </Button>

            <Button type="submit" disabled={importCsvFile.isPending}>
              {importCsvFile.isPending ? "Importando..." : "Importar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}