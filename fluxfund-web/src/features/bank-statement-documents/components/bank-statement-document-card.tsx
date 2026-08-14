import {
    Download,
    FileText,
    Landmark,
    Trash2,
} from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
} from "@/components/ui/card"

import { downloadFile } from "@/utils/download-file"
import { formatDate } from "@/utils/formatters"

import {
    downloadBankStatementDocument,
} from "../bank-statement-document-api"

import type {
    BankStatementDocument,
} from "../bank-statement-document-types"

type BankStatementDocumentCardProps = {
    document: BankStatementDocument
    canManageDocuments: boolean
    onDelete: (
        document: BankStatementDocument,
    ) => void
}

export function BankStatementDocumentCard({
    document,
    canManageDocuments,
    onDelete,
}: BankStatementDocumentCardProps) {
    const [
        isDownloading,
        setIsDownloading,
    ] = useState(false)

    async function handleDownload() {
        try {
            setIsDownloading(true)

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
                            </div>

                            <div className="mt-2 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1.5">
                                    <Landmark className="size-3.5" />

                                    {document.accountName}
                                </span>

                                <span>
                                    {formatDate(
                                        document.periodStartDate,
                                    )}
                                    {" → "}
                                    {formatDate(
                                        document.periodEndDate,
                                    )}
                                </span>
                            </div>

                            <p className="mt-2 text-xs text-muted-foreground">
                                {formatFileSize(
                                    document.sizeBytes,
                                )}
                                {" • "}
                                enviado em{" "}
                                {formatUploadedAt(
                                    document.uploadedAt,
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
                                title="Excluir extrato"
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

function formatFileSize(
    bytes: number,
) {
    if (bytes < 1024) {
        return `${bytes} B`
    }

    const kilobytes =
        bytes / 1024

    if (kilobytes < 1024) {
        return `${kilobytes.toFixed(1)} KB`
    }

    return `${(
        kilobytes / 1024
    ).toFixed(1)} MB`
}

function formatUploadedAt(
    value: string,
) {
    const [datePart, timePart] =
        value.split("T")

    const date =
        formatDate(datePart)

    const time =
        timePart?.slice(0, 5)

    return time
        ? `${date} às ${time}`
        : date
}