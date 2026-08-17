import {
    CreditCard,
    Download,
    FileText,
    Trash2,
} from "lucide-react"

import {
    useState,
} from "react"

import {
    toast,
} from "sonner"

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
    downloadFile,
} from "@/utils/download-file"

import {
    formatDate,
} from "@/utils/formatters"

import {
    downloadCreditCardStatementDocument,
} from "../credit-card-statement-api"

import type {
    CreditCardStatementLibraryDocument,
    CreditCardStatementStatus,
} from "../credit-card-statement-types"

type Props = {
    document:
    CreditCardStatementLibraryDocument

    canManageDocuments: boolean

    onDelete: (
        document: CreditCardStatementLibraryDocument,
    ) => void
}

export function CreditCardStatementLibraryCard({
    document,
    canManageDocuments,
    onDelete,
}: Props) {
    const [
        isDownloading,
        setIsDownloading,
    ] = useState(false)

    async function handleDownload() {
        try {
            setIsDownloading(true)

            const blob =
                await downloadCreditCardStatementDocument(
                    document.id,
                )

            downloadFile(
                blob,
                document.originalFilename,
            )
        } catch {
            toast.error(
                "Não foi possível baixar o PDF da fatura.",
            )
        } finally {
            setIsDownloading(false)
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

                                <Badge variant="secondary">
                                    {getStatusLabel(
                                        document.status,
                                    )}
                                </Badge>
                            </div>

                            <p className="mt-1 text-sm font-medium">
                                {document.statementName}
                            </p>

                            <div className="mt-2 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1.5">
                                    <CreditCard className="size-3.5" />

                                    {document.accountName}
                                </span>

                                <span>
                                    Vencimento:{" "}
                                    {formatDate(
                                        document.dueDate,
                                    )}
                                </span>

                                {document.closingDate && (
                                    <span>
                                        Fechamento:{" "}
                                        {formatDate(
                                            document.closingDate,
                                        )}
                                    </span>
                                )}
                            </div>

                            <p className="mt-2 text-xs text-muted-foreground">
                                {formatFileSize(
                                    document.sizeBytes,
                                )}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={isDownloading}
                            onClick={handleDownload}
                        >
                            <Download className="mr-2 size-4" />

                            {isDownloading
                                ? "Baixando..."
                                : "Baixar"}
                        </Button>

                        {canManageDocuments && (
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                title="Excluir PDF da fatura"
                                onClick={() =>
                                    onDelete(document)
                                }
                            >
                                <Trash2 className="size-4 text-destructive" />
                            </Button>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

function getStatusLabel(
    status: CreditCardStatementStatus,
) {
    const labels:
        Record<
            CreditCardStatementStatus,
            string
        > = {
        OPEN: "Aberta",
        CLOSED: "Fechada",
        PAID: "Paga",
        CANCELED: "Cancelada",
    }

    return labels[status]
}

function formatFileSize(
    bytes: number,
) {
    if (bytes < 1024) {
        return `${bytes} B`
    }

    const kb = bytes / 1024

    if (kb < 1024) {
        return `${kb.toFixed(1)} KB`
    }

    return `${(
        kb / 1024
    ).toFixed(1)} MB`
}