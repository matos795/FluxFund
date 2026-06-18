import { useMemo } from "react"
import type { ElementType } from "react"
import { CheckCircle2, Eye, Paperclip, Pencil, WalletCards } from "lucide-react"

import {
    AppDialogBody,
    AppDialogContent,
    AppDialogHeader,
} from "@/components/layout/app-dialog"
import { Badge } from "@/components/ui/badge"
import { Dialog } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import { formatCurrency, formatDate } from "@/utils/formatters"

import type { FinancialTransaction } from "../financial-transaction-types"
import type { TransactionWorkspaceTab } from "../transaction-workspace-types"
import { financialTransactionStatusLabels } from "../financial-transaction-labels"
import { TransactionAllocationsPanel } from "./transaction-allocations-panel"
import { TransactionAttachmentsPanel } from "./transaction-attachments-panel"
import { TransactionEditPanel } from "./transaction-edit-panel"
import { TransactionOverviewPanel } from "./transaction-overview-panel"
import { TransactionClassifyPanel } from "./transaction-classify-panel"

type TransactionWorkspaceDialogProps = {
    transaction: FinancialTransaction
    open: boolean
    onOpenChange: (open: boolean) => void
    activeTab: TransactionWorkspaceTab
    onTabChange: (tab: TransactionWorkspaceTab) => void
    canEdit: boolean
    canManageAllocations: boolean
    canManageAttachments: boolean
    canClassify: boolean
}

type TabItem = {
    value: TransactionWorkspaceTab
    label: string
    icon: ElementType
    enabled: boolean
}

export function TransactionWorkspaceDialog({
    transaction,
    open,
    onOpenChange,
    activeTab,
    onTabChange,
    canEdit,
    canManageAllocations,
    canManageAttachments,
    canClassify,
}: TransactionWorkspaceDialogProps) {

    const tabs = useMemo<TabItem[]>(
        () =>
            [
                {
                    value: "overview" as TransactionWorkspaceTab,
                    label: "Visão geral",
                    icon: Eye,
                    enabled: true,
                },
                {
                    value: "edit" as TransactionWorkspaceTab,
                    label: "Editar",
                    icon: Pencil,
                    enabled: canEdit,
                },
                {
                    value: "allocations" as TransactionWorkspaceTab,
                    label: "Alocações",
                    icon: WalletCards,
                    enabled: canManageAllocations,
                },
                {
                    value: "attachments" as TransactionWorkspaceTab,
                    label: "Anexos",
                    icon: Paperclip,
                    enabled: canManageAttachments,
                },
                {
                    value: "classify" as TransactionWorkspaceTab,
                    label: "Classificar",
                    icon: CheckCircle2,
                    enabled: canClassify,
                },
            ].filter((tab) => tab.enabled),
        [canEdit, canManageAllocations, canManageAttachments, canClassify],
    )

    const safeActiveTab = tabs.some((tab) => tab.value === activeTab)
        ? activeTab
        : "overview"

    const transactionTitle =
        transaction.description?.trim() ||
        transaction.rawDescription?.trim() ||
        "Transação financeira"

    const dateLabel = transaction.settlementDate ?? transaction.dueDate

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <AppDialogContent size="full">
                <AppDialogHeader
                    icon={<WalletCards className="size-4 text-muted-foreground" />}
                    title={transactionTitle}
                    description={
                        <div className="flex flex-wrap items-center gap-2">
                            <span>{dateLabel ? formatDate(dateLabel) : "Sem data"}</span>
                            <span>•</span>
                            <span>
                                {formatCurrency(
                                    Math.abs(
                                        transaction.settledAmount ?? transaction.expectedAmount,
                                    ),
                                )}
                            </span>
                            <span>•</span>
                            <span>{transaction.account.name}</span>
                        </div>
                    }
                    aside={
                        <Badge variant="secondary">
                            {financialTransactionStatusLabels[transaction.status]}
                        </Badge>
                    }
                />

                <Tabs
                    value={safeActiveTab}
                    onValueChange={(value) =>
                        onTabChange(value as TransactionWorkspaceTab)
                    }
                    className="flex min-h-0 flex-1 flex-col"
                >
                    <div className="border-b px-5">
                        <TabsList className="h-auto w-full justify-start gap-1 overflow-x-auto rounded-none bg-transparent p-0">
                            {tabs.map((tab) => {
                                const Icon = tab.icon

                                return (
                                    <TabsTrigger
                                        key={tab.value}
                                        value={tab.value}
                                        className={cn(
                                            "rounded-none border-b-2 border-transparent px-3 py-3 text-sm",
                                            "data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none",
                                        )}
                                    >
                                        <Icon className="mr-2 size-4" />
                                        {tab.label}
                                    </TabsTrigger>
                                )
                            })}
                        </TabsList>
                    </div>

                    <AppDialogBody>
                        <TabsContent value="overview" className="m-0">
                            <TransactionOverviewPanel
                                transaction={transaction}
                                attachmentsEnabled={open && safeActiveTab === "overview"}
                            />
                        </TabsContent>

                        {canEdit && (
                            <TabsContent value="edit" className="m-0">
                                <TransactionEditPanel
                                    transaction={transaction}
                                    onSaved={() => onTabChange("overview")}
                                />
                            </TabsContent>
                        )}

                        {canManageAllocations && (
                            <TabsContent value="allocations" className="m-0">
                                <TransactionAllocationsPanel transaction={transaction} />
                            </TabsContent>
                        )}

                        {canManageAttachments && (
                            <TabsContent value="attachments" className="m-0">
                                <TransactionAttachmentsPanel
                                    transaction={transaction}
                                    enabled={open && safeActiveTab === "attachments"}
                                />
                            </TabsContent>
                        )}

                        {canClassify && (
                            <TabsContent value="classify" className="m-0">
                                <TransactionClassifyPanel
                                    transaction={transaction}
                                    enabled={open && safeActiveTab === "classify"}
                                    onSaved={() => onOpenChange(false)}
                                />
                            </TabsContent>
                        )}
                    </AppDialogBody>
                </Tabs>
            </AppDialogContent>
        </Dialog>
    )
}
