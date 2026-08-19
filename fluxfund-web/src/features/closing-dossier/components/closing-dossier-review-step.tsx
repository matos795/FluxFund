import {
    ArrowLeft,
    CheckCircle2,
    CircleAlert,
    FileOutput,
    FolderArchive,
    Landmark,
    ListChecks,
} from "lucide-react"

import {
    Badge,
} from "@/components/ui/badge"

import {
    Button,
} from "@/components/ui/button"

import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"

import {
    formatDate,
} from "@/utils/formatters"

import type {
    ClosingDossierPreview,
} from "../closing-dossier-types"

type ClosingDossierReviewStepProps = {
    preview: ClosingDossierPreview
    canExportReports: boolean
    isExporting: boolean
    onBack: () => void
    onExport: () => void
}

export function ClosingDossierReviewStep({
    preview,
    canExportReports,
    isExporting,
    onBack,
    onExport,
}: ClosingDossierReviewStepProps) {
    const totalDocumentIssues =
        preview.accountsWithoutBankStatementCount +
        preview.creditCardStatementsWithoutPdfCount +
        preview.expensesWithoutPaymentProofCount +
        preview.expensesWithoutFiscalDocumentCount

    const unclassifiedCardItemCount =
        preview.creditCardStatements.reduce(
            (total, statement) =>
                total +
                statement.unclassifiedItemCount,
            0,
        )

    const hasIssues =
        totalDocumentIssues > 0 ||
        unclassifiedCardItemCount > 0

    const includedAccounts =
        preview.accounts.filter(
            (account) =>
                account.includedInDossier,
        )

    return (
        <div className="space-y-6">
            <section>
                <div className="flex items-start gap-4">
                    <div className="rounded-2xl bg-primary/10 p-3">
                        <FolderArchive className="size-6 text-primary" />
                    </div>

                    <div>
                        <h2 className="text-xl font-semibold">
                            Revisão final
                        </h2>

                        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                            Confira o resumo do fechamento antes
                            de gerar o PDF definitivo do Dossiê.
                        </p>
                    </div>
                </div>
            </section>

            {hasIssues ? (
                <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
                    <CircleAlert className="mt-0.5 size-5 shrink-0" />

                    <div>
                        <p className="font-medium">
                            O fechamento ainda possui pendências
                        </p>

                        <p className="mt-1">
                            Você ainda pode gerar o Dossiê, mas
                            revise as pendências identificadas antes
                            de considerar o fechamento concluído.
                        </p>
                    </div>
                </div>
            ) : (
                <div className="flex gap-3 rounded-xl border border-primary/30 bg-primary/5 p-4 text-sm">
                    <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-primary" />

                    <div>
                        <p className="font-medium">
                            Fechamento pronto para exportação
                        </p>

                        <p className="mt-1 text-muted-foreground">
                            Nenhuma pendência documental foi
                            encontrada na conferência.
                        </p>
                    </div>
                </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <SummaryCard
                    label="Período"
                    value={`${formatDate(
                        preview.periodStartDate,
                    )} até ${formatDate(
                        preview.periodEndDate,
                    )}`}
                    icon={ListChecks}
                />

                <SummaryCard
                    label="Contas"
                    value={`${preview.includedAccountCount} incluída${preview.includedAccountCount === 1
                            ? ""
                            : "s"
                        }`}
                    icon={Landmark}
                />

                <SummaryCard
                    label="Movimentações"
                    value={String(
                        preview.totalTransactionCount,
                    )}
                    icon={ListChecks}
                />

                <SummaryCard
                    label="Seções automáticas"
                    value={String(
                        preview.automaticSectionCount,
                    )}
                    icon={FolderArchive}
                />
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-base">
                        Conteúdo do Dossiê
                    </CardTitle>

                    <p className="text-sm text-muted-foreground">
                        Estas são as informações que serão
                        consideradas na geração do PDF.
                    </p>
                </CardHeader>

                <CardContent className="space-y-5">
                    <div>
                        <p className="mb-2 text-sm font-medium">
                            Movimentações
                        </p>

                        <div className="flex flex-wrap gap-2">
                            <ContentBadge
                                enabled={
                                    preview.includeIncomes
                                }
                                label="Receitas"
                            />

                            <ContentBadge
                                enabled={
                                    preview.includeExpenses
                                }
                                label="Despesas"
                            />

                            <ContentBadge
                                enabled={
                                    preview.includeTransfers
                                }
                                label="Transferências"
                            />
                        </div>
                    </div>

                    <div className="border-t pt-4">
                        <p className="mb-2 text-sm font-medium">
                            Relatórios automáticos
                        </p>

                        <div className="flex flex-wrap gap-2">
                            <ContentBadge
                                enabled={
                                    preview.includesSupportReport
                                }
                                label="Sustento missionário"
                            />

                            <ContentBadge
                                enabled={
                                    preview.includesPayablesReport
                                }
                                label="Despesas reconhecidas"
                            />

                            <ContentBadge
                                enabled={
                                    preview.includesReceivablesReport
                                }
                                label="Receitas liquidadas"
                            />

                            <ContentBadge
                                enabled={
                                    preview.includesFundMovementReport
                                }
                                label="Movimentação por fundos"
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-base">
                        Situação documental
                    </CardTitle>

                    <p className="text-sm text-muted-foreground">
                        Resumo da conferência realizada nas
                        etapas anteriores.
                    </p>
                </CardHeader>

                <CardContent>
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                        <DocumentStatus
                            label="Extratos"
                            value={
                                preview
                                    .accountsWithoutBankStatementCount
                            }
                        />

                        <DocumentStatus
                            label="PDFs de fatura"
                            value={
                                preview
                                    .creditCardStatementsWithoutPdfCount
                            }
                        />

                        <DocumentStatus
                            label="Comprovantes"
                            value={
                                preview
                                    .expensesWithoutPaymentProofCount
                            }
                        />

                        <DocumentStatus
                            label="Documentos fiscais"
                            value={
                                preview
                                    .expensesWithoutFiscalDocumentCount
                            }
                        />

                        <DocumentStatus
                            label="Itens de cartão"
                            value={
                                unclassifiedCardItemCount
                            }
                        />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-base">
                        Contas incluídas
                    </CardTitle>
                </CardHeader>

                <CardContent>
                    {includedAccounts.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                            Nenhuma conta será incluída.
                        </p>
                    ) : (
                        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                            {includedAccounts.map(
                                (account) => (
                                    <div
                                        key={
                                            account.accountId
                                        }
                                        className="flex items-start justify-between gap-3 rounded-xl border bg-muted/20 p-4"
                                    >
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-medium">
                                                {
                                                    account.accountName
                                                }
                                            </p>

                                            <p className="mt-1 text-xs text-muted-foreground">
                                                {
                                                    account.transactionCount
                                                }{" "}
                                                movimentação
                                                {account.transactionCount ===
                                                    1
                                                    ? ""
                                                    : "ões"}
                                            </p>
                                        </div>

                                        <CheckCircle2 className="size-4 shrink-0 text-primary" />
                                    </div>
                                ),
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

            <section className="overflow-hidden rounded-2xl border bg-gradient-to-br from-primary/10 via-background to-background">
                <div className="flex flex-col gap-5 p-6 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <h3 className="font-semibold">
                            Gerar Dossiê de Fechamento
                        </h3>

                        <p className="mt-1 max-w-xl text-sm text-muted-foreground">
                            O PDF será montado com os documentos,
                            movimentações e relatórios selecionados
                            neste fechamento.
                        </p>

                        {!canExportReports && (
                            <p className="mt-2 text-sm text-destructive">
                                Seu perfil não possui permissão
                                para exportar relatórios.
                            </p>
                        )}
                    </div>

                    <Button
                        type="button"
                        size="lg"
                        onClick={onExport}
                        disabled={
                            !canExportReports ||
                            isExporting
                        }
                    >
                        <FileOutput className="mr-2 size-4" />

                        {isExporting
                            ? "Gerando PDF..."
                            : "Gerar PDF do Dossiê"}
                    </Button>
                </div>
            </section>

            <div className="border-t pt-5">
                <Button
                    type="button"
                    variant="outline"
                    onClick={onBack}
                >
                    <ArrowLeft className="mr-2 size-4" />
                    Voltar para pendências
                </Button>
            </div>
        </div>
    )
}

function SummaryCard({
    label,
    value,
    icon: Icon,
}: {
    label: string
    value: string
    icon: typeof Landmark
}) {
    return (
        <Card>
            <CardContent className="flex items-start gap-3 p-5">
                <div className="rounded-xl bg-muted p-2.5">
                    <Icon className="size-4 text-muted-foreground" />
                </div>

                <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">
                        {label}
                    </p>

                    <p className="mt-1 text-sm font-semibold">
                        {value}
                    </p>
                </div>
            </CardContent>
        </Card>
    )
}

function ContentBadge({
    enabled,
    label,
}: {
    enabled: boolean
    label: string
}) {
    return (
        <Badge
            variant={
                enabled
                    ? "secondary"
                    : "outline"
            }
            className={
                enabled
                    ? undefined
                    : "text-muted-foreground opacity-60"
            }
        >
            {enabled
                ? "✓ "
                : "— "}
            {label}
        </Badge>
    )
}

function DocumentStatus({
    label,
    value,
}: {
    label: string
    value: number
}) {
    const healthy =
        value === 0

    return (
        <div className="rounded-xl border p-4">
            <div className="flex items-center gap-2">
                {healthy ? (
                    <CheckCircle2 className="size-4 text-primary" />
                ) : (
                    <CircleAlert className="size-4 text-destructive" />
                )}

                <p className="text-sm font-medium">
                    {label}
                </p>
            </div>

            <p
                className={
                    healthy
                        ? "mt-2 text-xs text-muted-foreground"
                        : "mt-2 text-xs text-destructive"
                }
            >
                {healthy
                    ? "Sem pendências"
                    : `${value} pendente${value === 1
                        ? ""
                        : "s"
                    }`}
            </p>
        </div>
    )
}