import { FileSpreadsheet, FileUp, Upload } from "lucide-react"
import { useState, type ReactNode } from "react"
import { toast } from "sonner"

import {
    AppDialogBody,
    AppDialogContent,
    AppDialogFooter,
    AppDialogHeader,
} from "@/components/layout/app-dialog"
import { Button } from "@/components/ui/button"
import { Dialog, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { cn } from "@/lib/utils"
import { getApiErrorMessage } from "@/utils/api-error"
import type { ImportProfile } from "@/utils/imports/import-profile"
import type { CreditCardStatement } from "../credit-card-statement-types"
import { useImportCreditCardStatementFile } from "../hooks/use-import-credit-card-statement-file"
import { useImportCreditCardStatementOfx } from "../hooks/use-import-credit-card-statement-ofx"

type CreditCardStatementImportKind =
    | "BRADESCO_CREDIT_CARD_XLSX"
    | "CREDIT_CARD_OFX"

type ImportOption = {
    value: CreditCardStatementImportKind
    title: string
    description: string
    accept: string
    fileLabel: string
    icon: typeof FileSpreadsheet
}

const importOptions: ImportOption[] = [
    {
        value: "BRADESCO_CREDIT_CARD_XLSX",
        title: "Planilha Bradesco",
        description:
            "Use para importar a planilha XLSX exportada da fatura do Bradesco.",
        accept: ".xlsx",
        fileLabel: "Planilha XLSX",
        icon: FileSpreadsheet,
    },
    {
        value: "CREDIT_CARD_OFX",
        title: "OFX de cartão",
        description:
            "Use para importar lançamentos do cartão em formato OFX dentro desta fatura.",
        accept: ".ofx",
        fileLabel: "Arquivo OFX",
        icon: FileUp,
    },
]

type ImportCreditCardStatementDialogProps = {
    statement: CreditCardStatement
    open?: boolean
    onOpenChange?: (open: boolean) => void
    trigger?: ReactNode | null
}

export function ImportCreditCardStatementDialog({
    statement,
    open,
    onOpenChange,
    trigger,
}: ImportCreditCardStatementDialogProps) {

    const [internalOpen, setInternalOpen] = useState(false)

    const dialogOpen = open ?? internalOpen
    const setDialogOpen = onOpenChange ?? setInternalOpen

    const [importKind, setImportKind] =
        useState<CreditCardStatementImportKind>("BRADESCO_CREDIT_CARD_XLSX")
    const [file, setFile] = useState<File | null>(null)

    const importFileMutation = useImportCreditCardStatementFile()
    const importOfxMutation = useImportCreditCardStatementOfx()

    const canImport = statement.status === "OPEN" || statement.status === "CLOSED"
    const isImporting = importFileMutation.isPending || importOfxMutation.isPending

    const selectedOption =
        importOptions.find((option) => option.value === importKind) ??
        importOptions[0]

    function handleOpenChange(value: boolean) {
        if (!value) {
            resetForm()
        }

        setDialogOpen(value)
    }

    function resetForm() {
        setImportKind("BRADESCO_CREDIT_CARD_XLSX")
        setFile(null)
    }

    function handleImportKindChange(value: string) {
        setImportKind(value as CreditCardStatementImportKind)
        setFile(null)
    }

    function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()

        if (!file) {
            toast.error("Selecione o arquivo da fatura.")
            return
        }

        if (importKind === "CREDIT_CARD_OFX") {
            importOfxMutation.mutate(
                {
                    statementId: statement.id,
                    file,
                },
                {
                    onSuccess: (result) => {
                        toast.success(
                            `OFX importado: ${result.importedCount} itens importados, ${result.ignoredDuplicateCount} duplicados, ${result.failedCount} falhas.`,
                        )

                        if (result.errors.length > 0) {
                            toast.warning("Alguns itens não foram importados.")
                        }

                        handleOpenChange(false)
                    },
                    onError: (error) => {
                        toast.error(
                            getApiErrorMessage(
                                error,
                                "Não foi possível importar o OFX da fatura.",
                            ),
                        )
                    },
                },
            )

            return
        }

        importFileMutation.mutate(
            {
                statementId: statement.id,
                profile: importKind as ImportProfile,
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
        <Dialog open={dialogOpen} onOpenChange={handleOpenChange}>
            {trigger === undefined ? (
                <DialogTrigger asChild>
                    <Button size="sm" variant="outline" disabled={!canImport}>
                        <Upload className="mr-2 size-4" />
                        Importar fatura
                    </Button>
                </DialogTrigger>
            ) : (
                trigger
            )}

            <AppDialogContent size="lg">
                <AppDialogHeader
                    icon={<Upload className="size-4 text-muted-foreground" />}
                    title="Importar fatura"
                    description="Escolha o tipo de arquivo e importe os lançamentos dentro desta fatura de cartão."
                />

                <form onSubmit={handleSubmit} className="contents">
                    <AppDialogBody className="space-y-5">
                        <div className="rounded-xl border bg-muted/40 p-3 text-sm">
                            <p className="font-medium">{statement.name}</p>
                            <p className="text-muted-foreground">
                                Cartão: {statement.creditCardAccount?.name ?? "-"}
                            </p>
                        </div>

                        <div className="space-y-3">
                            <Label>Tipo de importação</Label>

                            <RadioGroup
                                value={importKind}
                                onValueChange={handleImportKindChange}
                                className="grid gap-3 md:grid-cols-2"
                            >
                                {importOptions.map((option) => {
                                    const selected = importKind === option.value
                                    const optionId = `credit-card-import-${option.value}`
                                    const Icon = option.icon

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
                                                    <Icon className="size-4 text-muted-foreground" />
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

                        <div className="space-y-2">
                            <Label htmlFor="creditCardStatementFile">
                                {selectedOption.fileLabel}
                            </Label>

                            <Input
                                key={importKind}
                                id="creditCardStatementFile"
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

                        <div className="rounded-xl border bg-muted/30 p-3 text-xs text-muted-foreground">
                            Os lançamentos importados entram como itens da fatura. Depois você
                            pode revisar categoria, alocações, anexos e regra documental no
                            workspace da transação.
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