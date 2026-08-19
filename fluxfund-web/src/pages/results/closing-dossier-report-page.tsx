import axios from "axios"
import {
    ArrowLeft,
    ArrowRight,
    CircleAlert,
    FolderArchive,
    RefreshCw,
} from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { usePermissions } from "@/features/auth/hooks/use-permissions"
import { useAccounts } from "@/features/accounts/hooks/use-accounts"
import type { Account } from "@/features/accounts/types"
import { cn } from "@/lib/utils"
import { useClosingDossierPreview } from "@/features/closing-dossier/hooks/use-closing-dossier-preview"
import type { ClosingDossierPreviewRequest } from "@/features/closing-dossier/closing-dossier-types"
import { useExportClosingDossierPdf } from "@/features/closing-dossier/hooks/use-export-closing-dossier-pdf"
import { downloadFile } from "@/utils/download-file"
import { getApiErrorMessage } from "@/utils/api-error"
import { getDateRangeForPreset, type DateRangeValue } from "@/components/filters/date-range-presets"
import { DateRangePresetFilter } from "@/components/filters/date-range-preset-filter"
import { ClosingDossierStepper, type ClosingDossierStep } from "@/features/closing-dossier/components/closing-dossier-stepper"
import { ClosingDossierDocumentsStep } from "@/features/closing-dossier/components/closing-dossier-documents-step"
import { ClosingDossierIssuesStep } from "@/features/closing-dossier/components/closing-dossier-issues-step"
import { ClosingDossierReviewStep } from "@/features/closing-dossier/components/closing-dossier-review-step"

const ACCOUNT_PAGE_SIZE = 100

const accountTypeLabels: Record<Account["type"], string> = {
    BANK: "Conta bancária",
    CASH: "Caixa físico",
    DIGITAL_WALLET: "Conta digital",
    CREDIT_CARD: "Cartão de crédito",
}

export function ClosingDossierReportPage() {
    const { canFinanceWrite, canExportReports } = usePermissions()

    const [activeStep, setActiveStep,] = useState<ClosingDossierStep>("configuration")

    useEffect(() => {
        window.scrollTo({
            top: 0,
            behavior: "smooth",
        })
    }, [activeStep])

    const [period, setPeriod] = useState<DateRangeValue>(() =>
        getDateRangeForPreset("current-month"),
    )

    const { startDate: periodStartDate, endDate: periodEndDate } = period

    const [selectedAccountIds, setSelectedAccountIds] = useState<string[]>([])

    const [includeAccountsWithoutMovement, setIncludeAccountsWithoutMovement] =
        useState(true)

    const [includeIncomes, setIncludeIncomes] = useState(true)
    const [includeExpenses, setIncludeExpenses] = useState(true)
    const [includeTransfers, setIncludeTransfers] = useState(true)
    const [includeSupportReport, setIncludeSupportReport] = useState(false)
    const [includePayablesReport, setIncludePayablesReport] = useState(false)
    const [includeReceivablesReport, setIncludeReceivablesReport] = useState(false)
    const [includeFundMovementReport, setIncludeFundMovementReport] = useState(false)

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
            includeSupportReport,
            includePayablesReport,
            includeReceivablesReport,
            includeFundMovementReport,
        }
    }, [
        includeAccountsWithoutMovement,
        includeExpenses,
        includeIncomes,
        includeTransfers,
        periodEndDate,
        periodStartDate,
        selectedAccountIds,
        includeSupportReport,
        includePayablesReport,
        includeReceivablesReport,
        includeFundMovementReport,
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
            return false
        }

        if (periodStartDate > periodEndDate) {
            toast.error("A data inicial não pode ser posterior à data final.")
            return false
        }

        if (!includeIncomes && !includeExpenses && !includeTransfers) {
            toast.error("Selecione ao menos um tipo de transação.")
            return false
        }

        try {
            await previewMutation.mutateAsync(currentRequest)

            setAppliedPreviewSignature(createPreviewSignature(currentRequest))
            return true

        } catch (error) {
            if (axios.isAxiosError(error)) {
                toast.error(
                    error.response?.data?.message ??
                    "Não foi possível gerar a prévia do Dossiê.",
                )
                return false
            }

            toast.error("Não foi possível gerar a prévia do Dossiê.")
            return false
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

    async function handleContinueFromConfiguration() {
        const success = await handlePreview()

        if (success) {
            setActiveStep(
                "documents",
            )
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
                </div>
            </section>

            <ClosingDossierStepper
                activeStep={activeStep}
                onStepChange={
                    setActiveStep
                }
            />

            {activeStep ===
                "configuration" && (
                    <Card className="shadow-sm">
                        <CardHeader>
                            <CardTitle>Configuração do fechamento</CardTitle>

                            <p className="text-sm text-muted-foreground">
                                Defina o período, as contas e as
                                informações que farão parte deste
                                fechamento.
                            </p>
                        </CardHeader>

                        <CardContent className="space-y-6">
                            <div className="space-y-6">
                                <DateRangePresetFilter
                                    value={period}
                                    onChange={setPeriod}
                                    idPrefix="closing-dossier-period"
                                    label="Período do Dossiê"
                                    layout="compact"
                                    showSummary={false}
                                />

                                <div className="border-t pt-4">
                                    <label className="flex max-w-xl cursor-pointer items-center gap-3 rounded-lg border p-3 text-sm">
                                        <Checkbox
                                            checked={
                                                includeAccountsWithoutMovement
                                            }
                                            onCheckedChange={(
                                                checked,
                                            ) =>
                                                setIncludeAccountsWithoutMovement(
                                                    Boolean(
                                                        checked,
                                                    ),
                                                )
                                            }
                                        />

                                        <span>
                                            <span className="block font-medium">
                                                Incluir contas sem
                                                movimento
                                            </span>

                                            <span className="block text-xs text-muted-foreground">
                                                Mostra contas vazias
                                                na pasta final.
                                            </span>
                                        </span>
                                    </label>
                                </div>
                            </div>

                            <div className="space-y-3 border-t pt-5">
                                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                    <div>
                                        <Label>Contas incluídas</Label>

                                        <p className="mt-1 text-xs text-muted-foreground">
                                            Contas de cartão não são selecionadas aqui.
                                            As faturas com compras no período são incluídas
                                            automaticamente.
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

                            <div className="space-y-3 border-t pt-5">
                                <div>
                                    <Label>Relatórios automáticos</Label>

                                    <p className="mt-1 text-xs text-muted-foreground">
                                        Seções calculadas pelo FluxFund e inseridas automaticamente no PDF.
                                    </p>
                                </div>

                                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                                    <DocumentTypeOption
                                        checked={includeSupportReport}
                                        label="Sustento missionário"
                                        description="Inclui compromissos, ofertas, repasses e o saldo final a repassar por favorecido."
                                        onCheckedChange={setIncludeSupportReport}
                                    />

                                    <DocumentTypeOption
                                        checked={includePayablesReport}
                                        label="Despesas reconhecidas"
                                        description="Inclui resumo por categoria e detalhamento das despesas reconhecidas no período, inclusive compras no cartão."
                                        onCheckedChange={setIncludePayablesReport}
                                    />

                                    <DocumentTypeOption
                                        checked={includeReceivablesReport}
                                        label="Receitas liquidadas"
                                        description="Inclui resumo por categoria e detalhamento dos recebimentos efetivamente realizados no período."
                                        onCheckedChange={setIncludeReceivablesReport}
                                    />

                                    <DocumentTypeOption
                                        checked={includeFundMovementReport}
                                        label="Movimentação por fundos"
                                        description="Inclui entradas destinadas, saídas utilizadas, transferências internas e variação de cada fundo no período."
                                        onCheckedChange={setIncludeFundMovementReport}
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end border-t pt-5">
                                <Button
                                    className="w-full sm:w-auto"
                                    onClick={
                                        handleContinueFromConfiguration
                                    }
                                    disabled={
                                        previewMutation.isPending ||
                                        accountsQuery.isLoading ||
                                        selectableAccounts.length ===
                                        0 ||
                                        selectedAccountIds.length ===
                                        0
                                    }
                                >
                                    {previewMutation.isPending ? (
                                        <RefreshCw className="mr-2 size-4 animate-spin" />
                                    ) : (
                                        <ArrowRight className="mr-2 size-4" />
                                    )}

                                    {previewMutation.isPending
                                        ? "Analisando fechamento..."
                                        : "Continuar para documentos"}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

            {activeStep ===
                "documents" &&
                preview && (
                    <ClosingDossierDocumentsStep
                        preview={preview}
                        canManageDocuments={
                            canFinanceWrite
                        }
                        isRefreshing={
                            previewMutation.isPending
                        }
                        onDocumentsChanged={
                            handleDocumentsChanged
                        }
                        onRefresh={() =>
                            void handlePreview()
                        }
                        onBack={() =>
                            setActiveStep(
                                "configuration",
                            )
                        }
                        onContinue={() =>
                            setActiveStep(
                                "issues",
                            )
                        }
                    />
                )}

            {activeStep ===
                "issues" &&
                preview && (
                    <ClosingDossierIssuesStep
                        preview={preview}
                        isRefreshing={
                            previewMutation.isPending
                        }
                        onRefresh={() =>
                            void handlePreview()
                        }
                        onBack={() =>
                            setActiveStep(
                                "documents",
                            )
                        }
                        onContinue={() =>
                            setActiveStep(
                                "review",
                            )
                        }
                    />
                )}

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

            {activeStep ===
                "configuration" &&
                !preview &&
                !previewMutation.isPending &&
                !filtersChanged && (
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

            {activeStep ===
                "review" &&
                preview && (
                    <ClosingDossierReviewStep
                        preview={preview}
                        canExportReports={
                            canExportReports
                        }
                        isExporting={
                            exportPdfMutation.isPending
                        }
                        onBack={() =>
                            setActiveStep(
                                "issues",
                            )
                        }
                        onExport={
                            handleExportPdf
                        }
                    />
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