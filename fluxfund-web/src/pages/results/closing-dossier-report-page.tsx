import axios from "axios"
import {
    ArrowLeft,
    CheckCircle2,
    CircleAlert,
    FileOutput,
    FolderArchive,
    RefreshCw,
} from "lucide-react"
import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { toast } from "sonner"

import { PageHeader } from "@/components/layout/page-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { usePermissions } from "@/features/auth/hooks/use-permissions"
import { useAccounts } from "@/features/accounts/hooks/use-accounts"
import type { Account } from "@/features/accounts/types"
import { getFirstDayOfCurrentMonth, getTodayDate } from "@/utils/date-getters"
import { cn } from "@/lib/utils"
import { ClosingDossierAccountCard } from "@/features/closing-dossier/components/closing-dossier-account-card"
import { useClosingDossierPreview } from "@/features/closing-dossier/hooks/use-closing-dossier-preview"
import type { ClosingDossierPreviewRequest } from "@/features/closing-dossier/closing-dossier-types"
import { useExportClosingDossierPdf } from "@/features/closing-dossier/hooks/use-export-closing-dossier-pdf"
import { downloadFile } from "@/utils/download-file"
import { getApiErrorMessage } from "@/utils/api-error"

const ACCOUNT_PAGE_SIZE = 100

const accountTypeLabels: Record<Account["type"], string> = {
    BANK: "Conta bancária",
    CASH: "Caixa físico",
    DIGITAL_WALLET: "Conta digital",
    CREDIT_CARD: "Cartão de crédito",
}

export function ClosingDossierReportPage() {
    const { canFinanceWrite, canExportReports } = usePermissions()

    const [periodStartDate, setPeriodStartDate] = useState(
        getFirstDayOfCurrentMonth(),
    )

    const [periodEndDate, setPeriodEndDate] = useState(getTodayDate())

    const [selectedAccountIds, setSelectedAccountIds] = useState<string[]>([])

    const [includeAccountsWithoutMovement, setIncludeAccountsWithoutMovement] =
        useState(true)

    const [includeIncomes, setIncludeIncomes] = useState(true)
    const [includeExpenses, setIncludeExpenses] = useState(true)
    const [includeTransfers, setIncludeTransfers] = useState(true)

    const [appliedPreviewSignature, setAppliedPreviewSignature] = useState<
        string | null
    >(null)

    const accountsQuery = useAccounts({
        page: 0,
        size: ACCOUNT_PAGE_SIZE,
    })

    const previewMutation = useClosingDossierPreview()

    const exportPdfMutation = useExportClosingDossierPdf()

    const selectableAccounts = useMemo(
        () =>
            (accountsQuery.data?.content ?? []).filter(
                (account) => account.active && account.type !== "CREDIT_CARD",
            ),
        [accountsQuery.data?.content],
    )

    const currentRequest = useMemo<ClosingDossierPreviewRequest | null>(() => {
        if (selectedAccountIds.length === 0) {
            return null
        }

        return {
            periodStartDate,
            periodEndDate,
            accountIds: selectedAccountIds,
            includeAccountsWithoutMovement,
            includeIncomes,
            includeExpenses,
            includeTransfers,
        }
    }, [
        includeAccountsWithoutMovement,
        includeExpenses,
        includeIncomes,
        includeTransfers,
        periodEndDate,
        periodStartDate,
        selectedAccountIds,
    ])

    const currentPreviewSignature = currentRequest
        ? createPreviewSignature(currentRequest)
        : null

    const preview =
        appliedPreviewSignature === currentPreviewSignature
            ? previewMutation.data
            : undefined

    const filtersChanged =
        Boolean(appliedPreviewSignature) &&
        appliedPreviewSignature !== currentPreviewSignature

    const totalDossierIssues = preview
        ? preview.accountsWithoutBankStatementCount +
        preview.expensesWithoutPaymentProofCount +
        preview.expensesWithoutFiscalDocumentCount
        : 0

    const canExportPdf =
        Boolean(preview) &&
        !filtersChanged &&
        Boolean(currentRequest) &&
        canExportReports &&
        !exportPdfMutation.isPending

    function toggleAccount(accountId: string) {
        setSelectedAccountIds((current) =>
            current.includes(accountId)
                ? current.filter((id) => id !== accountId)
                : [...current, accountId],
        )
    }

    function selectAllAccounts() {
        setSelectedAccountIds(selectableAccounts.map((account) => account.id))
    }

    function clearAccounts() {
        setSelectedAccountIds([])
    }

    async function handlePreview() {
        if (!currentRequest) {
            toast.error("Selecione ao menos uma conta para gerar a prévia.")
            return
        }

        if (periodStartDate > periodEndDate) {
            toast.error("A data inicial não pode ser posterior à data final.")
            return
        }

        if (!includeIncomes && !includeExpenses && !includeTransfers) {
            toast.error("Selecione ao menos um tipo de transação.")
            return
        }

        try {
            await previewMutation.mutateAsync(currentRequest)

            setAppliedPreviewSignature(createPreviewSignature(currentRequest))
        } catch (error) {
            if (axios.isAxiosError(error)) {
                toast.error(
                    error.response?.data?.message ??
                    "Não foi possível gerar a prévia do Dossiê.",
                )
                return
            }

            toast.error("Não foi possível gerar a prévia do Dossiê.")
        }
    }

    function handleDocumentsChanged() {
        void handlePreview()
    }

    async function handleExportPdf() {
        if (!currentRequest || !preview) {
            toast.error("Gere uma prévia atualizada antes de exportar o Dossiê.")
            return
        }

        try {
            const pdfBlob = await exportPdfMutation.mutateAsync(currentRequest)

            downloadFile(
                pdfBlob,
                `dossie-fechamento-${currentRequest.periodStartDate}-a-${currentRequest.periodEndDate}.pdf`,
            )

            toast.success("Dossiê de Fechamento gerado com sucesso.")
        } catch (error) {
            toast.error(await getPdfExportErrorMessage(error))
        }
    }

    return (
        <div className="space-y-6">
            <Button asChild variant="ghost" className="px-0">
                <Link to="/reports">
                    <ArrowLeft className="mr-2 size-4" />
                    Voltar para relatórios
                </Link>
            </Button>

            <section className="overflow-hidden rounded-2xl border bg-gradient-to-br from-primary/10 via-background to-muted/50">
                <div className="flex flex-col gap-6 p-6 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex items-start gap-4">
                        <div className="rounded-2xl bg-background p-4 shadow-sm">
                            <FolderArchive className="size-7 text-primary" />
                        </div>

                        <div className="space-y-2">
                            <Badge variant="secondary">Fechamento financeiro</Badge>

                            <div>
                                <h1 className="text-2xl font-semibold tracking-tight">
                                    Dossiê de Fechamento
                                </h1>

                                <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                                    Reúna extratos oficiais, movimentações e pendências documentais
                                    de cada conta antes de gerar a pasta de auditoria.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col items-start gap-2 lg:items-end">
                        {preview && !filtersChanged && (
                            <p className="max-w-xs text-left text-xs text-muted-foreground lg:text-right">
                                {totalDossierIssues === 0
                                    ? "Prévia sem pendências documentais."
                                    : `O PDF será gerado com ${totalDossierIssues} pendência${totalDossierIssues > 1 ? "s" : ""} identificada${totalDossierIssues > 1 ? "s" : ""}.`}
                            </p>
                        )}

                        <Button
                            onClick={handleExportPdf}
                            disabled={!canExportPdf}
                            title={
                                !canExportReports
                                    ? "Seu perfil não possui permissão para exportar relatórios."
                                    : filtersChanged
                                        ? "Gere uma prévia atualizada antes de exportar."
                                        : !preview
                                            ? "Gere uma prévia antes de exportar."
                                            : undefined
                            }
                        >
                            <FileOutput className="mr-2 size-4" />

                            {exportPdfMutation.isPending
                                ? "Gerando PDF..."
                                : "Gerar PDF do Dossiê"}
                        </Button>
                    </div>
                </div>
            </section>

            <Card className="shadow-sm">
                <CardHeader>
                    <CardTitle>Configurar prévia</CardTitle>

                    <p className="text-sm text-muted-foreground">
                        Escolha o período, as contas e os tipos de movimentação que devem
                        entrar no Dossiê.
                    </p>
                </CardHeader>

                <CardContent className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                        <div className="space-y-2">
                            <Label htmlFor="closing-dossier-start-date">Data inicial</Label>

                            <Input
                                id="closing-dossier-start-date"
                                type="date"
                                value={periodStartDate}
                                onChange={(event) => setPeriodStartDate(event.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="closing-dossier-end-date">Data final</Label>

                            <Input
                                id="closing-dossier-end-date"
                                type="date"
                                value={periodEndDate}
                                onChange={(event) => setPeriodEndDate(event.target.value)}
                            />
                        </div>

                        <label className="flex cursor-pointer items-center gap-3 rounded-lg border p-3 text-sm">
                            <Checkbox
                                checked={includeAccountsWithoutMovement}
                                onCheckedChange={(checked) =>
                                    setIncludeAccountsWithoutMovement(Boolean(checked))
                                }
                            />

                            <span>
                                <span className="block font-medium">
                                    Incluir contas sem movimento
                                </span>

                                <span className="block text-xs text-muted-foreground">
                                    Mostra contas vazias na pasta final.
                                </span>
                            </span>
                        </label>

                        <div className="flex items-end">
                            <Button
                                className="w-full"
                                onClick={handlePreview}
                                disabled={
                                    previewMutation.isPending ||
                                    accountsQuery.isLoading ||
                                    selectableAccounts.length === 0
                                }
                            >
                                <RefreshCw
                                    className={cn(
                                        "mr-2 size-4",
                                        previewMutation.isPending && "animate-spin",
                                    )}
                                />
                                {previewMutation.isPending
                                    ? "Atualizando prévia..."
                                    : "Gerar prévia"}
                            </Button>
                        </div>
                    </div>

                    <div className="space-y-3 border-t pt-5">
                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                            <div>
                                <Label>Contas incluídas</Label>

                                <p className="mt-1 text-xs text-muted-foreground">
                                    Cartões de crédito não entram neste MVP porque possuem fluxo
                                    próprio de faturas.
                                </p>
                            </div>

                            <div className="flex gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={selectAllAccounts}
                                    disabled={selectableAccounts.length === 0}
                                >
                                    Selecionar todas
                                </Button>

                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={clearAccounts}
                                    disabled={selectedAccountIds.length === 0}
                                >
                                    Limpar
                                </Button>
                            </div>
                        </div>

                        {accountsQuery.isLoading ? (
                            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                                {Array.from({ length: 3 }).map((_, index) => (
                                    <Skeleton key={index} className="h-20 rounded-xl" />
                                ))}
                            </div>
                        ) : accountsQuery.isError ? (
                            <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
                                Não foi possível carregar as contas disponíveis.
                            </div>
                        ) : selectableAccounts.length === 0 ? (
                            <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                                Nenhuma conta elegível foi encontrada.
                            </div>
                        ) : (
                            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                                {selectableAccounts.map((account) => {
                                    const selected = selectedAccountIds.includes(account.id)

                                    return (
                                        <label
                                            key={account.id}
                                            className={cn(
                                                "flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors",
                                                selected
                                                    ? "border-primary bg-primary/5"
                                                    : "hover:bg-muted/40",
                                            )}
                                        >
                                            <Checkbox
                                                checked={selected}
                                                onCheckedChange={() => toggleAccount(account.id)}
                                            />

                                            <span className="min-w-0">
                                                <span className="block truncate text-sm font-medium">
                                                    {account.name}
                                                </span>

                                                <span className="mt-1 block text-xs text-muted-foreground">
                                                    {accountTypeLabels[account.type]}
                                                    {account.bankName ? ` · ${account.bankName}` : ""}
                                                </span>
                                            </span>
                                        </label>
                                    )
                                })}
                            </div>
                        )}
                    </div>

                    <div className="grid gap-3 border-t pt-5 md:grid-cols-3">
                        <DocumentTypeOption
                            checked={includeIncomes}
                            label="Receitas"
                            description="Entradas e recebimentos."
                            onCheckedChange={setIncludeIncomes}
                        />

                        <DocumentTypeOption
                            checked={includeExpenses}
                            label="Despesas"
                            description="Pagamentos e documentos fiscais."
                            onCheckedChange={setIncludeExpenses}
                        />

                        <DocumentTypeOption
                            checked={includeTransfers}
                            label="Transferências"
                            description="Movimentações entre contas."
                            onCheckedChange={setIncludeTransfers}
                        />
                    </div>
                </CardContent>
            </Card>

            {filtersChanged && (
                <div className="flex gap-3 rounded-xl border border-primary/30 bg-primary/5 p-4 text-sm">
                    <CircleAlert className="mt-0.5 size-4 shrink-0 text-primary" />

                    <div>
                        <p className="font-medium">Os filtros foram alterados.</p>
                        <p className="mt-1 text-muted-foreground">
                            Gere uma nova prévia para visualizar os dados atualizados.
                        </p>
                    </div>
                </div>
            )}

            {previewMutation.isError && !preview && (
                <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-5 text-sm text-destructive">
                    Não foi possível carregar a prévia do Dossiê.
                </div>
            )}

            {!preview && !previewMutation.isPending && !filtersChanged && (
                <section className="rounded-2xl border border-dashed p-8 text-center">
                    <FolderArchive className="mx-auto size-10 text-muted-foreground" />

                    <h2 className="mt-4 text-lg font-semibold">
                        Prepare seu fechamento financeiro
                    </h2>

                    <p className="mx-auto mt-2 max-w-lg text-sm text-muted-foreground">
                        Selecione as contas e gere a prévia para identificar extratos,
                        comprovantes e documentos fiscais pendentes.
                    </p>
                </section>
            )}

            {preview && (
                <section className="space-y-5">
                    <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                        <PageHeader
                            title="Prévia do fechamento"
                            description={`Período analisado: ${preview.periodStartDate} até ${preview.periodEndDate}.`}
                        />

                        <Badge variant="secondary">
                            {preview.includedAccountCount} de {preview.selectedAccountCount}{" "}
                            contas incluídas
                        </Badge>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                        <PreviewMetric
                            label="Movimentações"
                            value={String(preview.totalTransactionCount)}
                            description="Transações no período"
                            isHealthy
                        />

                        <PreviewMetric
                            label="Extratos pendentes"
                            value={String(preview.accountsWithoutBankStatementCount)}
                            description="Contas sem PDF oficial"
                            isHealthy={preview.accountsWithoutBankStatementCount === 0}
                        />

                        <PreviewMetric
                            label="Sem comprovante"
                            value={String(preview.expensesWithoutPaymentProofCount)}
                            description="Despesas com pendência"
                            isHealthy={preview.expensesWithoutPaymentProofCount === 0}
                        />

                        <PreviewMetric
                            label="Sem documento fiscal"
                            value={String(preview.expensesWithoutFiscalDocumentCount)}
                            description="Notas, recibos ou declarações"
                            isHealthy={preview.expensesWithoutFiscalDocumentCount === 0}
                        />
                    </div>

                    {preview.accountsWithoutMovementCount > 0 && (
                        <div className="flex gap-3 rounded-xl border bg-muted/30 p-4 text-sm">
                            <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-muted-foreground" />

                            <p className="text-muted-foreground">
                                {preview.accountsWithoutMovementCount} conta
                                {preview.accountsWithoutMovementCount > 1 ? "s" : ""} sem
                                movimentação foram encontradas no período.
                            </p>
                        </div>
                    )}

                    <div className="space-y-4">
                        {preview.accounts.map((account) => (
                            <ClosingDossierAccountCard
                                key={account.accountId}
                                account={account}
                                periodStartDate={preview.periodStartDate}
                                periodEndDate={preview.periodEndDate}
                                canManageDocuments={canFinanceWrite}
                                onDocumentsChanged={handleDocumentsChanged}
                            />
                        ))}
                    </div>
                </section>
            )}
        </div>
    )
}

function DocumentTypeOption({
    checked,
    label,
    description,
    onCheckedChange,
}: {
    checked: boolean
    label: string
    description: string
    onCheckedChange: (value: boolean) => void
}) {
    return (
        <label
            className={cn(
                "flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors",
                checked ? "border-primary bg-primary/5" : "hover:bg-muted/40",
            )}
        >
            <Checkbox
                checked={checked}
                onCheckedChange={(value) => onCheckedChange(Boolean(value))}
            />

            <span>
                <span className="block text-sm font-medium">{label}</span>
                <span className="mt-1 block text-xs text-muted-foreground">
                    {description}
                </span>
            </span>
        </label>
    )
}

function PreviewMetric({
    label,
    value,
    description,
    isHealthy,
}: {
    label: string
    value: string
    description: string
    isHealthy: boolean
}) {
    return (
        <Card>
            <CardContent className="pt-5">
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <p className="text-sm text-muted-foreground">{label}</p>
                        <p className="mt-1 text-3xl font-semibold tracking-tight">
                            {value}
                        </p>
                    </div>

                    {isHealthy ? (
                        <CheckCircle2 className="size-5 text-primary" />
                    ) : (
                        <CircleAlert className="size-5 text-destructive" />
                    )}
                </div>

                <p className="mt-3 text-xs text-muted-foreground">{description}</p>
            </CardContent>
        </Card>
    )
}

function createPreviewSignature(request: ClosingDossierPreviewRequest) {
    return JSON.stringify({
        ...request,
        accountIds: [...request.accountIds].sort(),
    })
}

async function getPdfExportErrorMessage(error: unknown) {
    const fallback = "Não foi possível gerar o PDF do Dossiê."

    if (axios.isAxiosError(error) && error.response?.data instanceof Blob) {
        try {
            const responseText = await error.response.data.text()

            if (!responseText.trim()) {
                return fallback
            }

            const parsedResponse = JSON.parse(responseText) as {
                message?: string
                error?: string
            }

            return parsedResponse.message ?? parsedResponse.error ?? fallback
        } catch {
            return fallback
        }
    }

    return getApiErrorMessage(error, fallback)
}