import {
    useState,
} from "react"

import {
    Download,
    Eye,
    FilePenLine,
    MoreHorizontal,
    RefreshCcw,
    Send,
    Trash2,
    XCircle,
} from "lucide-react"

import {
    toast,
} from "sonner"

import {
    Button,
} from "@/components/ui/button"

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import {
    Textarea,
} from "@/components/ui/textarea"

import {
    getApiErrorMessage,
} from "@/utils/api-error"

import {
    getReceiptPdf,
    getReceiptPreviewPdf,
} from "../receipt-api"

import type {
    Receipt,
} from "../receipt-types"

import {
    useReceiptMutations,
} from "../hooks/use-receipt-mutations"

import {
    ReceiptDraftDialog,
} from "./receipt-draft-dialog"

type Props = {
    receipt:
    Receipt
}

export function ReceiptActions({
    receipt,
}: Props) {
    const [
        editOpen,
        setEditOpen,
    ] = useState(
        false,
    )

    const [
        cancellationOpen,
        setCancellationOpen,
    ] = useState(
        false,
    )

    const [
        cancellationReason,
        setCancellationReason,
    ] = useState("")

    const [
        fileLoading,
        setFileLoading,
    ] = useState(
        false,
    )

    const {
        deleteMutation,
        issueMutation,
        cancelMutation,
        reissueMutation,
    } =
        useReceiptMutations()

    async function preview() {
        const previewWindow =
            window.open(
                "",
                "_blank",
            )

        try {
            setFileLoading(
                true,
            )

            const blob =
                await getReceiptPreviewPdf(
                    receipt.id,
                )

            const url =
                URL.createObjectURL(
                    blob,
                )

            if (previewWindow) {
                previewWindow.location.href =
                    url
            }

            window.setTimeout(
                () =>
                    URL.revokeObjectURL(
                        url,
                    ),

                60_000,
            )
        } catch (error) {
            previewWindow?.close()

            toast.error(
                getApiErrorMessage(
                    error,
                    "Não foi possível abrir a prévia.",
                ),
            )
        } finally {
            setFileLoading(
                false,
            )
        }
    }

    async function download() {
        try {
            setFileLoading(
                true,
            )

            const blob =
                await getReceiptPdf(
                    receipt.id,
                )

            const url =
                URL.createObjectURL(
                    blob,
                )

            const anchor =
                document.createElement(
                    "a",
                )

            anchor.href =
                url

            anchor.download =
                `recibo-${receipt.receiptNumber ?? receipt.id}.pdf`

            anchor.click()

            URL.revokeObjectURL(
                url,
            )
        } catch (error) {
            toast.error(
                getApiErrorMessage(
                    error,
                    "Não foi possível baixar o recibo.",
                ),
            )
        } finally {
            setFileLoading(
                false,
            )
        }
    }

    function issue() {
        const confirmed =
            window.confirm(
                "Emitir este recibo? Depois da emissão ele não poderá mais ser editado.",
            )

        if (!confirmed) {
            return
        }

        issueMutation.mutate(
            receipt.id,
            {
                onSuccess: (
                    issued,
                ) => {
                    toast.success(
                        `Recibo ${issued.receiptNumber} emitido.`,
                    )
                },

                onError: (error) => {
                    toast.error(
                        getApiErrorMessage(
                            error,
                            "Não foi possível emitir o recibo.",
                        ),
                    )
                },
            },
        )
    }

    function removeDraft() {
        const confirmed =
            window.confirm(
                "Excluir este rascunho?",
            )

        if (!confirmed) {
            return
        }

        deleteMutation.mutate(
            receipt.id,
            {
                onSuccess: () => {
                    toast.success(
                        "Rascunho excluído.",
                    )
                },

                onError: (error) => {
                    toast.error(
                        getApiErrorMessage(
                            error,
                            "Não foi possível excluir o rascunho.",
                        ),
                    )
                },
            },
        )
    }

    function cancel() {
        cancelMutation.mutate(
            {
                receiptId:
                    receipt.id,

                reason:
                    cancellationReason,
            },
            {
                onSuccess: () => {
                    toast.success(
                        "Recibo cancelado.",
                    )

                    setCancellationOpen(
                        false,
                    )

                    setCancellationReason(
                        "",
                    )
                },

                onError: (error) => {
                    toast.error(
                        getApiErrorMessage(
                            error,
                            "Não foi possível cancelar o recibo.",
                        ),
                    )
                },
            },
        )
    }

    function reissue() {
        reissueMutation.mutate(
            receipt.id,
            {
                onSuccess: () => {
                    toast.success(
                        "Novo rascunho criado a partir do recibo cancelado.",
                    )
                },

                onError: (error) => {
                    toast.error(
                        getApiErrorMessage(
                            error,
                            "Não foi possível criar a reemissão.",
                        ),
                    )
                },
            },
        )
    }

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="ghost"
                        size="icon"
                    >
                        <MoreHorizontal className="size-4" />

                        <span className="sr-only">
                            Ações
                        </span>
                    </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end">
                    {receipt.status ===
                        "DRAFT" && (
                            <>
                                <DropdownMenuItem
                                    onSelect={(
                                        event,
                                    ) => {
                                        event.preventDefault()
                                        setEditOpen(
                                            true,
                                        )
                                    }}
                                >
                                    <FilePenLine className="mr-2 size-4" />
                                    Editar rascunho
                                </DropdownMenuItem>

                                <DropdownMenuItem
                                    disabled={
                                        fileLoading
                                    }
                                    onClick={
                                        preview
                                    }
                                >
                                    <Eye className="mr-2 size-4" />
                                    Abrir prévia
                                </DropdownMenuItem>

                                <DropdownMenuItem
                                    disabled={
                                        issueMutation.isPending
                                    }
                                    onClick={
                                        issue
                                    }
                                >
                                    <Send className="mr-2 size-4" />
                                    Emitir recibo
                                </DropdownMenuItem>

                                <DropdownMenuItem
                                    className="text-destructive focus:text-destructive"
                                    onClick={
                                        removeDraft
                                    }
                                >
                                    <Trash2 className="mr-2 size-4" />
                                    Excluir rascunho
                                </DropdownMenuItem>
                            </>
                        )}

                    {receipt.status !==
                        "DRAFT" && (
                            <DropdownMenuItem
                                disabled={
                                    fileLoading
                                }
                                onClick={
                                    download
                                }
                            >
                                <Download className="mr-2 size-4" />
                                Baixar para imprimir
                            </DropdownMenuItem>
                        )}

                    {receipt.status ===
                        "ISSUED" && (
                            <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onSelect={(
                                    event,
                                ) => {
                                    event.preventDefault()
                                    setCancellationOpen(
                                        true,
                                    )
                                }}
                            >
                                <XCircle className="mr-2 size-4" />
                                Cancelar recibo
                            </DropdownMenuItem>
                        )}

                    {receipt.status ===
                        "CANCELED" && (
                            <DropdownMenuItem
                                onClick={
                                    reissue
                                }
                            >
                                <RefreshCcw className="mr-2 size-4" />
                                Criar reemissão
                            </DropdownMenuItem>
                        )}
                </DropdownMenuContent>
            </DropdownMenu>

            <ReceiptDraftDialog
                open={
                    editOpen
                }
                onOpenChange={
                    setEditOpen
                }
                receipt={
                    receipt
                }
            />

            <Dialog
                open={
                    cancellationOpen
                }
                onOpenChange={
                    setCancellationOpen
                }
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            Cancelar recibo
                        </DialogTitle>

                        <DialogDescription>
                            O PDF continuará armazenado e o número não será reutilizado.
                        </DialogDescription>
                    </DialogHeader>

                    <Textarea
                        rows={
                            4
                        }
                        value={
                            cancellationReason
                        }
                        onChange={(
                            event,
                        ) =>
                            setCancellationReason(
                                event.target.value,
                            )
                        }
                        placeholder="Informe o motivo do cancelamento"
                    />

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() =>
                                setCancellationOpen(
                                    false,
                                )
                            }
                        >
                            Voltar
                        </Button>

                        <Button
                            variant="destructive"
                            disabled={
                                !cancellationReason.trim() ||
                                cancelMutation.isPending
                            }
                            onClick={
                                cancel
                            }
                        >
                            {cancelMutation.isPending
                                ? "Cancelando..."
                                : "Confirmar cancelamento"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}