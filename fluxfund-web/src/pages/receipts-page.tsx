import {
    useMemo,
    useState,
} from "react"

import {
    FileCheck2,
    FileClock,
    FileSignature,
    FileX2,
    Plus,
} from "lucide-react"

import {
    PageHeader,
} from "@/components/layout/page-header"

import {
    PagePagination,
} from "@/components/pagination/page-pagination"

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
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"

import {
    ReceiptActions,
} from "@/features/receipts/components/receipt-actions"

import {
    ReceiptDraftDialog,
} from "@/features/receipts/components/receipt-draft-dialog"

import {
    receiptSourceTypeLabels,
    receiptStatusLabels,
    receiptTypeLabels,
} from "@/features/receipts/receipt-labels"

import {
    useReceipts,
} from "@/features/receipts/hooks/use-receipts"

import type {
    ReceiptStatus,
    ReceiptType,
} from "@/features/receipts/receipt-types"

import {
    formatCurrency,
    formatDate,
} from "@/utils/formatters"
import { EntityCombobox } from "@/components/form/entity-combobox"

const PAGE_SIZE =
    10

export function ReceiptsPage() {
    const [
        page,
        setPage,
    ] = useState(
        0,
    )

    const [
        status,
        setStatus,
    ] = useState<
        ReceiptStatus | ""
    >("")

    const [
        receiptType,
        setReceiptType,
    ] = useState<
        ReceiptType | ""
    >("")

    const [
        createOpen,
        setCreateOpen,
    ] = useState(
        false,
    )

    const query =
        useReceipts({
            page,
            size:
                PAGE_SIZE,

            status:
                status ||
                undefined,

            receiptType:
                receiptType ||
                undefined,
        })

    const receipts =
        query.data?.content ??
        []

    const pageCounts =
        useMemo(
            () => ({
                drafts:
                    receipts.filter(
                        (receipt) =>
                            receipt.status ===
                            "DRAFT",
                    ).length,

                issued:
                    receipts.filter(
                        (receipt) =>
                            receipt.status ===
                            "ISSUED",
                    ).length,

                canceled:
                    receipts.filter(
                        (receipt) =>
                            receipt.status ===
                            "CANCELED",
                    ).length,
            }),
            [
                receipts,
            ],
        )

    return (
        <div className="space-y-6">
            <PageHeader
                title="Recibos"
                description="Crie, emita, imprima e acompanhe recibos de valores recebidos ou pagos."
            >
                <Button
                    onClick={() =>
                        setCreateOpen(
                            true,
                        )
                    }
                >
                    <Plus className="mr-2 size-4" />
                    Novo recibo
                </Button>
            </PageHeader>

            <section className="overflow-hidden rounded-2xl border bg-gradient-to-br from-primary/10 via-background to-background p-6">
                <div className="flex max-w-3xl gap-4">
                    <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
                        <FileSignature className="size-6" />
                    </div>

                    <div>
                        <h2 className="text-lg font-semibold">
                            Da movimentação ao documento impresso
                        </h2>

                        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                            Use dados de transações, alocações e contatos já cadastrados ou informe manualmente quando a pessoa ainda não estiver no FluxFund.
                        </p>
                    </div>
                </div>
            </section>

            <div className="grid gap-3 sm:grid-cols-3">
                <SummaryCard
                    label="Rascunhos nesta página"
                    value={
                        pageCounts.drafts
                    }
                    icon={
                        FileClock
                    }
                />

                <SummaryCard
                    label="Emitidos nesta página"
                    value={
                        pageCounts.issued
                    }
                    icon={
                        FileCheck2
                    }
                />

                <SummaryCard
                    label="Cancelados nesta página"
                    value={
                        pageCounts.canceled
                    }
                    icon={
                        FileX2
                    }
                />
            </div>

            <Card>
                <CardContent className="grid gap-4 p-5 md:grid-cols-2">
                    <Select
                        value={
                            status ||
                            "ALL"
                        }
                        onValueChange={(
                            value,
                        ) => {
                            setStatus(
                                value ===
                                    "ALL"
                                    ? ""
                                    : value as
                                    ReceiptStatus,
                            )

                            setPage(
                                0,
                            )
                        }}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Situação" />
                        </SelectTrigger>

                        <SelectContent>
                            <SelectItem value="ALL">
                                Todas as situações
                            </SelectItem>

                            {(
                                Object.keys(
                                    receiptStatusLabels,
                                ) as
                                ReceiptStatus[]
                            ).map(
                                (item) => (
                                    <SelectItem
                                        key={
                                            item
                                        }
                                        value={
                                            item
                                        }
                                    >
                                        {
                                            receiptStatusLabels[
                                            item
                                            ]
                                        }
                                    </SelectItem>
                                ),
                            )}
                        </SelectContent>
                    </Select>

                    <EntityCombobox
                        value={
                            receiptType
                        }
                        options={
                            (
                                Object.keys(
                                    receiptTypeLabels,
                                ) as
                                ReceiptType[]
                            ).map(
                                (type) => ({
                                    value:
                                        type,

                                    label:
                                        receiptTypeLabels[
                                        type
                                        ],
                                }),
                            )
                        }
                        placeholder="Todos os tipos"
                        searchPlaceholder="Buscar tipo de recibo..."
                        emptyMessage="Nenhum tipo encontrado."
                        allowClear
                        clearLabel="Todos os tipos"
                        onChange={(
                            value,
                        ) => {
                            setReceiptType(
                                value as
                                | ReceiptType
                                | "",
                            )

                            setPage(
                                0,
                            )
                        }}
                    />
                </CardContent>
            </Card>

            <Card className="overflow-hidden">
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>
                                        Número
                                    </TableHead>

                                    <TableHead>
                                        Situação
                                    </TableHead>

                                    <TableHead>
                                        Tipo
                                    </TableHead>

                                    <TableHead>
                                        Pessoa / empresa
                                    </TableHead>

                                    <TableHead>
                                        Origem
                                    </TableHead>

                                    <TableHead>
                                        Pagamento
                                    </TableHead>

                                    <TableHead className="text-right">
                                        Valor
                                    </TableHead>

                                    <TableHead className="w-16" />
                                </TableRow>
                            </TableHeader>

                            <TableBody>
                                {query.isLoading ? (
                                    <TableRow>
                                        <TableCell
                                            colSpan={
                                                8
                                            }
                                            className="h-32 text-center text-muted-foreground"
                                        >
                                            Carregando recibos...
                                        </TableCell>
                                    </TableRow>
                                ) : receipts.length ===
                                    0 ? (
                                    <TableRow>
                                        <TableCell
                                            colSpan={
                                                8
                                            }
                                            className="h-32 text-center text-muted-foreground"
                                        >
                                            Nenhum recibo encontrado.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    receipts.map(
                                        (receipt) => (
                                            <TableRow
                                                key={
                                                    receipt.id
                                                }
                                            >
                                                <TableCell className="font-medium">
                                                    {receipt.receiptNumber ??
                                                        "Rascunho"}
                                                </TableCell>

                                                <TableCell>
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
                                                            receipt
                                                                .status
                                                            ]
                                                        }
                                                    </Badge>
                                                </TableCell>

                                                <TableCell>
                                                    {
                                                        receiptTypeLabels[
                                                        receipt
                                                            .receiptType
                                                        ]
                                                    }
                                                </TableCell>

                                                <TableCell>
                                                    <div>
                                                        <p className="font-medium">
                                                            {
                                                                receipt
                                                                    .counterparty
                                                                    .name
                                                            }
                                                        </p>

                                                        {receipt
                                                            .counterparty
                                                            .document && (
                                                                <p className="text-xs text-muted-foreground">
                                                                    {
                                                                        receipt
                                                                            .counterparty
                                                                            .document
                                                                    }
                                                                </p>
                                                            )}
                                                    </div>
                                                </TableCell>

                                                <TableCell>
                                                    {
                                                        receiptSourceTypeLabels[
                                                        receipt
                                                            .sourceType
                                                        ]
                                                    }
                                                </TableCell>

                                                <TableCell>
                                                    {formatDate(
                                                        receipt
                                                            .paymentDate,
                                                    )}
                                                </TableCell>

                                                <TableCell className="text-right font-semibold">
                                                    {formatCurrency(
                                                        receipt.amount,
                                                    )}
                                                </TableCell>

                                                <TableCell>
                                                    <ReceiptActions
                                                        receipt={
                                                            receipt
                                                        }
                                                    />
                                                </TableCell>
                                            </TableRow>
                                        ),
                                    )
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {query.data && (
                <PagePagination
                    page={
                        query.data.number
                    }
                    totalPages={
                        query.data
                            .totalPages
                    }
                    totalElements={
                        query.data
                            .totalElements
                    }
                    size={
                        query.data.size
                    }
                    isFirst={
                        query.data.first
                    }
                    isLast={
                        query.data.last
                    }
                    onPageChange={
                        setPage
                    }
                />
            )}

            <ReceiptDraftDialog
                open={
                    createOpen
                }
                onOpenChange={
                    setCreateOpen
                }
                source={{
                    sourceType:
                        "MANUAL",

                    defaultDirection:
                        "RECEIVED_BY_ORGANIZATION",

                    description:
                        "Recibo sem vínculo obrigatório com uma transação",
                }}
            />
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
    icon:
    typeof FileClock
}) {
    return (
        <Card>
            <CardContent className="flex items-center gap-3 p-4">
                <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="size-5" />
                </div>

                <div>
                    <p className="text-2xl font-semibold">
                        {value}
                    </p>

                    <p className="text-xs text-muted-foreground">
                        {label}
                    </p>
                </div>
            </CardContent>
        </Card>
    )
}