import {
    useEffect,
    useState,
} from "react"

import {
    Archive,
    Download,
    FileArchive,
    FileCheck2,
    FileText,
    Landmark,
    Paperclip,
    ReceiptText,
    Search,
    X,
} from "lucide-react"

import {
    toast,
} from "sonner"

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
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs"

import {
    downloadBankStatementDocument,
} from "@/features/bank-statement-documents/bank-statement-document-api"

import {
    useBankStatementDocumentsLibrary,
} from "@/features/bank-statement-documents/hooks/use-bank-statement-documents-library"

import type {
    BankStatementDocument,
} from "@/features/bank-statement-documents/bank-statement-document-types"

import {
    downloadFile,
} from "@/utils/download-file"

import {
    formatDate,
} from "@/utils/formatters"
import type { DateRangeValue } from "@/components/filters/date-range-presets"
import { useAccountOptions } from "@/features/accounts/hooks/use-account-options"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DateRangePresetFilter } from "@/components/filters/date-range-preset-filter"
import { Input } from "@/components/ui/input"
import { usePermissions } from "@/features/auth/hooks/use-permissions"
import { getApiErrorMessage } from "@/utils/api-error"
import { ConfirmActionDialog } from "@/components/layout/confirm-action-dialog"

const ALL_PERIOD: DateRangeValue = {
    preset: "all",
    startDate: "",
    endDate: "",
}

function formatFileSize(
    bytes:
        number,
) {

    if (
        bytes <
        1024
    ) {
        return `${bytes} B`
    }

    const kilobytes =
        bytes /
        1024

    if (
        kilobytes <
        1024
    ) {
        return `${kilobytes.toFixed(1)} KB`
    }

    const megabytes =
        kilobytes /
        1024

    return `${megabytes.toFixed(1)} MB`
}

function formatUploadedAt(
    value:
        string,
) {

    const [
        datePart,
        timePart,
    ] =
        value.split("T")

    const date =
        formatDate(
            datePart,
        )

    const time =
        timePart
            ?.slice(
                0,
                5,
            )

    return time
        ? `${date} às ${time}`
        : date
}

function BankStatementDocumentCard({
    document,
}: {
    document:
    BankStatementDocument
}) {
    const [
        isDownloading,
        setIsDownloading,
    ] =
        useState(
            false,
        )

    async function handleDownload() {

        try {

            setIsDownloading(
                true,
            )

            const blob =
                await downloadBankStatementDocument(
                    document.id,
                )

            downloadFile(
                blob,
                document.originalFilename,
            )

        } catch {

            toast.error(
                "Não foi possível baixar o extrato.",
            )

        } finally {

            setIsDownloading(
                false,
            )
        }
    }

    return (
        <Card className="overflow-hidden">
            <CardContent className="p-5">

                <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

                    <div className="flex min-w-0 gap-4">

                        <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                            <FileText className="size-5" />
                        </div>

                        <div className="min-w-0">

                            <div className="flex flex-wrap items-center gap-2">

                                <p
                                    className="truncate font-semibold"
                                    title={
                                        document.originalFilename
                                    }
                                >
                                    {
                                        document.originalFilename
                                    }
                                </p>

                                <Badge variant="outline">
                                    PDF
                                </Badge>

                            </div>

                            <div className="mt-2 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">

                                <span className="flex items-center gap-1.5">
                                    <Landmark className="size-3.5" />

                                    {
                                        document.accountName
                                    }
                                </span>

                                <span>
                                    {
                                        formatDate(
                                            document.periodStartDate,
                                        )
                                    }
                                    {" → "}
                                    {
                                        formatDate(
                                            document.periodEndDate,
                                        )
                                    }
                                </span>

                            </div>

                            <p className="mt-2 text-xs text-muted-foreground">
                                {
                                    formatFileSize(
                                        document.sizeBytes,
                                    )
                                }
                                {" • "}
                                enviado em{" "}
                                {
                                    formatUploadedAt(
                                        document.uploadedAt,
                                    )
                                }
                            </p>

                        </div>
                    </div>

                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={
                            isDownloading
                        }
                        onClick={
                            handleDownload
                        }
                    >
                        <Download className="mr-2 size-4" />

                        {
                            isDownloading
                                ? "Baixando..."
                                : "Baixar"
                        }
                    </Button>

                </div>
            </CardContent>
        </Card>
    )
}

function FutureDocumentsTab({
    icon:
    Icon,
    title,
    description,
}: {
    icon:
    typeof FileText

    title:
    string

    description:
    string
}) {

    return (
        <Card>
            <CardContent className="flex flex-col items-center justify-center gap-4 p-12 text-center">

                <div className="flex size-14 items-center justify-center rounded-2xl bg-muted">
                    <Icon className="size-6 text-muted-foreground" />
                </div>

                <div>
                    <div className="flex items-center justify-center gap-2">
                        <p className="font-semibold">
                            {title}
                        </p>

                        <Badge variant="secondary">
                            Em breve
                        </Badge>
                    </div>

                    <p className="mt-2 max-w-xl text-sm text-muted-foreground">
                        {description}
                    </p>
                </div>

            </CardContent>
        </Card>
    )
}

export function DocumentsPage() {

    const {
        canFinanceWrite,
    } = usePermissions()

    const [
        page,
        setPage,
    ] =
        useState(
            0,
        )

    const size =
        12

    const {
        data,
        isLoading,
        isError,
    } =
        useBankStatementDocumentsLibrary({
            page,
            size,
        })


    const [
        accountId,
        setAccountId,
    ] = useState("ALL")

    const [
        period,
        setPeriod,
    ] = useState<DateRangeValue>(
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

    const accountOptionsQuery =
        useAccountOptions()

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

    useBankStatementDocumentsLibrary({
        page,
        size,

        accountId:
            accountId === "ALL"
                ? undefined
                : accountId,

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

    function getDocumentMonthKey(
        document: BankStatementDocument,
    ) {
        return document.periodStartDate.slice(
            0,
            7,
        )
    }

    function formatMonthYear(
        monthKey: string,
    ) {
        const date =
            new Date(
                `${monthKey}-01T12:00:00Z`,
            )

        const value =
            new Intl.DateTimeFormat(
                "pt-BR",
                {
                    month: "long",
                    year: "numeric",
                    timeZone: "UTC",
                },
            ).format(date)

        return (
            value.charAt(0).toUpperCase() +
            value.slice(1)
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
            const key =
                getDocumentMonthKey(
                    document,
                )

            const current =
                groups.get(key) ?? []

            current.push(document)

            groups.set(
                key,
                current,
            )
        }

        return Array.from(
            groups.entries(),
        )
    }

    const documentGroups =
        groupDocumentsByMonth(
            data?.content ?? [],
        )

    return (
        <div className="space-y-6">

            <PageHeader
                title="Biblioteca de documentos"
                description="Centralize e consulte os documentos financeiros da organização."
            />

            <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-primary/5 via-background to-background">
                <CardContent className="flex items-center gap-4 p-5">

                    <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                        <FileArchive className="size-5" />
                    </div>

                    <div>
                        <p className="font-semibold">
                            Documentos financeiros em um só lugar
                        </p>

                        <p className="mt-1 text-sm text-muted-foreground">
                            A biblioteca começa pelos extratos bancários e será ampliada gradualmente para anexos, recibos e documentos de fechamento.
                        </p>
                    </div>

                </CardContent>
            </Card>

            <Tabs
                defaultValue="bank-statements"
                className="space-y-5"
            >

                <TabsList className="grid h-auto min-h-0 w-full grid-cols-2 items-stretch gap-2 rounded-xl border bg-muted/30 p-2 lg:grid-cols-4">

                    <TabsTrigger
                        value="bank-statements"
                        className="
                            h-auto min-h-11 gap-2 rounded-lg px-3 py-2.5
                            after:hidden
                            data-active:bg-background
                            data-active:text-foreground
                            data-active:shadow-sm
                            "
                    >
                        <Landmark className="size-4" />
                        Extratos
                    </TabsTrigger>

                    <TabsTrigger
                        value="attachments"
                        className="
                            h-auto min-h-11 gap-2 rounded-lg px-3 py-2.5
                            after:hidden
                            data-active:bg-background
                            data-active:text-foreground
                            data-active:shadow-sm
                            "
                    >
                        <Paperclip className="size-4" />
                        Anexos
                    </TabsTrigger>

                    <TabsTrigger
                        value="receipts"
                        className="
                            h-auto min-h-11 gap-2 rounded-lg px-3 py-2.5
                            after:hidden
                            data-active:bg-background
                            data-active:text-foreground
                            data-active:shadow-sm
                            "
                    >
                        <ReceiptText className="size-4" />
                        Recibos
                    </TabsTrigger>

                    <TabsTrigger
                        value="dossiers"
                        className="
                            h-auto min-h-11 gap-2 rounded-lg px-3 py-2.5
                            after:hidden
                            data-active:bg-background
                            data-active:text-foreground
                            data-active:shadow-sm
                            "
                    >
                        <Archive className="size-4" />
                        Dossiês
                    </TabsTrigger>

                </TabsList>

                <TabsContent
                    value="bank-statements"
                    className="mt-0 space-y-4"
                >

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

                    <Card>
                        <CardContent className="p-4">
                            <div className="grid gap-4 lg:grid-cols-[1fr_240px_260px_auto] lg:items-end">

                                <div className="space-y-2">
                                    <label className="text-sm font-medium">
                                        Buscar arquivo
                                    </label>

                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

                                        <Input
                                            value={searchInput}
                                            onChange={(event) =>
                                                setSearchInput(
                                                    event.target.value,
                                                )
                                            }
                                            placeholder="Nome do arquivo..."
                                            className="pl-9"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium">
                                        Conta
                                    </label>

                                    <Select
                                        value={accountId}
                                        onValueChange={(value) => {
                                            setPage(0)
                                            setAccountId(value)
                                        }}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>

                                        <SelectContent>
                                            <SelectItem value="ALL">
                                                Todas as contas
                                            </SelectItem>

                                            {accountOptionsQuery.data?.map(
                                                (account) => (
                                                    <SelectItem
                                                        key={account.id}
                                                        value={account.id}
                                                    >
                                                        {account.label}
                                                    </SelectItem>
                                                ),
                                            )}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <DateRangePresetFilter
                                    value={period}
                                    onChange={(value) => {
                                        setPage(0)
                                        setPeriod(value)
                                    }}
                                    idPrefix="document-library-period"
                                    label="Período do extrato"
                                    includeAllPeriodOption
                                    layout="compact"
                                />

                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                        setPage(0)
                                        setAccountId("ALL")
                                        setPeriod(ALL_PERIOD)
                                        setSearchInput("")
                                        setFilename("")
                                    }}
                                >
                                    <X className="mr-2 size-4" />
                                    Limpar
                                </Button>

                            </div>
                        </CardContent>
                    </Card>

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
                                            Nenhum extrato armazenado
                                        </p>

                                        <p className="mt-1 text-sm text-muted-foreground">
                                            Os extratos enviados pelo FluxFund aparecerão aqui.
                                        </p>
                                    </div>

                                </CardContent>
                            </Card>
                        )}

                    {data &&
                        data.content.length >
                        0 && (
                            <>
                                <div className="space-y-3">
                                    {
                                        <div className="space-y-6">
                                            {documentGroups.map(
                                                ([
                                                    monthKey,
                                                    documents,
                                                ]) => (
                                                    <section
                                                        key={monthKey}
                                                        className="space-y-3"
                                                    >

                                                        <div className="sticky top-16 z-10 -mx-1 bg-muted/40 px-1 py-2 backdrop-blur">
                                                            <div className="flex items-center justify-between rounded-lg border bg-background/95 px-3 py-2 shadow-sm">

                                                                <p className="font-semibold">
                                                                    {formatMonthYear(
                                                                        monthKey,
                                                                    )}
                                                                </p>

                                                                <Badge variant="secondary">
                                                                    {documents.length}{" "}
                                                                    {documents.length === 1
                                                                        ? "extrato"
                                                                        : "extratos"}
                                                                </Badge>

                                                            </div>
                                                        </div>

                                                        <div className="space-y-3">
                                                            {documents.map(
                                                                (document) => (
                                                                    <BankStatementDocumentCard
                                                                        key={document.id}
                                                                        document={document}
                                                                    />
                                                                ),
                                                            )}
                                                        </div>

                                                    </section>
                                                ),
                                            )}
                                        </div>
                                    }
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

                </TabsContent>

                <TabsContent
                    value="attachments"
                    className="mt-0"
                >
                    <FutureDocumentsTab
                        icon={
                            Paperclip
                        }
                        title="Anexos de transações"
                        description="Aqui será possível consultar comprovantes, notas fiscais e outros arquivos vinculados às movimentações."
                    />
                </TabsContent>

                <TabsContent
                    value="receipts"
                    className="mt-0"
                >
                    <FutureDocumentsTab
                        icon={
                            ReceiptText
                        }
                        title="Recibos"
                        description="A biblioteca poderá reunir os recibos emitidos e facilitar sua consulta por período ou favorecido."
                    />
                </TabsContent>

                <TabsContent
                    value="dossiers"
                    className="mt-0"
                >
                    <FutureDocumentsTab
                        icon={
                            Archive
                        }
                        title="Dossiês de fechamento"
                        description="No futuro, fechamentos gerados poderão ser arquivados aqui como documentos permanentes."
                    />
                </TabsContent>

            </Tabs>

            <ConfirmActionDialog
                open={
                    documentToDelete !== null
                }
                onOpenChange={(open) => {
                    if (!open) {
                        setDocumentToDelete(null)
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
                onConfirm={async () => {
                    if (!documentToDelete) {
                        return
                    }

                    try {
                        await deleteMutation.mutateAsync(
                            documentToDelete.id,
                        )

                        toast.success(
                            "Extrato removido com sucesso.",
                        )

                        setDocumentToDelete(null)
                    } catch (error) {
                        toast.error(
                            getApiErrorMessage(
                                error,
                                "Não foi possível remover o extrato.",
                            ),
                        )
                    }
                }}
            />

        </div>
    )
}