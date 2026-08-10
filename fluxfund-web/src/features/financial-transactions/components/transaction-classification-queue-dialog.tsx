import {
    useEffect,
    useLayoutEffect,
    useRef,
    useState,
} from "react"

import {
    useQueryClient,
} from "@tanstack/react-query"

import {
    ListChecks,
} from "lucide-react"

import {
    AppDialogBody,
    AppDialogContent,
    AppDialogHeader,
} from "@/components/layout/app-dialog"

import {
    Badge,
} from "@/components/ui/badge"

import {
    Dialog,
} from "@/components/ui/dialog"

import {
    useOrganizationSettings,
} from "@/features/organization-settings/hooks/use-organization-settings"

import type {
    FinancialTransaction,
    TransactionClassificationPrefill,
} from "../financial-transaction-types"

import {
    getClassificationSuggestion,
} from "../financial-transaction-api"

import {
    TransactionClassifyPanel,
} from "./transaction-classify-panel"
import { TransactionClassificationQueueSetup } from "./transaction-classification-queue-setup"

type QueueResult = {
    classifiedCount:
    number

    skippedCount:
    number
}

type Props = {
    open:
    boolean

    transactions:
    FinancialTransaction[]

    onOpenChange:
    (
        open:
            boolean,
    ) => void

    onComplete:
    (
        result:
            QueueResult,
    ) => void
}

export function TransactionClassificationQueueDialog({
    open,
    transactions,
    onOpenChange,
    onComplete,
}: Props) {
    const queryClient =
        useQueryClient()

    const bodyRef =
        useRef<HTMLDivElement>(
            null,
        )

    const {
        data:
        organizationSettings,
    } =
        useOrganizationSettings()

    const [
        currentIndex,
        setCurrentIndex,
    ] =
        useState(
            0,
        )

    const [
        classifiedCount,
        setClassifiedCount,
    ] =
        useState(
            0,
        )

    const [
        skippedCount,
        setSkippedCount,
    ] =
        useState(
            0,
        )

    const [
        stage,
        setStage,
    ] =
        useState<
            "SETUP" |
            "REVIEW"
        >(
            "SETUP",
        )

    const [
        prefill,
        setPrefill,
    ] =
        useState<
            TransactionClassificationPrefill
        >(
            {},
        )

    const currentTransaction =
        transactions[
        currentIndex
        ]

    const nextTransaction =
        transactions[
        currentIndex + 1
        ]

    const suggestionPrefetchTarget =
        stage === "SETUP"
            ? transactions[0]
            : nextTransaction

    function resetQueue() {
        setCurrentIndex(0)

        setClassifiedCount(0)

        setSkippedCount(0)
        setStage("SETUP")
        setPrefill({})
    }

    function handleOpenChange(
        nextOpen:
            boolean,
    ) {
        if (!nextOpen) {
            resetQueue()
        }

        onOpenChange(
            nextOpen,
        )
    }

    useLayoutEffect(() => {
        if (!open) {
            return
        }

        bodyRef.current?.scrollTo({
            top: 0,
            behavior: "auto",
        })
    }, [
        currentIndex,
        open,
    ])

    useEffect(() => {
        if (
            !open ||
            !suggestionPrefetchTarget ||
            organizationSettings
                ?.autoFillClassificationSuggestions !==
            true
        ) {
            return
        }

        void queryClient.prefetchQuery({
            queryKey: [
                "classification-suggestion",
                suggestionPrefetchTarget.id,
            ],

            queryFn: () =>
                getClassificationSuggestion(
                    suggestionPrefetchTarget.id,
                ),
        })
    }, [
        suggestionPrefetchTarget,
        open,
        organizationSettings
            ?.autoFillClassificationSuggestions,
        queryClient,
    ])

    function finishQueue(
        nextClassifiedCount:
            number,
        nextSkippedCount:
            number,
    ) {
        onComplete({
            classifiedCount:
                nextClassifiedCount,

            skippedCount:
                nextSkippedCount,
        })

        handleOpenChange(
            false,
        )
    }

    function goToNext() {
        setCurrentIndex(
            (current) =>
                current + 1,
        )
    }

    function handleSaved() {
        const nextClassifiedCount =
            classifiedCount + 1

        setClassifiedCount(
            nextClassifiedCount,
        )

        if (
            currentIndex >=
            transactions.length - 1
        ) {
            finishQueue(
                nextClassifiedCount,
                skippedCount,
            )

            return
        }

        goToNext()
    }

    function handleSkip() {
        const nextSkippedCount =
            skippedCount + 1

        setSkippedCount(
            nextSkippedCount,
        )

        if (
            currentIndex >=
            transactions.length - 1
        ) {
            finishQueue(
                classifiedCount,
                nextSkippedCount,
            )

            return
        }

        goToNext()
    }

    if (
        transactions.length === 0
    ) {
        return null
    }

    const processedCount =
        classifiedCount +
        skippedCount

    const progress =
        transactions.length > 0
            ? (
                processedCount /
                transactions.length
            ) * 100
            : 0

    return (
        <Dialog
            open={
                open
            }
            onOpenChange={
                handleOpenChange
            }
        >
            <AppDialogContent size="full">
                <AppDialogHeader
                    icon={
                        <ListChecks className="size-4 text-muted-foreground" />
                    }
                    title={
                        stage === "SETUP"
                            ? "Preparar classificação"
                            : "Classificação em sequência"
                    }
                    description={
                        stage ===
                            "SETUP"
                            ? "Defina dados que podem ser usados como ponto de partida para todas as movimentações selecionadas."
                            : "Revise cada movimentação. Ao salvar, o FluxFund abre automaticamente a próxima."
                    }
                    aside={
                        <Badge variant="secondary">
                            {stage ===
                                "SETUP"
                                ? `${transactions.length} selecionadas`
                                : `${currentIndex + 1} de ${transactions.length}`}
                        </Badge>
                    }
                />

                <AppDialogBody
                    ref={bodyRef}
                >
                    {stage ===
                        "SETUP" ? (
                        <TransactionClassificationQueueSetup
                            transactions={
                                transactions
                            }
                            onCancel={() =>
                                handleOpenChange(
                                    false,
                                )
                            }
                            onStart={(
                                nextPrefill,
                            ) => {
                                setPrefill(
                                    nextPrefill,
                                )

                                setStage(
                                    "REVIEW",
                                )
                            }}
                        />
                    ) : currentTransaction ? (
                        <>
                            <div className="mb-6 space-y-3">
                                <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                                    <span className="font-medium">
                                        {
                                            classifiedCount
                                        }{" "}
                                        classificadas
                                    </span>

                                    <span className="text-muted-foreground">
                                        {
                                            skippedCount
                                        }{" "}
                                        puladas
                                    </span>
                                </div>

                                <div className="h-2 overflow-hidden rounded-full bg-muted">
                                    <div
                                        className="h-full bg-primary transition-all"
                                        style={{
                                            width:
                                                `${progress}%`,
                                        }}
                                    />
                                </div>
                            </div>

                            <TransactionClassifyPanel
                                key={
                                    currentTransaction.id
                                }
                                transaction={
                                    currentTransaction
                                }
                                enabled={
                                    open
                                }
                                prefill={
                                    prefill
                                }
                                onSaved={
                                    handleSaved
                                }
                                onCancel={
                                    handleSkip
                                }
                                cancelLabel={
                                    currentIndex ===
                                        transactions.length -
                                        1
                                        ? "Pular e finalizar"
                                        : "Pular por agora"
                                }
                            />
                        </>
                    ) : null}
                </AppDialogBody>
            </AppDialogContent>
        </Dialog>
    )
}