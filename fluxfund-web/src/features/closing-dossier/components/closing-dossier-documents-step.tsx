import {
    ArrowLeft,
    ArrowRight,
    CreditCard,
    Landmark,
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

import {
    formatCurrency,
    formatDate,
} from "@/utils/formatters"

import type {
    ClosingDossierPreview,
} from "../closing-dossier-types"

import {
    ClosingDossierAccountCard,
} from "./closing-dossier-account-card"

import {
    ClosingDossierExtraDocumentsSection,
} from "./closing-dossier-extra-documents-section"

type ClosingDossierDocumentsStepProps = {
    preview: ClosingDossierPreview
    canManageDocuments: boolean
    onDocumentsChanged: () => void
    onBack: () => void
    onContinue: () => void
}

const statementStatusLabels = {
    OPEN: "Aberta",
    CLOSED: "Fechada",
    PAID: "Paga",
    CANCELED: "Cancelada",
} as const

export function ClosingDossierDocumentsStep({
    preview,
    canManageDocuments,
    onDocumentsChanged,
    onBack,
    onContinue,
}: ClosingDossierDocumentsStepProps) {
    const includedAccounts =
        preview.accounts.filter(
            (account) =>
                account.includedInDossier,
        )

    return (
        <div className="space-y-6">
            <section>
                <h2 className="text-xl font-semibold">
                    Documentos do fechamento
                </h2>

                <p className="mt-1 text-sm text-muted-foreground">
                    Confira os documentos oficiais que acompanharão
                    o Dossiê antes de analisar as pendências.
                </p>
            </section>

            <div className="grid gap-4 md:grid-cols-2">
                <StatusCard
                    icon={Landmark}
                    label="Extratos pendentes"
                    value={
                        preview
                            .accountsWithoutBankStatementCount
                    }
                    description={
                        preview
                            .accountsWithoutBankStatementCount ===
                            0
                            ? "Todos os extratos obrigatórios estão disponíveis."
                            : "Há contas sem o PDF oficial do período."
                    }
                    healthy={
                        preview
                            .accountsWithoutBankStatementCount ===
                        0
                    }
                />

                <StatusCard
                    icon={CreditCard}
                    label="PDFs de fatura pendentes"
                    value={
                        preview
                            .creditCardStatementsWithoutPdfCount
                    }
                    description={
                        preview
                            .creditCardStatementsWithoutPdfCount ===
                            0
                            ? "Todas as faturas possuem documento oficial."
                            : "Há faturas sem o PDF oficial anexado."
                    }
                    healthy={
                        preview
                            .creditCardStatementsWithoutPdfCount ===
                        0
                    }
                />
            </div>

            <section className="space-y-4">
                <div>
                    <h3 className="text-lg font-semibold">
                        Extratos das contas
                    </h3>

                    <p className="mt-1 text-sm text-muted-foreground">
                        Confira ou envie o extrato oficial de cada
                        conta incluída neste fechamento.
                    </p>
                </div>

                <div className="space-y-4">
                    {includedAccounts.map(
                        (account) => (
                            <ClosingDossierAccountCard
                                key={account.accountId}
                                account={account}
                                periodStartDate={
                                    preview.periodStartDate
                                }
                                periodEndDate={
                                    preview.periodEndDate
                                }
                                canManageDocuments={
                                    canManageDocuments
                                }
                                onDocumentsChanged={
                                    onDocumentsChanged
                                }
                                showIssues={false}
                            />
                        ),
                    )}
                </div>
            </section>

            <section className="space-y-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <h3 className="text-lg font-semibold">
                            Faturas de cartão
                        </h3>

                        <p className="mt-1 text-sm text-muted-foreground">
                            Faturas relacionadas às compras do período
                            são incluídas automaticamente.
                        </p>
                    </div>

                    <Button
                        asChild
                        type="button"
                        variant="outline"
                        size="sm"
                    >
                        <Link
                            to="/credit-card-statements"
                            target="_blank"
                            rel="noreferrer"
                        >
                            <CreditCard className="mr-2 size-4" />
                            Gerenciar faturas
                        </Link>
                    </Button>
                </div>

                {preview.creditCardStatements.length ===
                    0 ? (
                    <Card>
                        <CardContent className="p-6 text-sm text-muted-foreground">
                            Nenhuma fatura de cartão faz parte deste
                            fechamento.
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {preview.creditCardStatements.map(
                            (statement) => (
                                <Card
                                    key={
                                        statement.statementId
                                    }
                                >
                                    <CardHeader className="pb-3">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <CardTitle className="truncate text-base">
                                                    {
                                                        statement.statementName
                                                    }
                                                </CardTitle>

                                                <p className="mt-1 truncate text-sm text-muted-foreground">
                                                    {
                                                        statement.creditCardAccountName
                                                    }
                                                </p>
                                            </div>

                                            <Badge variant="outline">
                                                {
                                                    statementStatusLabels[
                                                    statement
                                                        .status
                                                    ]
                                                }
                                            </Badge>
                                        </div>
                                    </CardHeader>

                                    <CardContent className="space-y-4">
                                        <div className="grid grid-cols-2 gap-3 text-sm">
                                            <div>
                                                <p className="text-xs text-muted-foreground">
                                                    Vencimento
                                                </p>

                                                <p className="mt-1 font-medium">
                                                    {formatDate(
                                                        statement.dueDate,
                                                    )}
                                                </p>
                                            </div>

                                            <div>
                                                <p className="text-xs text-muted-foreground">
                                                    Total
                                                </p>

                                                <p className="mt-1 font-medium">
                                                    {formatCurrency(
                                                        statement.totalAmount,
                                                    )}
                                                </p>
                                            </div>

                                            <div>
                                                <p className="text-xs text-muted-foreground">
                                                    Itens
                                                </p>

                                                <p className="mt-1 font-medium">
                                                    {statement.itemCount}
                                                </p>
                                            </div>

                                            <div>
                                                <p className="text-xs text-muted-foreground">
                                                    PDF oficial
                                                </p>

                                                <p className="mt-1 font-medium">
                                                    {statement.hasOfficialPdf
                                                        ? "Disponível"
                                                        : "Pendente"}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="border-t pt-3">
                                            <Badge
                                                variant={
                                                    statement.hasOfficialPdf
                                                        ? "secondary"
                                                        : "destructive"
                                                }
                                            >
                                                {statement.hasOfficialPdf
                                                    ? "Documento pronto"
                                                    : "PDF oficial pendente"}
                                            </Badge>
                                        </div>
                                    </CardContent>
                                </Card>
                            ),
                        )}
                    </div>
                )}
            </section>

            <ClosingDossierExtraDocumentsSection
                periodStartDate={
                    preview.periodStartDate
                }
                periodEndDate={
                    preview.periodEndDate
                }
                canManageDocuments={
                    canManageDocuments
                }
            />

            <div className="flex flex-col-reverse gap-3 border-t pt-5 sm:flex-row sm:items-center sm:justify-between">
                <Button
                    type="button"
                    variant="outline"
                    onClick={onBack}
                >
                    <ArrowLeft className="mr-2 size-4" />
                    Voltar para configuração
                </Button>

                <Button
                    type="button"
                    onClick={onContinue}
                >
                    Continuar para pendências
                    <ArrowRight className="ml-2 size-4" />
                </Button>
            </div>
        </div>
    )
}

function StatusCard({
    icon: Icon,
    label,
    value,
    description,
    healthy,
}: {
    icon: typeof Landmark
    label: string
    value: number
    description: string
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

                    <p className="mt-1 text-xs text-muted-foreground">
                        {description}
                    </p>
                </div>
            </CardContent>
        </Card>
    )
}