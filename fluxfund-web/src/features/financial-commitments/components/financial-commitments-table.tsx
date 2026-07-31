import {
    ArrowDownToLine,
    ArrowUpFromLine,
} from "lucide-react"

import {
    Badge,
} from "@/components/ui/badge"

import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"

import {
    financialCommitmentRecurrenceLabels,
    financialCommitmentStatusLabels,
    financialCommitmentTypeLabels,
} from "../financial-commitment-labels"

import type {
    FinancialCommitment,
    FinancialCommitmentStatus,
} from "../financial-commitment-types"
import { FinancialCommitmentActions } from "./financial-commitment-actions"

type FinancialCommitmentsTableProps = {
    commitments:
    FinancialCommitment[]

    isLoading?: boolean
}

export function FinancialCommitmentsTable({
    commitments,
    isLoading = false,
}: FinancialCommitmentsTableProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>
                    Compromissos cadastrados
                </CardTitle>
            </CardHeader>

            <CardContent>
                {isLoading ? (
                    <div className="flex h-48 items-center justify-center rounded-lg border border-dashed">
                        <p className="text-sm text-muted-foreground">
                            Carregando compromissos financeiros...
                        </p>
                    </div>
                ) : commitments.length === 0 ? (
                    <div className="flex h-48 items-center justify-center rounded-lg border border-dashed">
                        <p className="text-sm text-muted-foreground">
                            Nenhum compromisso encontrado com os filtros selecionados.
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>
                                        Direção
                                    </TableHead>

                                    <TableHead>
                                        Tipo
                                    </TableHead>

                                    <TableHead>
                                        Contato principal
                                    </TableHead>

                                    <TableHead>
                                        Destinação
                                    </TableHead>

                                    <TableHead>
                                        Fundo
                                    </TableHead>

                                    <TableHead>
                                        Valor
                                    </TableHead>

                                    <TableHead>
                                        Recorrência
                                    </TableHead>

                                    <TableHead>
                                        Vigência
                                    </TableHead>

                                    <TableHead>
                                        Status
                                    </TableHead>

                                    <TableHead className="w-12">
                                        <span className="sr-only">
                                            Ações
                                        </span>
                                    </TableHead>
                                </TableRow>
                            </TableHeader>

                            <TableBody>
                                {commitments.map(
                                    (commitment) => {
                                        const DirectionIcon =
                                            commitment.direction ===
                                                "RECEIVABLE"
                                                ? ArrowDownToLine
                                                : ArrowUpFromLine

                                        return (
                                            <TableRow
                                                key={
                                                    commitment.id
                                                }
                                            >
                                                <TableCell>
                                                    <Badge
                                                        variant={
                                                            commitment.direction ===
                                                                "RECEIVABLE"
                                                                ? "default"
                                                                : "outline"
                                                        }
                                                    >
                                                        <DirectionIcon className="mr-1 size-3.5" />

                                                        {commitment.direction ===
                                                            "RECEIVABLE"
                                                            ? "A receber"
                                                            : "A pagar"}
                                                    </Badge>
                                                </TableCell>

                                                <TableCell>
                                                    <div className="min-w-40">
                                                        {
                                                            financialCommitmentTypeLabels[
                                                            commitment
                                                                .commitmentType
                                                            ]
                                                        }
                                                    </div>
                                                </TableCell>

                                                <TableCell>
                                                    <div className="min-w-48">
                                                        <p className="font-medium">
                                                            {
                                                                commitment
                                                                    .party
                                                                    .name
                                                            }
                                                        </p>

                                                        <p className="text-xs text-muted-foreground">
                                                            {commitment.direction ===
                                                                "RECEIVABLE"
                                                                ? "Deve enviar"
                                                                : "Deve receber"}
                                                        </p>
                                                    </div>
                                                </TableCell>

                                                <TableCell>
                                                    {commitment.direction ===
                                                        "PAYABLE" ? (
                                                        <span className="text-muted-foreground">
                                                            —
                                                        </span>
                                                    ) : commitment
                                                        .designatedRecipient ? (
                                                        <div className="min-w-48">
                                                            <p className="font-medium">
                                                                {
                                                                    commitment
                                                                        .designatedRecipient
                                                                        .name
                                                                }
                                                            </p>

                                                            <p className="text-xs text-muted-foreground">
                                                                Oferta destinada
                                                            </p>
                                                        </div>
                                                    ) : (
                                                        <div className="min-w-40">
                                                            <p className="text-muted-foreground">
                                                                Somente ao fundo
                                                            </p>

                                                            <p className="text-xs text-muted-foreground">
                                                                Sem destinatário individual
                                                            </p>
                                                        </div>
                                                    )}
                                                </TableCell>

                                                <TableCell>
                                                    <div className="min-w-40">
                                                        {
                                                            commitment
                                                                .fund
                                                                .name
                                                        }
                                                    </div>
                                                </TableCell>

                                                <TableCell className="font-medium">
                                                    {formatCurrency(
                                                        commitment.amount,
                                                    )}
                                                </TableCell>

                                                <TableCell>
                                                    <div className="min-w-32">
                                                        <p>
                                                            {
                                                                financialCommitmentRecurrenceLabels[
                                                                commitment
                                                                    .recurrence
                                                                ]
                                                            }
                                                        </p>

                                                        {commitment.dueDay && (
                                                            <p className="text-xs text-muted-foreground">
                                                                Dia{" "}
                                                                {
                                                                    commitment
                                                                        .dueDay
                                                                }
                                                            </p>
                                                        )}
                                                    </div>
                                                </TableCell>

                                                <TableCell>
                                                    <div className="min-w-44 text-sm">
                                                        {commitment.recurrence ===
                                                            "ONE_TIME" ? (
                                                            <p>
                                                                {
                                                                    formatDate(
                                                                        commitment
                                                                            .startDate,
                                                                    )
                                                                }
                                                            </p>
                                                        ) : (
                                                            <>
                                                                <p>
                                                                    Início:{" "}
                                                                    {
                                                                        formatDate(
                                                                            commitment
                                                                                .startDate,
                                                                        )
                                                                    }
                                                                </p>

                                                                <p className="text-xs text-muted-foreground">
                                                                    Fim:{" "}
                                                                    {commitment
                                                                        .endDate
                                                                        ? formatDate(
                                                                            commitment
                                                                                .endDate,
                                                                        )
                                                                        : "sem data final"}
                                                                </p>
                                                            </>
                                                        )}
                                                    </div>
                                                </TableCell>

                                                <TableCell>
                                                    <FinancialCommitmentStatusBadge
                                                        status={
                                                            commitment.status
                                                        }
                                                    />
                                                </TableCell>

                                                <TableCell className="text-right">
                                                    <FinancialCommitmentActions
                                                        commitment={
                                                            commitment
                                                        }
                                                    />
                                                </TableCell>
                                            </TableRow>
                                        )
                                    },
                                )}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

function FinancialCommitmentStatusBadge({
    status,
}: {
    status:
    FinancialCommitmentStatus
}) {
    const label =
        financialCommitmentStatusLabels[
        status
        ]

    switch (status) {
        case "ACTIVE":
            return (
                <Badge>
                    {label}
                </Badge>
            )

        case "SCHEDULED":
            return (
                <Badge variant="outline">
                    {label}
                </Badge>
            )

        case "EXPIRED":
            return (
                <Badge variant="secondary">
                    {label}
                </Badge>
            )

        case "INACTIVE":
            return (
                <Badge
                    variant="secondary"
                    className="text-muted-foreground"
                >
                    {label}
                </Badge>
            )
    }
}

function formatCurrency(
    value: number,
) {
    return new Intl.NumberFormat(
        "pt-BR",
        {
            style: "currency",
            currency: "BRL",
        },
    ).format(value)
}

function formatDate(
    value: string,
) {
    return new Intl.DateTimeFormat(
        "pt-BR",
        {
            dateStyle: "short",
        },
    ).format(
        new Date(
            `${value}T00:00:00`,
        ),
    )
}