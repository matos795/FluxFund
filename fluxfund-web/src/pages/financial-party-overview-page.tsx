import type {
    LucideIcon,
} from "lucide-react"

import {
    ArrowDownToLine,
    ArrowLeft,
    ArrowUpFromLine,
    FileSignature,
    HandHeart,
    Mail,
    MapPin,
    Phone,
    ReceiptText,
    UserRound,
} from "lucide-react"

import {
    Link,
    useParams,
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
} from "@/components/ui/card"

import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs"

import {
    financialCommitmentDirectionLabels,
    financialCommitmentRecurrenceLabels,
    financialCommitmentStatusLabels,
    financialCommitmentTypeLabels,
} from "@/features/financial-commitments/financial-commitment-labels"

import {
    financialPartyClassificationLabels,
    financialPartyRoleLabels,
    financialPartyTypeLabels,
    formatFinancialPartyDocument,
} from "@/features/financial-parties/financial-party-labels"

import {
    useFinancialPartyOverview,
} from "@/features/financial-parties/hooks/use-financial-party-overview"

import {
    ReceiptActions,
} from "@/features/receipts/components/receipt-actions"

import {
    receiptStatusLabels,
    receiptTypeLabels,
} from "@/features/receipts/receipt-labels"

import {
    formatCurrency,
    formatDate,
    formatReferenceMonth,
} from "@/utils/formatters"
import { formatPhone } from "@/utils/input-masks"

const activityRoleLabels = {
    INCOME_SOURCE:
        "Origem da receita",

    DESIGNATED_RECIPIENT:
        "Destinatário indicado",

    PAYMENT_RECIPIENT:
        "Recebedor do pagamento",
} as const

const supportStatusLabels = {
    ACTIVE:
        "Vigente",

    SCHEDULED:
        "Agendado",

    EXPIRED:
        "Encerrado",

    INACTIVE:
        "Desativado",
} as const

export function FinancialPartyOverviewPage() {
    const {
        partyId,
    } =
        useParams<{
            partyId: string
        }>()

    const query =
        useFinancialPartyOverview(
            partyId,
        )

    if (query.isLoading) {
        return (
            <div className="space-y-4">
                <div className="h-40 animate-pulse rounded-2xl border bg-muted/30" />

                <div className="grid gap-4 md:grid-cols-4">
                    {Array.from({
                        length: 4,
                    }).map(
                        (_, index) => (
                            <div
                                key={index}
                                className="h-28 animate-pulse rounded-xl border bg-muted/30"
                            />
                        ),
                    )}
                </div>
            </div>
        )
    }

    if (
        query.isError ||
        !query.data
    ) {
        return (
            <div className="space-y-4">
                <Button
                    asChild
                    variant="ghost"
                >
                    <Link to="/financial-parties">
                        <ArrowLeft className="mr-2 size-4" />
                        Voltar
                    </Link>
                </Button>

                <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-6 text-sm text-destructive">
                    Não foi possível carregar a visão completa deste contato.
                </div>
            </div>
        )
    }

    const {
        party,
        summary,
        recentActivities,
        commitments,
        supportAgreements,
        receipts,
    } =
        query.data

    const address =
        [
            party.addressLine,
            party.addressNumber,
            party.addressComplement,
            party.neighborhood,
            party.city &&
                party.state
                ? `${party.city}/${party.state}`
                : party.city ||
                party.state,
        ]
            .filter(
                Boolean,
            )
            .join(", ")

    return (
        <div className="space-y-6">
            <Button
                asChild
                variant="ghost"
                className="-ml-3"
            >
                <Link to="/financial-parties">
                    <ArrowLeft className="mr-2 size-4" />
                    Voltar aos contatos
                </Link>
            </Button>

            <section className="overflow-hidden rounded-2xl border bg-gradient-to-br from-primary/10 via-background to-background p-6">
                <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-start">
                    <div className="flex gap-4">
                        <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-primary text-xl font-semibold text-primary-foreground">
                            {party.name
                                .split(/\s+/)
                                .slice(0, 2)
                                .map(
                                    (part) =>
                                        part[0],
                                )
                                .join("")
                                .toUpperCase()}
                        </div>

                        <div>
                            <div className="flex flex-wrap items-center gap-2">
                                <h1 className="text-2xl font-semibold tracking-tight">
                                    {party.name}
                                </h1>

                                <Badge
                                    variant={
                                        party.active
                                            ? "default"
                                            : "secondary"
                                    }
                                >
                                    {party.active
                                        ? "Ativo"
                                        : "Inativo"}
                                </Badge>
                            </div>

                            {party.legalName &&
                                party.legalName !==
                                party.name && (
                                    <p className="mt-1 text-sm text-muted-foreground">
                                        {party.legalName}
                                    </p>
                                )}

                            <div className="mt-3 flex flex-wrap gap-2">
                                <Badge variant="outline">
                                    {
                                        financialPartyTypeLabels[
                                        party.partyType
                                        ]
                                    }
                                </Badge>

                                <Badge variant="outline">
                                    {
                                        financialPartyClassificationLabels[
                                        party.type
                                        ]
                                    }
                                </Badge>

                                {party.roles.map(
                                    (role) => (
                                        <Badge
                                            key={
                                                role
                                            }
                                            variant="secondary"
                                        >
                                            {
                                                financialPartyRoleLabels[
                                                role
                                                ]
                                            }
                                        </Badge>
                                    ),
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="grid gap-2 text-sm sm:grid-cols-2 lg:max-w-xl">
                        <ContactLine
                            icon={
                                UserRound
                            }
                            value={formatFinancialPartyDocument(
                                party.document,
                                party.partyType,
                            )}
                        />

                        <ContactLine
                            icon={
                                Phone
                            }
                            value={
                                party.phone
                                    ? formatPhone(party.phone)
                                    : "Telefone não informado"
                            }
                        />

                        <ContactLine
                            icon={
                                Mail
                            }
                            value={
                                party.email ||
                                "E-mail não informado"
                            }
                        />

                        <ContactLine
                            icon={
                                MapPin
                            }
                            value={
                                address ||
                                "Endereço não informado"
                            }
                        />
                    </div>
                </div>

                {party.notes && (
                    <p className="mt-5 border-t pt-4 text-sm text-muted-foreground">
                        {party.notes}
                    </p>
                )}
            </section>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <SummaryCard
                    label="Recebido deste contato"
                    value={
                        summary.receivedFromParty
                    }
                    icon={
                        ArrowDownToLine
                    }
                />

                <SummaryCard
                    label="Destinado a este contato"
                    value={
                        summary.destinedToParty
                    }
                    icon={
                        HandHeart
                    }
                />

                <SummaryCard
                    label="Pago a este contato"
                    value={
                        summary.paidToParty
                    }
                    icon={
                        ArrowUpFromLine
                    }
                />

                <SummaryCard
                    label="Valor em recibos emitidos"
                    value={
                        summary.issuedReceiptAmount
                    }
                    icon={
                        FileSignature
                    }
                />
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <CountCard
                    label="Movimentações"
                    value={
                        summary.transactionCount
                    }
                />

                <CountCard
                    label="Compromissos vigentes"
                    value={
                        summary.activeCommitmentCount
                    }
                />

                <CountCard
                    label="Sustentos vigentes"
                    value={
                        summary.activeSupportAgreementCount
                    }
                />

                <CountCard
                    label="Recibos emitidos"
                    value={
                        summary.issuedReceiptCount
                    }
                />
            </div>

            <Tabs
                defaultValue="activities"
                className="space-y-5"
            >
                <TabsList className="grid h-auto w-full grid-cols-2 gap-1 lg:grid-cols-4">
                    <TabsTrigger value="activities">
                        Movimentações
                    </TabsTrigger>

                    <TabsTrigger value="commitments">
                        Compromissos
                    </TabsTrigger>

                    <TabsTrigger value="support">
                        Sustento
                    </TabsTrigger>

                    <TabsTrigger value="receipts">
                        Recibos
                    </TabsTrigger>
                </TabsList>

                <TabsContent
                    value="activities"
                    className="space-y-3"
                >
                    {recentActivities.length ===
                        0 ? (
                        <EmptyState text="Nenhuma movimentação relacionada a este contato." />
                    ) : (
                        recentActivities.map(
                            (activity) => (
                                <Card
                                    key={
                                        activity.allocationId
                                    }
                                >
                                    <CardContent className="flex flex-col justify-between gap-4 p-5 lg:flex-row lg:items-center">
                                        <div className="min-w-0">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <p className="font-medium">
                                                    {
                                                        activity.description
                                                    }
                                                </p>

                                                <Badge variant="outline">
                                                    {activity.transactionType ===
                                                        "INCOME"
                                                        ? "Receita"
                                                        : "Despesa"}
                                                </Badge>

                                                {activity.roles.map(
                                                    (role) => (
                                                        <Badge
                                                            key={
                                                                role
                                                            }
                                                            variant="secondary"
                                                        >
                                                            {
                                                                activityRoleLabels[
                                                                role
                                                                ]
                                                            }
                                                        </Badge>
                                                    ),
                                                )}
                                            </div>

                                            <p className="mt-2 text-sm text-muted-foreground">
                                                {activity.accountName}
                                                {" · "}
                                                {activity.fundName}
                                                {" · "}
                                                {formatDate(
                                                    activity.settlementDate,
                                                )}
                                            </p>

                                            {activity.referenceMonth && (
                                                <p className="mt-1 text-xs text-muted-foreground">
                                                    Competência{" "}
                                                    {formatReferenceMonth(
                                                        activity.referenceMonth,
                                                    )}
                                                </p>
                                            )}
                                        </div>

                                        <div className="text-left lg:text-right">
                                            <p className="text-lg font-semibold">
                                                {formatCurrency(
                                                    activity.amount,
                                                )}
                                            </p>

                                            {activity.financialCommitment && (
                                                <p className="mt-1 text-xs text-muted-foreground">
                                                    {
                                                        financialCommitmentTypeLabels[
                                                        activity
                                                            .financialCommitment
                                                            .commitmentType
                                                        ]
                                                    }
                                                </p>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            ),
                        )
                    )}
                </TabsContent>

                <TabsContent
                    value="commitments"
                    className="space-y-3"
                >
                    {commitments.length ===
                        0 ? (
                        <EmptyState text="Nenhum compromisso financeiro relacionado." />
                    ) : (
                        commitments.map(
                            (commitment) => (
                                <Card
                                    key={
                                        commitment.id
                                    }
                                >
                                    <CardContent className="grid gap-4 p-5 lg:grid-cols-[1fr_auto]">
                                        <div>
                                            <div className="flex flex-wrap items-center gap-2">
                                                <p className="font-semibold">
                                                    {
                                                        financialCommitmentTypeLabels[
                                                        commitment
                                                            .commitmentType
                                                        ]
                                                    }
                                                </p>

                                                <Badge variant="outline">
                                                    {
                                                        financialCommitmentDirectionLabels[
                                                        commitment.direction
                                                        ]
                                                    }
                                                </Badge>

                                                <Badge variant="secondary">
                                                    {
                                                        financialCommitmentStatusLabels[
                                                        commitment.status
                                                        ]
                                                    }
                                                </Badge>
                                            </div>

                                            <p className="mt-3 text-sm">
                                                <span className="text-muted-foreground">
                                                    {commitment.direction ===
                                                        "RECEIVABLE"
                                                        ? "Compromitente:"
                                                        : "Parte principal:"}
                                                </span>{" "}

                                                <strong>
                                                    {commitment.party.name}
                                                </strong>
                                            </p>

                                            <p className="mt-2 text-sm text-muted-foreground">
                                                Fundo{" "}
                                                {
                                                    commitment
                                                        .fund.name
                                                }
                                                {" · "}
                                                {
                                                    financialCommitmentRecurrenceLabels[
                                                    commitment
                                                        .recurrence
                                                    ]
                                                }
                                            </p>

                                            {commitment.designatedRecipient && (
                                                <p className="mt-1 text-sm text-muted-foreground">
                                                    Destinado a{" "}
                                                    {
                                                        commitment
                                                            .designatedRecipient
                                                            .name
                                                    }
                                                </p>
                                            )}
                                        </div>

                                        <div className="lg:text-right">
                                            <p className="text-lg font-semibold">
                                                {formatCurrency(
                                                    commitment.amount,
                                                )}
                                            </p>

                                            <p className="mt-1 text-xs text-muted-foreground">
                                                Desde{" "}
                                                {formatDate(
                                                    commitment.startDate,
                                                )}
                                            </p>
                                        </div>
                                    </CardContent>
                                </Card>
                            ),
                        )
                    )}
                </TabsContent>

                <TabsContent
                    value="support"
                    className="space-y-3"
                >
                    {supportAgreements.length ===
                        0 ? (
                        <EmptyState text="Este contato não possui compromissos de Sustento." />
                    ) : (
                        supportAgreements.map(
                            (agreement) => (
                                <Card
                                    key={
                                        agreement.id
                                    }
                                >
                                    <CardContent className="flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <p className="font-semibold">
                                                    Sustento mensal
                                                </p>

                                                <Badge variant="secondary">
                                                    {
                                                        supportStatusLabels[
                                                        agreement.status
                                                        ]
                                                    }
                                                </Badge>
                                            </div>

                                            <p className="mt-2 text-sm text-muted-foreground">
                                                Fundo{" "}
                                                {
                                                    agreement.fund
                                                        .name
                                                }
                                                {" · "}
                                                Início{" "}
                                                {formatDate(
                                                    agreement.startDate,
                                                )}
                                            </p>

                                            {agreement.description && (
                                                <p className="mt-1 text-sm text-muted-foreground">
                                                    {
                                                        agreement.description
                                                    }
                                                </p>
                                            )}
                                        </div>

                                        <p className="text-lg font-semibold">
                                            {formatCurrency(
                                                agreement.amount,
                                            )}
                                        </p>
                                    </CardContent>
                                </Card>
                            ),
                        )
                    )}
                </TabsContent>

                <TabsContent
                    value="receipts"
                    className="space-y-3"
                >
                    {receipts.length ===
                        0 ? (
                        <EmptyState text="Nenhum recibo vinculado a este contato." />
                    ) : (
                        receipts.map(
                            (receipt) => (
                                <Card
                                    key={
                                        receipt.id
                                    }
                                >
                                    <CardContent className="flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center">
                                        <div>
                                            <div className="flex flex-wrap items-center gap-2">
                                                <p className="font-semibold">
                                                    {receipt.receiptNumber ??
                                                        "Rascunho"}
                                                </p>

                                                <Badge
                                                    variant={
                                                        receipt.status ===
                                                            "ISSUED"
                                                            ? "default"
                                                            : receipt.status ===
                                                                "CANCELED"
                                                                ? "destructive"
                                                                : "secondary"
                                                    }
                                                >
                                                    {
                                                        receiptStatusLabels[
                                                        receipt.status
                                                        ]
                                                    }
                                                </Badge>
                                            </div>

                                            <p className="mt-2 text-sm text-muted-foreground">
                                                {
                                                    receiptTypeLabels[
                                                    receipt.receiptType
                                                    ]
                                                }
                                                {" · "}
                                                {formatDate(
                                                    receipt.paymentDate,
                                                )}
                                            </p>
                                        </div>

                                        <div className="flex items-center justify-between gap-3 sm:justify-end">
                                            <p className="text-lg font-semibold">
                                                {formatCurrency(
                                                    receipt.amount,
                                                )}
                                            </p>

                                            <ReceiptActions
                                                receipt={
                                                    receipt
                                                }
                                            />
                                        </div>
                                    </CardContent>
                                </Card>
                            ),
                        )
                    )}
                </TabsContent>
            </Tabs>
        </div>
    )
}

function SummaryCard({
    label,
    value,
    icon: Icon,
}: {
    label: string
    value: number
    icon: LucideIcon
}) {
    return (
        <Card>
            <CardContent className="flex items-center justify-between gap-4 p-5">
                <div>
                    <p className="text-sm text-muted-foreground">
                        {label}
                    </p>

                    <p className="mt-1 text-2xl font-semibold">
                        {formatCurrency(
                            value,
                        )}
                    </p>
                </div>

                <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="size-5" />
                </div>
            </CardContent>
        </Card>
    )
}

function CountCard({
    label,
    value,
}: {
    label: string
    value: number
}) {
    return (
        <Card>
            <CardContent className="p-4">
                <p className="text-2xl font-semibold">
                    {value}
                </p>

                <p className="text-xs text-muted-foreground">
                    {label}
                </p>
            </CardContent>
        </Card>
    )
}

function ContactLine({
    icon: Icon,
    value,
}: {
    icon: LucideIcon
    value: string
}) {
    return (
        <div className="flex min-w-0 items-center gap-2 rounded-lg border bg-background/70 p-3">
            <Icon className="size-4 shrink-0 text-muted-foreground" />

            <span className="truncate">
                {value}
            </span>
        </div>
    )
}

function EmptyState({
    text,
}: {
    text: string
}) {
    return (
        <div className="rounded-2xl border border-dashed p-10 text-center">
            <ReceiptText className="mx-auto size-9 text-muted-foreground" />

            <p className="mt-3 text-sm text-muted-foreground">
                {text}
            </p>
        </div>
    )
}