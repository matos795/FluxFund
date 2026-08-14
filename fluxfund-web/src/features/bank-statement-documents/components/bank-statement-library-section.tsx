import {
    FileCheck2,
} from "lucide-react"

import {
    useEffect,
    useMemo,
    useState,
} from "react"

import {
    toast,
} from "sonner"

import {
    ConfirmActionDialog,
} from "@/components/layout/confirm-action-dialog"

import {
    PagePagination,
} from "@/components/pagination/page-pagination"

import {
    Card,
    CardContent,
} from "@/components/ui/card"

import type {
    DateRangeValue,
} from "@/components/filters/date-range-presets"

import {
    usePermissions,
} from "@/features/auth/hooks/use-permissions"

import {
    getApiErrorMessage,
} from "@/utils/api-error"

import type {
    BankStatementDocument,
} from "../bank-statement-document-types"

import {
    useDeleteBankStatementDocument,
} from "../hooks/use-bank-statement-document-mutations"

import {
    useBankStatementDocumentsLibrary,
} from "../hooks/use-bank-statement-documents-library"

import {
    BankStatementDocumentFilters,
} from "./bank-statement-document-filters"

import {
    BankStatementLibraryUploadDialog,
} from "./bank-statement-library-upload-dialog"

import {
    BankStatementMonthGroup,
} from "./bank-statement-month-group"

const ALL_PERIOD:
    DateRangeValue = {
    preset: "all",
    startDate: "",
    endDate: "",
}

export function BankStatementLibrarySection() {
    const {
        canFinanceWrite,
    } = usePermissions()

    const [
        page,
        setPage,
    ] = useState(0)

    const [
        accountId,
        setAccountId,
    ] = useState("")

    const [
        period,
        setPeriod,
    ] =
        useState<DateRangeValue>(
            ALL_PERIOD,
        )

    const [
        searchInput,
        setSearchInput,
    ] = useState("")

    const [
        filename,
        setFilename,
    ] = useState("")

    const [
        documentToDelete,
        setDocumentToDelete,
    ] =
        useState<
            BankStatementDocument | null
        >(null)

    const size = 20

    useEffect(() => {
        const timeout =
            window.setTimeout(() => {
                setPage(0)

                setFilename(
                    searchInput.trim(),
                )
            }, 350)

        return () =>
            window.clearTimeout(
                timeout,
            )
    }, [searchInput])

    const {
        data,
        isLoading,
        isError,
    } =
        useBankStatementDocumentsLibrary({
            page,
            size,

            accountId:
                accountId ||
                undefined,

            periodStartDate:
                period.startDate ||
                undefined,

            periodEndDate:
                period.endDate ||
                undefined,

            filename:
                filename ||
                undefined,
        })

    const deleteMutation =
        useDeleteBankStatementDocument()

    const groups =
        useMemo(
            () =>
                groupDocumentsByMonth(
                    data?.content ??
                    [],
                ),
            [data?.content],
        )

    const hasFilters =
        Boolean(accountId) ||
        period.preset !== "all" ||
        Boolean(filename)

    function handleClear() {
        setPage(0)
        setAccountId("")
        setPeriod(ALL_PERIOD)
        setSearchInput("")
        setFilename("")
    }

    async function handleDelete() {
        if (!documentToDelete) {
            return
        }

        try {
            const shouldGoBack =
                page > 0 &&
                data?.content.length ===
                1

            await deleteMutation.mutateAsync(
                documentToDelete.id,
            )

            toast.success(
                "Extrato removido com sucesso.",
            )

            setDocumentToDelete(
                null,
            )

            if (shouldGoBack) {
                setPage(
                    (current) =>
                        Math.max(
                            0,
                            current - 1,
                        ),
                )
            }
        } catch (error) {
            toast.error(
                getApiErrorMessage(
                    error,
                    "Não foi possível remover o extrato.",
                ),
            )
        }
    }

    return (
        <>
            <div className="space-y-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <h2 className="text-lg font-semibold">
                            Extratos bancários
                        </h2>

                        <p className="text-sm text-muted-foreground">
                            PDFs oficiais armazenados por conta e período.
                        </p>
                    </div>

                    {canFinanceWrite && (
                        <BankStatementLibraryUploadDialog />
                    )}
                </div>

                <BankStatementDocumentFilters
                    accountId={accountId}
                    period={period}
                    searchInput={
                        searchInput
                    }
                    onAccountIdChange={(
                        value,
                    ) => {
                        setPage(0)
                        setAccountId(value)
                    }}
                    onPeriodChange={(
                        value,
                    ) => {
                        setPage(0)
                        setPeriod(value)
                    }}
                    onSearchInputChange={
                        setSearchInput
                    }
                    onClear={
                        handleClear
                    }
                />

                {isLoading && (
                    <Card>
                        <CardContent className="p-10 text-center text-sm text-muted-foreground">
                            Carregando extratos...
                        </CardContent>
                    </Card>
                )}

                {isError && (
                    <Card>
                        <CardContent className="p-10 text-center">
                            <p className="font-medium">
                                Não foi possível carregar os documentos.
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
                            <CardContent className="flex flex-col items-center gap-4 p-12 text-center">
                                <div className="flex size-14 items-center justify-center rounded-2xl bg-muted">
                                    <FileCheck2 className="size-6 text-muted-foreground" />
                                </div>

                                <div>
                                    <p className="font-semibold">
                                        {hasFilters
                                            ? "Nenhum extrato encontrado"
                                            : "Nenhum extrato armazenado"}
                                    </p>

                                    <p className="mt-1 text-sm text-muted-foreground">
                                        {hasFilters
                                            ? "Nenhum documento corresponde aos filtros selecionados."
                                            : "Os extratos enviados ao FluxFund aparecerão aqui."}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                {data &&
                    data.content.length >
                    0 && (
                        <>
                            <div className="space-y-6">
                                {groups.map(
                                    ([
                                        monthKey,
                                        documents,
                                    ]) => (
                                        <BankStatementMonthGroup
                                            key={
                                                monthKey
                                            }
                                            monthKey={
                                                monthKey
                                            }
                                            documents={
                                                documents
                                            }
                                            canManageDocuments={
                                                canFinanceWrite
                                            }
                                            onDelete={
                                                setDocumentToDelete
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
                                size={data.size}
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

            <ConfirmActionDialog
                open={
                    documentToDelete !==
                    null
                }
                onOpenChange={(open) => {
                    if (!open) {
                        setDocumentToDelete(
                            null,
                        )
                    }
                }}
                title="Excluir extrato?"
                description={
                    documentToDelete
                        ? `O arquivo "${documentToDelete.originalFilename}" será removido permanentemente.`
                        : ""
                }
                confirmLabel="Excluir extrato"
                pendingLabel="Excluindo..."
                isPending={
                    deleteMutation.isPending
                }
                isDestructive
                onConfirm={
                    handleDelete
                }
            />
        </>
    )
}

function groupDocumentsByMonth(
    documents:
        BankStatementDocument[],
) {
    const groups =
        new Map<
            string,
            BankStatementDocument[]
        >()

    for (const document of documents) {
        const monthKey =
            document.periodStartDate.slice(
                0,
                7,
            )

        const current =
            groups.get(
                monthKey,
            ) ?? []

        current.push(
            document,
        )

        groups.set(
            monthKey,
            current,
        )
    }

    return Array.from(
        groups.entries(),
    )
}