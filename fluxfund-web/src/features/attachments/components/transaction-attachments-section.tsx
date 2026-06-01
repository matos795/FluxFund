import { Download, FileText, Paperclip, Trash2, Upload } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { toast } from "sonner"

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import type { Attachment, AttachmentType } from "../attachment-types"
import { useTransactionAttachments } from "../hooks/use-transaction-attachments"
import { useUploadAttachment } from "../hooks/use-upload-attachment"
import { useDeleteAttachment } from "../hooks/use-delete-attachment"
import { attachmentTypeLabels } from "../attachment-labels"
import { downloadAttachment } from "../attachment-api"
import { downloadFile } from "@/utils/download-file"
import { usePermissions } from "@/features/auth/hooks/use-permissions"

const attachmentTypes: AttachmentType[] = [
    "PROOF_OF_PAYMENT",
    "RECEIPT",
    "INVOICE",
    "CONTRACT",
    "OTHER",
]

type TransactionAttachmentsSectionProps = {
    transactionId: string
    enabled?: boolean
    mode?: "readonly" | "manage"
    onPendingUploadChange?: (hasPendingUpload: boolean) => void
}

async function handleDownloadAttachment(attachment: Attachment) {
    try {
        const blob = await downloadAttachment(attachment.id)

        downloadFile(blob, attachment.originalFilename)
    } catch {
        toast.error("Não foi possível baixar o anexo.")
    }
}

export function TransactionAttachmentsSection({
    transactionId,
    enabled = true,
    mode = "manage",
    onPendingUploadChange,
}: TransactionAttachmentsSectionProps) {

    const { canFinanceWrite } = usePermissions()

    const canManage = mode === "manage"

    const fileInputRef = useRef<HTMLInputElement | null>(null)

    const [type, setType] = useState<AttachmentType>("PROOF_OF_PAYMENT")
    const [file, setFile] = useState<File | null>(null)

    useEffect(() => {
        onPendingUploadChange?.(Boolean(file))
    }, [file, onPendingUploadChange])

    const [attachmentToDelete, setAttachmentToDelete] = useState<Attachment | null>(null)

    const attachmentsQuery = useTransactionAttachments(transactionId, enabled)
    const uploadAttachmentMutation = useUploadAttachment(transactionId)
    const deleteAttachmentMutation = useDeleteAttachment(transactionId)

    const attachments = attachmentsQuery.data ?? []

    function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
        const selectedFile = event.target.files?.[0] ?? null
        setFile(selectedFile)
    }

    async function handleUpload(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()

        if (!file) {
            toast.error("Selecione um arquivo antes de enviar.")
            return
        }

        try {
            await uploadAttachmentMutation.mutateAsync({
                transactionId,
                type,
                file,
            })

            setFile(null)

            if (fileInputRef.current) {
                fileInputRef.current.value = ""
            }

            toast.success("Anexo enviado com sucesso.")
        } catch {
            toast.error("Não foi possível enviar o anexo.")
        }
    }

    async function handleDeleteAttachment() {
        if (!attachmentToDelete) {
            return
        }

        try {
            await deleteAttachmentMutation.mutateAsync(attachmentToDelete.id)

            setAttachmentToDelete(null)
            toast.success("Anexo removido com sucesso.")
        } catch {
            toast.error("Não foi possível remover o anexo.")
        }
    }

    return (
        <section className="rounded-lg border p-4">
            <div className="mb-4 flex flex-col gap-1">
                <div className="flex items-center gap-2">
                    <Paperclip className="size-4 text-muted-foreground" />
                    <h3 className="text-sm font-medium">Anexos</h3>
                </div>

                <p className="text-xs text-muted-foreground">
                    {canFinanceWrite && canManage
                        ? "Envie comprovantes, recibos, notas fiscais, contratos ou outros arquivos relacionados a esta transação."
                        : "Visualize os arquivos vinculados a esta transação."}
                </p>
            </div>

            {canFinanceWrite && canManage && (
                <form
                    onSubmit={handleUpload}
                    className="mb-4 grid gap-3 rounded-lg border border-dashed p-3 md:grid-cols-[180px_1fr_auto]"
                >
                    <div className="space-y-2">
                        <Label htmlFor={`attachment-type-${transactionId}`}>Tipo</Label>

                        <Select
                            value={type}
                            onValueChange={(value) => setType(value as AttachmentType)}
                        >
                            <SelectTrigger id={`attachment-type-${transactionId}`}>
                                <SelectValue />
                            </SelectTrigger>

                            <SelectContent>
                                {attachmentTypes.map((attachmentType) => (
                                    <SelectItem key={attachmentType} value={attachmentType}>
                                        {attachmentTypeLabels[attachmentType]}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor={`attachment-file-${transactionId}`}>Arquivo</Label>

                        <Input
                            ref={fileInputRef}
                            id={`attachment-file-${transactionId}`}
                            type="file"
                            onChange={handleFileChange}
                        />
                        {file && (
                            <p className="text-xs text-amber-700">
                                Arquivo selecionado aguardando envio. Clique em "Enviar" para salvá-lo.
                            </p>
                        )}
                    </div>

                    <div className="flex items-end">
                        <Button
                            type="submit"
                            disabled={uploadAttachmentMutation.isPending}
                            className="w-full md:w-auto"
                        >
                            <Upload className="mr-2 size-4" />
                            {uploadAttachmentMutation.isPending ? "Enviando..." : "Enviar"}
                        </Button>
                    </div>
                </form>
            )}

            {attachmentsQuery.isLoading ? (
                <AttachmentsSkeleton />
            ) : attachmentsQuery.isError ? (
                <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
                    Não foi possível carregar os anexos.
                </div>
            ) : attachments.length === 0 ? (
                <div className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
                    Nenhum anexo enviado para esta transação.
                </div>
            ) : (
                <div className="space-y-2">
                    {attachments.map((attachment) => (
                        <div
                            key={attachment.id}
                            className="flex flex-col gap-3 rounded-lg border p-3 md:flex-row md:items-center md:justify-between"
                        >
                            <div className="flex min-w-0 items-start gap-3">
                                <div className="rounded-lg bg-muted p-2">
                                    <FileText className="size-4 text-muted-foreground" />
                                </div>

                                <div className="min-w-0 space-y-1">
                                    <p className="truncate text-sm font-medium">
                                        {attachment.originalFilename}
                                    </p>

                                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                        <Badge variant="secondary">
                                            {attachmentTypeLabels[attachment.type]}
                                        </Badge>

                                        <span>{formatFileSize(attachment.sizeBytes)}</span>
                                        <span>Enviado em {formatDateTime(attachment.uploadedAt)}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-2 md:justify-end">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDownloadAttachment(attachment)}
                                >
                                    <Download className="mr-2 size-4" />
                                    Baixar
                                </Button>

                                {canFinanceWrite && canManage && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="text-destructive hover:text-destructive"
                                        onClick={() => setAttachmentToDelete(attachment)}
                                    >
                                        <Trash2 className="mr-2 size-4" />
                                        Remover
                                    </Button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <AlertDialog
                open={Boolean(attachmentToDelete)}
                onOpenChange={(open) => {
                    if (!open) {
                        setAttachmentToDelete(null)
                    }
                }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Remover anexo?</AlertDialogTitle>
                        <AlertDialogDescription>
                            O anexo{" "}
                            <strong>
                                {attachmentToDelete?.originalFilename ?? "selecionado"}
                            </strong>{" "}
                            será removido desta transação.
                        </AlertDialogDescription>
                    </AlertDialogHeader>

                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={deleteAttachmentMutation.isPending}>
                            Cancelar
                        </AlertDialogCancel>

                        <AlertDialogAction
                            onClick={handleDeleteAttachment}
                            disabled={deleteAttachmentMutation.isPending}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {deleteAttachmentMutation.isPending ? "Removendo..." : "Remover"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </section>
    )
}

function AttachmentsSkeleton() {
    return (
        <div className="space-y-2">
            {Array.from({ length: 2 }).map((_, index) => (
                <div key={index} className="rounded-lg border p-3">
                    <div className="flex items-center gap-3">
                        <Skeleton className="size-9 rounded-lg" />

                        <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-1/2" />
                            <Skeleton className="h-3 w-1/3" />
                        </div>

                        <Skeleton className="h-9 w-24" />
                    </div>
                </div>
            ))}
        </div>
    )
}

function formatFileSize(sizeBytes: number | null) {
    if (!sizeBytes) {
        return "Tamanho desconhecido"
    }

    if (sizeBytes < 1024) {
        return `${sizeBytes} B`
    }

    if (sizeBytes < 1024 * 1024) {
        return `${(sizeBytes / 1024).toFixed(1)} KB`
    }

    return `${(sizeBytes / 1024 / 1024).toFixed(1)} MB`
}

function formatDateTime(date: string | null | undefined) {
    if (!date) {
        return "-"
    }

    return new Intl.DateTimeFormat("pt-BR", {
        dateStyle: "short",
        timeStyle: "short",
    }).format(new Date(date))
}