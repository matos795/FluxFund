import {
    ChevronDown,
} from "lucide-react"
import { useState } from "react"

import {
    Badge,
} from "@/components/ui/badge"

import {
    cn,
} from "@/lib/utils"

import type {
    BankStatementDocument,
} from "../bank-statement-document-types"

import {
    BankStatementDocumentCard,
} from "./bank-statement-document-card"

type BankStatementMonthGroupProps = {
    monthKey: string
    documents: BankStatementDocument[]
    canManageDocuments: boolean

    onDelete: (
        document: BankStatementDocument,
    ) => void
}

export function BankStatementMonthGroup({
    monthKey,
    documents,
    canManageDocuments,
    onDelete,
}: BankStatementMonthGroupProps) {
    const [
        expanded,
        setExpanded,
    ] = useState(true)

    return (
        <section className="space-y-3">
            <div className="sticky top-16 z-10 -mx-1 bg-muted/40 px-1 py-2 backdrop-blur">
                <button
                    type="button"
                    className="flex w-full items-center justify-between gap-3 rounded-lg border bg-background/95 px-3 py-2 text-left shadow-sm transition-colors hover:bg-muted/50"
                    onClick={() =>
                        setExpanded(
                            (current) => !current,
                        )
                    }
                >
                    <div className="flex min-w-0 items-center gap-2">
                        <ChevronDown
                            className={cn(
                                "size-4 shrink-0 transition-transform",
                                !expanded &&
                                "-rotate-90",
                            )}
                        />

                        <p className="font-semibold">
                            {formatMonthYear(
                                monthKey,
                            )}
                        </p>
                    </div>

                    <Badge variant="secondary">
                        {documents.length}{" "}
                        {documents.length === 1
                            ? "extrato"
                            : "extratos"}
                    </Badge>
                </button>
            </div>

            {expanded && (
                <div className="space-y-3">
                    {documents.map(
                        (document) => (
                            <BankStatementDocumentCard
                                key={document.id}
                                document={document}
                                canManageDocuments={
                                    canManageDocuments
                                }
                                onDelete={onDelete}
                            />
                        ),
                    )}
                </div>
            )}
        </section>
    )
}

function formatMonthYear(
    monthKey: string,
) {
    const date =
        new Date(
            `${monthKey}-01T12:00:00Z`,
        )

    const label =
        new Intl.DateTimeFormat(
            "pt-BR",
            {
                month: "long",
                year: "numeric",
                timeZone: "UTC",
            },
        ).format(date)

    return (
        label.charAt(0).toUpperCase() +
        label.slice(1)
    )
}