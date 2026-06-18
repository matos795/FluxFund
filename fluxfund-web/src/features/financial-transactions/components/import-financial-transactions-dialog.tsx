import { useMemo, useState } from "react"
import { FileSpreadsheet, Upload } from "lucide-react"
import { toast } from "sonner"

import {
  AppDialogBody,
  AppDialogContent,
  AppDialogFooter,
  AppDialogHeader,
} from "@/components/layout/app-dialog"
import { EntityCombobox } from "@/components/form/entity-combobox"
import { Button } from "@/components/ui/button"
import { Dialog, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { cn } from "@/lib/utils"
import { getApiErrorMessage } from "@/utils/api-error"
import type { ImportProfile } from "@/utils/imports/import-profile"
import { useAccounts } from "@/features/accounts/hooks/use-accounts"
import { useImportCsvFile } from "../hooks/use-import-csv-file"
import { useImportOfxFile } from "../hooks/use-import-ofx-file"

type ImportKind = "OFX_BANK_STATEMENT" | "MERCADO_PAGO_ACCOUNT_CSV"

type ImportOption = {
  value: ImportKind
  title: string
  description: string
  accept: string
  fileLabel: string
}

const importOptions: ImportOption[] = [
  {
    value: "OFX_BANK_STATEMENT",
    title: "OFX bancário",
    description:
      "Use para extratos bancários em OFX exportados por bancos tradicionais.",
    accept: ".ofx",
    fileLabel: "Arquivo OFX",
  },
  {
    value: "MERCADO_PAGO_ACCOUNT_CSV",
    title: "CSV Mercado Pago",
    description:
      "Use para extratos CSV da conta Mercado Pago. As linhas entram como transações baixadas.",
    accept: ".csv",
    fileLabel: "Arquivo CSV",
  },
]

export function ImportFinancialTransactionsDialog() {
  const [open, setOpen] = useState(false)
  const [importKind, setImportKind] =
    useState<ImportKind>("OFX_BANK_STATEMENT")
  const [accountId, setAccountId] = useState("")
  const [file, setFile] = useState<File | null>(null)

  const accountsQuery = useAccounts({ page: 0, size: 200 })
  const importOfxFile = useImportOfxFile()
  const importCsvFile = useImportCsvFile()

  const selectedOption = importOptions.find(
    (option) => option.value === importKind,
  ) ?? importOptions[0]

  const isImporting = importOfxFile.isPending || importCsvFile.isPending

  const bankAccounts = useMemo(() => {
    return (
      accountsQuery.data?.content.filter(
        (account) => account.type !== "CREDIT_CARD",
      ) ?? []
    )
  }, [accountsQuery.data?.content])

  function handleOpenChange(value: boolean) {
    if (!value) {
      resetForm()
    }

    setOpen(value)
  }

  function resetForm() {
    setImportKind("OFX_BANK_STATEMENT")
    setAccountId("")
    setFile(null)
  }

  function handleImportKindChange(value: string) {
    setImportKind(value as ImportKind)
    setFile(null)
  }

  function getCsvProfile(kind: ImportKind): ImportProfile {
    if (kind === "MERCADO_PAGO_ACCOUNT_CSV") {
      return "MERCADO_PAGO_ACCOUNT_CSV"
    }

    return "MERCADO_PAGO_ACCOUNT_CSV"
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!accountId) {
      toast.error("Selecione a conta do extrato.")
      return
    }

    if (!file) {
      toast.error("Selecione o arquivo para importação.")
      return
    }

    if (importKind === "OFX_BANK_STATEMENT") {
      importOfxFile.mutate(
        {
          accountId,
          file,
        },
        {
          onSuccess: (response) => {
            toast.success(
              `OFX importado: ${response.imported} importadas, ${response.ignoredDuplicates} duplicadas ignoradas.`,
            )

            if (response.failed > 0) {
              toast.warning(
                `${response.failed} transações falharam na importação.`,
              )
            }

            handleOpenChange(false)
          },
          onError: (error) => {
            toast.error(
              getApiErrorMessage(
                error,
                "Não foi possível importar o arquivo OFX.",
              ),
            )
          },
        },
      )

      return
    }

    importCsvFile.mutate(
      {
        accountId,
        profile: getCsvProfile(importKind),
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
          <Upload className="mr-2 size-4" />
          Importar extrato
        </Button>
      </DialogTrigger>

      <AppDialogContent size="lg">
        <AppDialogHeader
          icon={<Upload className="size-4 text-muted-foreground" />}
          title="Importar extrato"
          description="Escolha o tipo de arquivo, selecione a conta e envie o extrato financeiro."
        />

        <form onSubmit={handleSubmit} className="contents">
          <AppDialogBody className="space-y-5">
            <div className="space-y-3">
              <Label>Tipo de importação</Label>

              <RadioGroup
                value={importKind}
                onValueChange={handleImportKindChange}
                className="grid gap-3 md:grid-cols-2"
              >
                {importOptions.map((option) => {
                  const selected = importKind === option.value
                  const optionId = `import-kind-${option.value}`

                  return (
                    <Label
                      key={option.value}
                      htmlFor={optionId}
                      className={cn(
                        "flex cursor-pointer items-start gap-3 rounded-xl border bg-background p-4 text-sm transition-colors hover:bg-muted/50",
                        selected && "border-primary bg-primary/5",
                      )}
                    >
                      <RadioGroupItem
                        id={optionId}
                        value={option.value}
                        className="mt-0.5"
                      />

                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <FileSpreadsheet className="size-4 text-muted-foreground" />
                          <p className="font-medium leading-none">
                            {option.title}
                          </p>
                        </div>

                        <p className="text-xs leading-relaxed text-muted-foreground">
                          {option.description}
                        </p>
                      </div>
                    </Label>
                  )
                })}
              </RadioGroup>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Conta do extrato</Label>

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

                <p className="text-xs text-muted-foreground">
                  Selecione a conta real de onde o extrato foi exportado.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="statementFile">{selectedOption.fileLabel}</Label>

                <Input
                  key={importKind}
                  id="statementFile"
                  type="file"
                  accept={selectedOption.accept}
                  onChange={(event) => {
                    setFile(event.target.files?.[0] ?? null)
                  }}
                />

                {file ? (
                  <p className="text-xs text-muted-foreground">
                    Arquivo selecionado: {file.name}
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Formatos aceitos: {selectedOption.accept}
                  </p>
                )}
              </div>
            </div>

            <div className="rounded-xl border bg-muted/30 p-3 text-xs text-muted-foreground">
              As transações importadas entram no sistema como lançamentos
              pendentes de classificação, quando aplicável. Depois você pode
              revisar categoria, fundos, anexos e documentação.
            </div>
          </AppDialogBody>

          <AppDialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={isImporting}
              onClick={() => handleOpenChange(false)}
            >
              Cancelar
            </Button>

            <Button type="submit" disabled={isImporting}>
              {isImporting ? "Importando..." : "Importar"}
            </Button>
          </AppDialogFooter>
        </form>
      </AppDialogContent>
    </Dialog>
  )
}