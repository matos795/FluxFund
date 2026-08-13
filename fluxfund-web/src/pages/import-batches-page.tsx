import {
    useState,
} from "react"

import {
    ArrowLeft,
    FileClock,
    FileSpreadsheet,
    FileText,
    Landmark,
} from "lucide-react"

import {
    Link,
} from "react-router-dom"

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
    useImportBatches,
} from "@/features/import-batches/hooks/use-import-batches"

import type {
    ImportBatch,
} from "@/features/import-batches/import-batch-types"

function formatImportDateTime(
    value:
        string | null,
) {

    if (!value) {
        return "-"
    }

    const [
        datePart,
        timePart,
    ] =
        value.split("T")

    const [
        year,
        month,
        day,
    ] =
        datePart.split("-")

    if (
        !year ||
        !month ||
        !day
    ) {
        return value
    }

    const time =
        timePart
            ?.slice(
                0,
                5,
            )

    return time
        ? `${day}/${month}/${year} às ${time}`
        : `${day}/${month}/${year}`
}

function getImportTypeLabel(
    batch:
        ImportBatch,
) {

    if (
        batch.sourceType ===
        "OFX"
    ) {
        return "OFX"
    }

    if (
        batch.importProfile ===
        "MERCADO_PAGO_ACCOUNT_CSV"
    ) {
        return "CSV • Mercado Pago"
    }

    return "CSV"
}

function ImportBatchCard({
    batch,
}: {
    batch:
    ImportBatch
}) {

    const SourceIcon =
        batch.sourceType ===
            "CSV"
            ? FileSpreadsheet
            : FileText

    const undone =
        batch.status ===
        "UNDONE"

    return (
        <Card>
            <CardContent className="p-5">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex min-w-0 gap-4">
                        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-muted">
                            <SourceIcon className="size-5 text-muted-foreground" />
                        </div>

                        <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                                <p
                                    className="truncate font-semibold"
                                    title={
                                        batch.originalFilename
                                    }
                                >
                                    {
                                        batch.originalFilename
                                    }
                                </p>

                                <Badge variant="outline">
                                    {
                                        getImportTypeLabel(
                                            batch,
                                        )
                                    }
                                </Badge>

                                <Badge
                                    variant={
                                        undone
                                            ? "outline"
                                            : "secondary"
                                    }
                                >
                                    {
                                        undone
                                            ? "Desfeita"
                                            : "Ativa"
                                    }
                                </Badge>
                            </div>

                            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1.5">
                                    <Landmark className="size-3.5" />

                                    {
                                        batch.accountName
                                    }

                                    {
                                        batch.bankName &&
                                            batch.bankName !==
                                            batch.accountName
                                            ? ` • ${batch.bankName}`
                                            : ""
                                    }
                                </span>

                                <span className="flex items-center gap-1.5">
                                    <FileClock className="size-3.5" />

                                    {
                                        formatImportDateTime(
                                            batch.importedAt,
                                        )
                                    }
                                </span>
                            </div>

                            {undone &&
                                batch.undoneAt && (
                                    <p className="mt-2 text-xs text-muted-foreground">
                                        Importação desfeita em{" "}
                                        {
                                            formatImportDateTime(
                                                batch.undoneAt,
                                            )
                                        }
                                    </p>
                                )}
                        </div>
                    </div>

                    <div className="grid shrink-0 grid-cols-3 gap-2">
                        <ImportResult
                            label="Importadas"
                            value={
                                batch.importedCount
                            }
                        />

                        <ImportResult
                            label="Duplicadas"
                            value={
                                batch
                                    .ignoredDuplicatesCount
                            }
                        />

                        <ImportResult
                            label="Falhas"
                            value={
                                batch.failedCount
                            }
                            destructive={
                                batch.failedCount >
                                0
                            }
                        />
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

function ImportResult({
    label,
    value,
    destructive = false,
}: {
    label:
    string

    value:
    number

    destructive?:
    boolean
}) {

    return (
        <div className="min-w-24 rounded-lg border bg-muted/20 px-3 py-2 text-center">
            <p
                className={
                    destructive
                        ? "text-lg font-semibold text-destructive"
                        : "text-lg font-semibold"
                }
            >
                {value}
            </p>

            <p className="text-xs text-muted-foreground">
                {label}
            </p>
        </div>
    )
}

export function ImportBatchesPage() {

    const [
        page,
        setPage,
    ] =
        useState(
            0,
        )

    const size =
        10

    const {
        data,
        isLoading,
        isError,
    } =
        useImportBatches({
            page,
            size,
        })

    return (
        <div className="space-y-6">
            <PageHeader
                title="Histórico de importações"
                description="Acompanhe os arquivos OFX e CSV importados e o resultado de cada processamento."
            >
                <Button
                    asChild
                    variant="outline"
                >
                    <Link to="/transactions">
                        <ArrowLeft className="mr-2 size-4" />
                        Voltar para transações
                    </Link>
                </Button>
            </PageHeader>

            <div className="rounded-xl border bg-muted/20 p-4">
                <div className="flex gap-3">
                    <FileClock className="mt-0.5 size-5 shrink-0 text-muted-foreground" />

                    <div>
                        <p className="text-sm font-medium">
                            Rastreamento de importações
                        </p>

                        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                            Este histórico registra importações realizadas
                            com o controle de lotes do FluxFund.
                            Movimentações importadas antes dessa funcionalidade
                            continuam normalmente no sistema, mas não aparecem
                            neste histórico.
                        </p>
                    </div>
                </div>
            </div>

            {isLoading && (
                <Card>
                    <CardContent className="p-8 text-center text-sm text-muted-foreground">
                        Carregando histórico de importações...
                    </CardContent>
                </Card>
            )}

            {isError && (
                <Card>
                    <CardContent className="p-8 text-center">
                        <p className="font-medium">
                            Não foi possível carregar o histórico.
                        </p>

                        <p className="mt-1 text-sm text-muted-foreground">
                            Tente atualizar a página.
                        </p>
                    </CardContent>
                </Card>
            )}

            {data &&
                data.content.length ===
                0 && (
                    <Card>
                        <CardContent className="flex flex-col items-center gap-3 p-10 text-center">
                            <div className="flex size-12 items-center justify-center rounded-xl bg-muted">
                                <FileClock className="size-5 text-muted-foreground" />
                            </div>

                            <div>
                                <p className="font-medium">
                                    Nenhuma importação registrada
                                </p>

                                <p className="mt-1 text-sm text-muted-foreground">
                                    As próximas importações OFX ou CSV aparecerão aqui.
                                </p>
                            </div>

                            <Button
                                asChild
                                variant="outline"
                                size="sm"
                            >
                                <Link to="/transactions">
                                    Ir para transações
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>
                )}

            {data &&
                data.content.length >
                0 && (
                    <>
                        <div className="space-y-3">
                            {data.content.map(
                                (
                                    batch,
                                ) => (
                                    <ImportBatchCard
                                        key={
                                            batch.id
                                        }
                                        batch={
                                            batch
                                        }
                                    />
                                ),
                            )}
                        </div>

                        <PagePagination
                            page={
                                data.number
                            }
                            totalPages={
                                data.totalPages
                            }
                            totalElements={
                                data.totalElements
                            }
                            size={
                                data.size
                            }
                            isFirst={
                                data.first
                            }
                            isLast={
                                data.last
                            }
                            onPageChange={
                                setPage
                            }
                        />
                    </>
                )}
        </div>
    )
}