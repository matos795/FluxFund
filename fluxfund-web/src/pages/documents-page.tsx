import {
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

                <TabsList className="grid h-auto w-full grid-cols-2 gap-2 rounded-xl border bg-background p-2 lg:grid-cols-4">

                    <TabsTrigger
                        value="bank-statements"
                        className="gap-2 py-3"
                    >
                        <Landmark className="size-4" />
                        Extratos
                    </TabsTrigger>

                    <TabsTrigger
                        value="attachments"
                        className="gap-2 py-3"
                    >
                        <Paperclip className="size-4" />
                        Anexos
                    </TabsTrigger>

                    <TabsTrigger
                        value="receipts"
                        className="gap-2 py-3"
                    >
                        <ReceiptText className="size-4" />
                        Recibos
                    </TabsTrigger>

                    <TabsTrigger
                        value="dossiers"
                        className="gap-2 py-3"
                    >
                        <Archive className="size-4" />
                        Dossiês
                    </TabsTrigger>

                </TabsList>

                <TabsContent
                    value="bank-statements"
                    className="mt-0 space-y-4"
                >

                    <div className="flex flex-col gap-1">
                        <h2 className="text-lg font-semibold">
                            Extratos bancários
                        </h2>

                        <p className="text-sm text-muted-foreground">
                            PDFs oficiais armazenados por conta e período.
                        </p>
                    </div>

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
                                        data.content.map(
                                            (
                                                document,
                                            ) => (
                                                <BankStatementDocumentCard
                                                    key={
                                                        document.id
                                                    }
                                                    document={
                                                        document
                                                    }
                                                />
                                            ),
                                        )
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

        </div>
    )
}