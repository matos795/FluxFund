import {
    ArrowLeft,
    ArrowRight,
    CheckCircle2,
    CreditCard,
    FileWarning,
    Paperclip,
    RefreshCw,
    TriangleAlert,
} from "lucide-react"

import {
    Link,
} from "react-router-dom"

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

import type {
    ClosingDossierPreview,
} from "../closing-dossier-types"

import {
    ClosingDossierIssueList,
} from "./closing-dossier-account-card"

type ClosingDossierIssuesStepProps = {
    preview: ClosingDossierPreview
    isRefreshing: boolean
    onRefresh: () => void
    onBack: () => void
    onContinue: () => void
}

export function ClosingDossierIssuesStep({
    preview,
    isRefreshing,
    onRefresh,
    onBack,
    onContinue,
}: ClosingDossierIssuesStepProps) {
    const accountsWithIssues =
        preview.accounts.filter(
            (account) =>
                account.paymentProofIssues
                    .length > 0 ||
                account.fiscalDocumentIssues
                    .length > 0,
        )

    const statementsWithIssues =
        preview.creditCardStatements.filter(
            (statement) =>
                statement
                    .unclassifiedItemCount >
                0 ||
                statement
                    .fiscalDocumentIssues
                    .length > 0,
        )

    const unclassifiedCardItemCount =
        preview.creditCardStatements.reduce(
            (total, statement) =>
                total +
                statement.unclassifiedItemCount,
            0,
        )

    const hasIssues =
        preview
            .expensesWithoutPaymentProofCount >
        0 ||
        preview
            .expensesWithoutFiscalDocumentCount >
        0 ||
        unclassifiedCardItemCount > 0

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                    <h2 className="text-xl font-semibold">
                        Conferência de pendências
                    </h2>

                    <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                        Confira comprovantes,
                        documentos fiscais e itens
                        de cartão que ainda precisam
                        de atenção antes da revisão
                        final.
                    </p>
                </div>

                <Button
                    type="button"
                    variant="outline"
                    onClick={onRefresh}
                    disabled={isRefreshing}
                >
                    <RefreshCw
                        className={
                            isRefreshing
                                ? "mr-2 size-4 animate-spin"
                                : "mr-2 size-4"
                        }
                    />

                    {isRefreshing
                        ? "Atualizando..."
                        : "Atualizar conferência"}
                </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <IssueMetric
                    icon={Paperclip}
                    label="Sem comprovante"
                    value={
                        preview
                            .expensesWithoutPaymentProofCount
                    }
                    healthy={
                        preview
                            .expensesWithoutPaymentProofCount ===
                        0
                    }
                />

                <IssueMetric
                    icon={FileWarning}
                    label="Sem documento fiscal"
                    value={
                        preview
                            .expensesWithoutFiscalDocumentCount
                    }
                    healthy={
                        preview
                            .expensesWithoutFiscalDocumentCount ===
                        0
                    }
                />

                <IssueMetric
                    icon={CreditCard}
                    label="Itens de cartão sem categoria"
                    value={
                        unclassifiedCardItemCount
                    }
                    healthy={
                        unclassifiedCardItemCount ===
                        0
                    }
                />
            </div>

            {!hasIssues && (
                <Card className="border-primary/30 bg-primary/5">
                    <CardContent className="flex items-start gap-3 p-5">
                        <div className="rounded-xl bg-primary/10 p-2">
                            <CheckCircle2 className="size-5 text-primary" />
                        </div>

                        <div>
                            <p className="font-medium">
                                Nenhuma pendência encontrada
                            </p>

                            <p className="mt-1 text-sm text-muted-foreground">
                                O fechamento está pronto
                                para a revisão final.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            )}

            {accountsWithIssues.length >
                0 && (
                    <section className="space-y-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                            <div>
                                <h3 className="text-lg font-semibold">
                                    Pendências nas transações
                                </h3>

                                <p className="mt-1 text-sm text-muted-foreground">
                                    Despesas que precisam
                                    de comprovante ou
                                    documentação fiscal.
                                </p>
                            </div>

                            <Button
                                asChild
                                variant="outline"
                                size="sm"
                            >
                                <Link
                                    to="/transactions"
                                    target="_blank"
                                    rel="noreferrer"
                                >
                                    Abrir transações
                                </Link>
                            </Button>
                        </div>

                        <div className="space-y-4">
                            {accountsWithIssues.map(
                                (account) => (
                                    <Card
                                        key={
                                            account.accountId
                                        }
                                    >
                                        <CardHeader className="border-b bg-muted/30">
                                            <div className="flex items-center justify-between gap-3">
                                                <CardTitle className="text-base">
                                                    {
                                                        account.accountName
                                                    }
                                                </CardTitle>

                                                <Badge variant="destructive">
                                                    {account
                                                        .paymentProofIssues
                                                        .length +
                                                        account
                                                            .fiscalDocumentIssues
                                                            .length}{" "}
                                                    pendência(s)
                                                </Badge>
                                            </div>
                                        </CardHeader>

                                        <CardContent className="grid gap-4 pt-5 xl:grid-cols-2">
                                            <ClosingDossierIssueList
                                                title="Comprovantes de pagamento"
                                                issues={
                                                    account.paymentProofIssues
                                                }
                                                emptyMessage="Nenhum comprovante pendente."
                                            />

                                            <ClosingDossierIssueList
                                                title="Documentos fiscais"
                                                issues={
                                                    account.fiscalDocumentIssues
                                                }
                                                emptyMessage="Nenhum documento fiscal pendente."
                                            />
                                        </CardContent>
                                    </Card>
                                ),
                            )}
                        </div>
                    </section>
                )}

            {statementsWithIssues.length >
                0 && (
                    <section className="space-y-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                            <div>
                                <h3 className="text-lg font-semibold">
                                    Pendências em cartões
                                </h3>

                                <p className="mt-1 text-sm text-muted-foreground">
                                    Confira itens sem
                                    classificação e
                                    documentos fiscais
                                    relacionados às faturas.
                                </p>
                            </div>

                            <Button
                                asChild
                                variant="outline"
                                size="sm"
                            >
                                <Link
                                    to="/credit-card-statements"
                                    target="_blank"
                                    rel="noreferrer"
                                >
                                    <CreditCard className="mr-2 size-4" />
                                    Abrir faturas
                                </Link>
                            </Button>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                            {statementsWithIssues.map(
                                (statement) => (
                                    <Card
                                        key={
                                            statement.statementId
                                        }
                                    >
                                        <CardHeader>
                                            <CardTitle className="text-base">
                                                {
                                                    statement.statementName
                                                }
                                            </CardTitle>

                                            <p className="text-sm text-muted-foreground">
                                                {
                                                    statement.creditCardAccountName
                                                }
                                            </p>
                                        </CardHeader>

                                        <CardContent className="space-y-3">
                                            {statement
                                                .unclassifiedItemCount >
                                                0 && (
                                                    <div className="flex items-center justify-between rounded-lg border bg-muted/30 p-3 text-sm">
                                                        <span>
                                                            Itens sem
                                                            categoria
                                                        </span>

                                                        <Badge variant="destructive">
                                                            {
                                                                statement.unclassifiedItemCount
                                                            }
                                                        </Badge>
                                                    </div>
                                                )}

                                            {statement
                                                .fiscalDocumentIssues
                                                .length >
                                                0 && (
                                                    <div className="flex items-center justify-between rounded-lg border bg-muted/30 p-3 text-sm">
                                                        <span>
                                                            Documentos
                                                            fiscais
                                                        </span>

                                                        <Badge variant="destructive">
                                                            {
                                                                statement
                                                                    .fiscalDocumentIssues
                                                                    .length
                                                            }
                                                        </Badge>
                                                    </div>
                                                )}
                                        </CardContent>
                                    </Card>
                                ),
                            )}
                        </div>
                    </section>
                )}

            {hasIssues && (
                <div className="flex gap-3 rounded-xl border bg-muted/30 p-4">
                    <TriangleAlert className="mt-0.5 size-5 shrink-0 text-muted-foreground" />

                    <p className="text-sm text-muted-foreground">
                        As pendências não impedem
                        a revisão do fechamento.
                        Corrija o que for necessário
                        e use “Atualizar conferência”
                        para consultar novamente os
                        dados do Dossiê.
                    </p>
                </div>
            )}

            <div className="flex flex-col-reverse gap-3 border-t pt-5 sm:flex-row sm:items-center sm:justify-between">
                <Button
                    type="button"
                    variant="outline"
                    onClick={onBack}
                >
                    <ArrowLeft className="mr-2 size-4" />
                    Voltar para documentos
                </Button>

                <Button
                    type="button"
                    onClick={onContinue}
                >
                    Continuar para revisão
                    <ArrowRight className="ml-2 size-4" />
                </Button>
            </div>
        </div>
    )
}

function IssueMetric({
    icon: Icon,
    label,
    value,
    healthy,
}: {
    icon: typeof Paperclip
    label: string
    value: number
    healthy: boolean
}) {
    return (
        <Card>
            <CardContent className="flex items-start gap-4 p-5">
                <div
                    className={
                        healthy
                            ? "rounded-xl bg-primary/10 p-3 text-primary"
                            : "rounded-xl bg-destructive/10 p-3 text-destructive"
                    }
                >
                    <Icon className="size-5" />
                </div>

                <div>
                    <p className="text-sm text-muted-foreground">
                        {label}
                    </p>

                    <p className="mt-1 text-2xl font-semibold">
                        {value}
                    </p>
                </div>
            </CardContent>
        </Card>
    )
}