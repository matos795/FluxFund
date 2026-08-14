import {
    FileText,
    Upload,
} from "lucide-react"

import {
    useRef,
    useState,
    type ChangeEvent,
    type FormEvent,
} from "react"

import {
    toast,
} from "sonner"

import {
    AppDialogBody,
    AppDialogContent,
    AppDialogFooter,
    AppDialogHeader,
} from "@/components/layout/app-dialog"

import {
    EntityCombobox,
} from "@/components/form/entity-combobox"

import {
    Button,
} from "@/components/ui/button"

import {
    Dialog,
    DialogTrigger,
} from "@/components/ui/dialog"

import {
    Input,
} from "@/components/ui/input"

import {
    Label,
} from "@/components/ui/label"

import {
    useAccounts,
} from "@/features/accounts/hooks/use-accounts"

import {
    getApiErrorMessage,
} from "@/utils/api-error"

import {
    useUploadBankStatementDocument,
} from "../hooks/use-bank-statement-document-mutations"

import {
    validateBankStatementPdf,
} from "../bank-statement-document-validation"

export function BankStatementLibraryUploadDialog() {
    const [
        open,
        setOpen,
    ] = useState(false)

    const [
        accountId,
        setAccountId,
    ] = useState("")

    const [
        periodStartDate,
        setPeriodStartDate,
    ] = useState("")

    const [
        periodEndDate,
        setPeriodEndDate,
    ] = useState("")

    const [
        file,
        setFile,
    ] = useState<File | null>(
        null,
    )

    const fileInputRef =
        useRef<HTMLInputElement | null>(
            null,
        )

    const accountsQuery =
        useAccounts({
            page: 0,
            size: 100,
        })

    const uploadMutation =
        useUploadBankStatementDocument()

    const availableAccounts =
        accountsQuery.data?.content.filter(
            (account) =>
                account.active &&
                account.type !==
                "CREDIT_CARD" &&
                account.type !== "CASH",
        ) ?? []

    function resetForm() {
        setAccountId("")
        setPeriodStartDate("")
        setPeriodEndDate("")
        setFile(null)

        if (fileInputRef.current) {
            fileInputRef.current.value =
                ""
        }
    }

    function handleOpenChange(
        nextOpen: boolean,
    ) {
        setOpen(nextOpen)

        if (!nextOpen) {
            resetForm()
        }
    }

    function handleFileChange(
        event:
            ChangeEvent<HTMLInputElement>,
    ) {
        const selectedFile =
            event.target.files?.[0] ??
            null

        if (!selectedFile) {
            setFile(null)
            return
        }

        const validationError =
            validateBankStatementPdf(
                selectedFile,
            )

        if (validationError) {
            toast.error(
                validationError,
            )

            event.target.value = ""
            setFile(null)

            return
        }

        setFile(selectedFile)
    }

    async function handleSubmit(
        event: FormEvent,
    ) {
        event.preventDefault()

        if (!accountId) {
            toast.error(
                "Selecione uma conta.",
            )
            return
        }

        if (
            !periodStartDate ||
            !periodEndDate
        ) {
            toast.error(
                "Informe o período do extrato.",
            )
            return
        }

        if (
            periodStartDate >
            periodEndDate
        ) {
            toast.error(
                "A data final não pode ser anterior à inicial.",
            )
            return
        }

        if (!file) {
            toast.error(
                "Selecione o PDF do extrato.",
            )
            return
        }

        try {
            await uploadMutation.mutateAsync({
                accountId,
                periodStartDate,
                periodEndDate,
                file,
            })

            toast.success(
                "Extrato enviado com sucesso.",
            )

            handleOpenChange(false)
        } catch (error) {
            toast.error(
                getApiErrorMessage(
                    error,
                    "Não foi possível enviar o extrato.",
                ),
            )
        }
    }

    return (
        <Dialog
            open={open}
            onOpenChange={
                handleOpenChange
            }
        >
            <DialogTrigger asChild>
                <Button>
                    <Upload className="mr-2 size-4" />
                    Adicionar extrato
                </Button>
            </DialogTrigger>

            <AppDialogContent size="sm">
                <AppDialogHeader
                    icon={
                        <FileText className="size-4 text-muted-foreground" />
                    }
                    title="Adicionar extrato"
                    description="Armazene o PDF oficial de uma conta e informe o período ao qual ele pertence."
                />

                <form
                    onSubmit={
                        handleSubmit
                    }
                    className="contents"
                >
                    <AppDialogBody>
                        <div className="space-y-5">
                            <div className="space-y-2">
                                <Label>Conta</Label>

                                <EntityCombobox
                                    value={accountId}
                                    options={
                                        availableAccounts.map(
                                            (account) => ({
                                                value:
                                                    account.id,
                                                label:
                                                    account.name,
                                                description:
                                                    account.bankName ??
                                                    undefined,
                                            }),
                                        )
                                    }
                                    placeholder="Selecione a conta"
                                    searchPlaceholder="Buscar conta..."
                                    emptyMessage="Nenhuma conta disponível."
                                    allowClear={false}
                                    onChange={
                                        setAccountId
                                    }
                                />
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="statement-start-date">
                                        Data inicial
                                    </Label>

                                    <Input
                                        id="statement-start-date"
                                        type="date"
                                        value={
                                            periodStartDate
                                        }
                                        onChange={(event) =>
                                            setPeriodStartDate(
                                                event.target.value,
                                            )
                                        }
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="statement-end-date">
                                        Data final
                                    </Label>

                                    <Input
                                        id="statement-end-date"
                                        type="date"
                                        value={
                                            periodEndDate
                                        }
                                        onChange={(event) =>
                                            setPeriodEndDate(
                                                event.target.value,
                                            )
                                        }
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="statement-file">
                                    PDF do extrato
                                </Label>

                                <Input
                                    ref={fileInputRef}
                                    id="statement-file"
                                    type="file"
                                    accept=".pdf,application/pdf"
                                    onChange={
                                        handleFileChange
                                    }
                                />

                                {file && (
                                    <p className="text-xs text-muted-foreground">
                                        Selecionado:{" "}
                                        {file.name}
                                    </p>
                                )}
                            </div>
                        </div>
                    </AppDialogBody>

                    <AppDialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            disabled={
                                uploadMutation.isPending
                            }
                            onClick={() =>
                                handleOpenChange(
                                    false,
                                )
                            }
                        >
                            Cancelar
                        </Button>

                        <Button
                            type="submit"
                            disabled={
                                uploadMutation.isPending
                            }
                        >
                            {uploadMutation.isPending
                                ? "Enviando..."
                                : "Enviar extrato"}
                        </Button>
                    </AppDialogFooter>
                </form>
            </AppDialogContent>
        </Dialog>
    )
}