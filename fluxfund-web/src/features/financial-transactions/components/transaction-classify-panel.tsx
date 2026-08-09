import { type FormEvent, useEffect, useMemo, useRef, useState } from "react";
import {
    AlertTriangle,
    ArrowRightLeft,
    Paperclip,
    Plus,
    Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

import type { FinancialTransaction } from "../financial-transaction-types";
import { useClassifyFinancialTransaction } from "../hooks/use-classify-financial-transaction";
import type { AttachmentType } from "@/features/attachments/attachment-types";
import { useUploadAttachment } from "@/features/attachments/hooks/use-upload-attachment";
import { attachmentTypeLabels } from "@/features/attachments/attachment-labels";
import { CurrencyInput } from "@/components/form/currency-input";
import { CategoryComboboxWithCreate } from "@/features/categories/components/category-combobox-with-create";
import { FundComboboxWithCreate } from "@/features/funds/components/fund-combobox-with-create";
import { useFundOptions } from "@/features/funds/hooks/use-fund-options";
import { useOrganizationSettings } from "@/features/organization-settings/hooks/use-organization-settings";
import { getDefaultFundReallocationSuggestion } from "@/utils/fund-reallocation";
import { formatCents, formatCurrency, fromCents } from "@/utils/formatters";
import { getApiErrorMessage } from "@/utils/api-error";
import { useAccounts } from "@/features/accounts/hooks/use-accounts";
import { EntityCombobox } from "@/components/form/entity-combobox";
import {
    fiscalDocumentPolicyRequiresNote,
    normalizeFiscalDocumentNote,
} from "../financial-transaction-labels";
import { FiscalDocumentPolicyField } from "./fiscal-document-policy-field";
import {
    getAttachmentAcceptAttribute,
    getAttachmentRulesDescription,
    validateAttachmentFile,
} from "@/features/attachments/attachment-validation";
import { useClassificationSuggestion } from "../hooks/use-classification-suggestion";
import { useTransferMatchSuggestion } from "../hooks/use-transfer-match-suggestion";
import { usePairTransferTransactions } from "../hooks/use-pair-transfer-transactions";
import { FinancialPartyCombobox } from "@/features/financial-parties/components/financial-party-combobox";
import type { FinancialCommitmentAllocationSuggestion } from "@/features/financial-commitments/financial-commitment-types";
import { FinancialCommitmentAllocationCard } from "@/features/financial-commitments/components/financial-commitment-allocation-card";
import { SupportAgreementSuggestionCard } from "@/features/support-agreements/components/support-agreement-suggestion-card";

type AllocationFormItem = {
    fundId: string;
    sourcePartyId: string;
    recipientPartyId: string;
    referenceMonth: string;
    amount: string;
    financialCommitmentId: string;
};

type PendingAttachmentItem = {
    id: string;
    type: AttachmentType;
    file: File | null;
};

type TransactionClassifyPanelProps = {
    transaction: FinancialTransaction;
    enabled?: boolean;
    onSaved?: () => void;
    onCancel?: () => void;
    cancelLabel?: string;
};

export function TransactionClassifyPanel({
    transaction,
    enabled = true,
    onSaved,
    onCancel,
    cancelLabel = "Cancelar",
}: TransactionClassifyPanelProps) {

    const isCreditCardItem =
        transaction.source === "CREDIT_CARD" &&
        Boolean(transaction.creditCardStatementId)

    const dialogOpen = enabled;

    const [type, setType] = useState(transaction.type);
    const [categoryId, setCategoryId] = useState(transaction.category?.id ?? "");
    const [description, setDescription] = useState(transaction.description ?? "");

    const [fiscalDocumentPolicy, setFiscalDocumentPolicy] = useState(
        transaction.fiscalDocumentPolicy ?? "CATEGORY",
    );

    const [fiscalDocumentNote, setFiscalDocumentNote] = useState(
        transaction.fiscalDocumentNote ?? "",
    );

    const [settlementDate, setSettlementDate] =
        useState(
            isCreditCardItem
                ? transaction.purchaseDate ??
                transaction.settlementDate ??
                ""
                : transaction.settlementDate ?? "",
        )
    const [settledAmount, setSettledAmount] = useState(
        String(
            Math.abs(transaction.settledAmount ?? transaction.expectedAmount ?? 0),
        ),
    );

    const [allocations, setAllocations] = useState<AllocationFormItem[]>([]);

    const [pendingAttachments, setPendingAttachments] = useState<
        PendingAttachmentItem[]
    >([]);

    const [transferDirection, setTransferDirection] = useState<
        FinancialTransaction["transferDirection"]
    >(
        transaction.transferDirection ??
        (transaction.type === "INCOME" ? "IN" : "OUT"),
    );

    const [transferCounterpartyAccountId, setTransferCounterpartyAccountId] =
        useState(transaction.transferCounterpartyAccount?.id ?? "");

    const [selectedTransferMatchId, setSelectedTransferMatchId] = useState("");

    const classifyTransaction = useClassifyFinancialTransaction();

    const uploadAttachmentMutation = useUploadAttachment(transaction.id);

    const { data: funds = [] } = useFundOptions();
    const { data: settings } = useOrganizationSettings();

    const autoFillEnabled = settings?.autoFillClassificationSuggestions === true;

    const classificationSuggestionQuery = useClassificationSuggestion(
        transaction.id,
        {
            enabled: dialogOpen && autoFillEnabled && !transaction.category,
        },
    );

    const appliedSuggestionKeyRef = useRef<string | null>(null);

    const hasManualChangesRef = useRef(false);

    function markAsManuallyEdited() {
        hasManualChangesRef.current = true;
    }

    const accountsQuery = useAccounts({ page: 0, size: 200 });

    const transferMatchQuery = useTransferMatchSuggestion(transaction.id, {
        enabled:
            dialogOpen &&
            transaction.status === "SETTLED" &&
            transaction.account.type !== "CREDIT_CARD" &&
            !transaction.category,
    });

    const pairTransferMutation = usePairTransferTransactions();

    const transferCandidates = transferMatchQuery.data?.candidates ?? [];

    const automaticTransferMatchId =
        transferCandidates.length === 1 ? transferCandidates[0].transactionId : "";

    const currentTransferMatchId =
        selectedTransferMatchId || automaticTransferMatchId;

    const selectedTransferCandidate = transferCandidates.find(
        (candidate) => candidate.transactionId === currentTransferMatchId,
    );

    const transferCounterpartyAccountOptions =
        accountsQuery.data?.content
            .filter(
                (account) =>
                    account.active &&
                    account.type !== "CREDIT_CARD" &&
                    account.id !== transaction.account.id,
            )
            .map((account) => ({
                value: account.id,
                label: account.bankName
                    ? `${account.name} · ${account.bankName}`
                    : account.name,
            })) ?? [];

    const totalAllocated = useMemo(() => {
        const totalInCents = allocations.reduce(
            (total, allocation) => total + formatCents(allocation.amount),
            0,
        );

        return fromCents(totalInCents);
    }, [allocations]);

    const amountNumber = fromCents(formatCents(settledAmount));

    const remainingAmount = fromCents(
        formatCents(amountNumber) - formatCents(totalAllocated),
    );

    function handleAddAllocation() {
        markAsManuallyEdited();

        setAllocations((current) => [
            ...current,
            {
                fundId: "",
                sourcePartyId: "",
                recipientPartyId: "",
                referenceMonth: settlementDate ? settlementDate.slice(0, 7) : "",
                amount: remainingAmount > 0 ? String(remainingAmount) : "",
                financialCommitmentId: "",
            },
        ]);
    }

    function handleRemoveAllocation(index: number) {
        markAsManuallyEdited();
        setAllocations((current) =>
            current.filter((_, itemIndex) => itemIndex !== index),
        );
    }

    function handleChangeAllocation(
        index: number,
        field:
            keyof AllocationFormItem,
        value: string,
    ) {
        markAsManuallyEdited();

        const changesCommitmentContext =
            field ===
            "sourcePartyId" ||
            field ===
            "recipientPartyId" ||
            field ===
            "referenceMonth";

        setAllocations((current) =>
            current.map(
                (
                    allocation,
                    itemIndex,
                ) => {
                    if (
                        itemIndex !== index
                    ) {
                        return allocation;
                    }

                    const contextChanged =
                        changesCommitmentContext &&
                        allocation[field] !==
                        value;

                    return {
                        ...allocation,

                        [field]:
                            value,

                        financialCommitmentId:
                            contextChanged
                                ? ""
                                : allocation
                                    .financialCommitmentId,
                    };
                },
            ),
        );
    }

    function handleSelectFinancialCommitment(
        index: number,

        suggestion:
            FinancialCommitmentAllocationSuggestion,
    ) {
        markAsManuallyEdited();

        setAllocations((current) =>
            current.map(
                (
                    allocation,
                    itemIndex,
                ) =>
                    itemIndex === index
                        ? {
                            ...allocation,

                            financialCommitmentId:
                                suggestion
                                    .commitment
                                    .id,

                            amount:
                                String(
                                    suggestion
                                        .suggestedAmount,
                                ),
                        }
                        : allocation,
            ),
        );
    }

    function handleClearFinancialCommitment(
        index: number,
    ) {
        markAsManuallyEdited();

        setAllocations((current) =>
            current.map(
                (
                    allocation,
                    itemIndex,
                ) =>
                    itemIndex === index
                        ? {
                            ...allocation,

                            financialCommitmentId:
                                "",
                        }
                        : allocation,
            ),
        );
    }

    function handleApplySupportAgreementSuggestion(
        index: number,

        suggestion: {
            fundId: string;
            beneficiaryId: string;
            referenceMonth: string;
            amount: number;
        },
    ) {
        markAsManuallyEdited();

        setAllocations((current) =>
            current.map(
                (
                    allocation,
                    allocationIndex,
                ) =>
                    allocationIndex === index
                        ? {
                            ...allocation,

                            fundId:
                                suggestion.fundId,

                            recipientPartyId:
                                suggestion.beneficiaryId,

                            referenceMonth:
                                suggestion.referenceMonth,

                            amount:
                                String(
                                    suggestion.amount,
                                ),

                            financialCommitmentId:
                                "",
                        }
                        : allocation,
            ),
        );
    }

    function handleApplyReallocationSuggestion(index: number) {
        markAsManuallyEdited();

        const allocation = allocations[index];

        const suggestion = getDefaultFundReallocationSuggestion({
            fundId: allocation.fundId,
            amount: Number(allocation.amount || 0),
            transactionType: type,
            funds,
            settings,
        });

        if (!suggestion) {
            return;
        }

        setAllocations((current) => {
            const updated = [...current];

            updated[index] = {
                ...updated[index],
                amount: String(fromCents(formatCents(suggestion.selectedFundAmount))),
            };

            updated.splice(index + 1, 0, {
                fundId: suggestion.defaultFund.id,
                sourcePartyId: allocation.sourcePartyId,
                recipientPartyId: allocation.recipientPartyId,
                referenceMonth: allocation.referenceMonth,
                amount: String(fromCents(formatCents(suggestion.defaultFundAmount))),
                financialCommitmentId: allocation.financialCommitmentId,
            });

            return updated;
        });

        toast.info("Sugestão aplicada. Revise as alocações antes de salvar.");
    }

    function handleAddPendingAttachment() {
        setPendingAttachments((current) => [
            ...current,
            {
                id: crypto.randomUUID(),
                type: "PROOF_OF_PAYMENT",
                file: null,
            },
        ]);
    }

    function handleRemovePendingAttachment(id: string) {
        setPendingAttachments((current) =>
            current.filter((attachment) => attachment.id !== id),
        );
    }

    function handleChangePendingAttachmentType(id: string, type: AttachmentType) {
        setPendingAttachments((current) =>
            current.map((attachment) =>
                attachment.id === id
                    ? {
                        ...attachment,
                        type,
                    }
                    : attachment,
            ),
        );
    }

    function handleChangePendingAttachmentFile(id: string, file: File | null) {
        if (file) {
            const validationError = validateAttachmentFile(file);

            if (validationError) {
                toast.error(validationError);
                return;
            }
        }

        setPendingAttachments((current) =>
            current.map((attachment) =>
                attachment.id === id
                    ? {
                        ...attachment,
                        file,
                    }
                    : attachment,
            ),
        );
    }

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (!type) {
            toast.error("Selecione o tipo da transação.");
            return;
        }

        if (type !== "TRANSFER" && !categoryId) {
            toast.error("Selecione uma categoria.");
            return;
        }

        if (type === "TRANSFER") {
            if (!transferDirection) {
                toast.error("Selecione se a transferência é entrada ou saída.");
                return;
            }

            if (!transferCounterpartyAccountId) {
                toast.error("Selecione a conta contraparte da transferência.");
                return;
            }

            if (transferCounterpartyAccountId === transaction.account.id) {
                toast.error(
                    "A conta contraparte deve ser diferente da conta da transação.",
                );
                return;
            }
        }

        if (!settlementDate) {
            toast.error("Informe a data de baixa.");
            return;
        }

        if (!amountNumber || amountNumber <= 0) {
            toast.error("Informe um valor válido.");
            return;
        }

        if (
            type === "EXPENSE" &&
            fiscalDocumentPolicyRequiresNote(fiscalDocumentPolicy) &&
            !fiscalDocumentNote.trim()
        ) {
            toast.error("Informe o motivo da regra documental.");
            return;
        }

        const validAllocations =
            type === "TRANSFER"
                ? []
                : allocations
                    .filter(
                        (allocation) =>
                            allocation.fundId && Number(allocation.amount || 0) > 0,
                    )
                    .map((allocation) => ({
                        fundId: allocation.fundId,
                        sourcePartyId: type === "INCOME" ? allocation.sourcePartyId || null : null,
                        recipientPartyId: allocation.recipientPartyId || null,
                        referenceMonth: allocation.referenceMonth ? `${allocation.referenceMonth}-01` : null,
                        amount: Math.abs(Number(allocation.amount)),
                        financialCommitmentId: allocation.financialCommitmentId || null,
                    }));

        const hasIncompleteAllocation =
            type !== "TRANSFER" &&
            allocations.some((allocation) => {
                const amount = Number(allocation.amount || 0);

                return amount > 0 && !allocation.fundId;
            });

        if (hasIncompleteAllocation) {
            toast.error("Selecione um fundo para todas as alocações com valor.");
            return;
        }

        const allocatedAbsTotal = validAllocations.reduce(
            (total, allocation) => total + Math.abs(allocation.amount),
            0,
        );

        if (allocatedAbsTotal > amountNumber) {
            toast.error("O valor alocado não pode ultrapassar o valor da transação.");
            return;
        }

        if (allocatedAbsTotal > 0 && allocatedAbsTotal < amountNumber) {
            const confirmed = window.confirm(
                "O valor foi parcialmente alocado. O restante continuará pendente e poderá ser alocado depois pelo botão de alocar restante. Deseja salvar mesmo assim?",
            );

            if (!confirmed) {
                return;
            }
        }

        const hasIncompleteAttachment = pendingAttachments.some(
            (attachment) => !attachment.file,
        );

        if (hasIncompleteAttachment) {
            toast.error(
                "Selecione um arquivo em todos os anexos ou remova a linha vazia.",
            );
            return;
        }

        const attachmentsToUpload =
            type === "TRANSFER"
                ? []
                : pendingAttachments.filter(
                    (
                        attachment,
                    ): attachment is PendingAttachmentItem & { file: File } =>
                        attachment.file !== null,
                );

        try {
            await classifyTransaction.mutateAsync({
                transactionId: transaction.id,
                data: {
                    type,
                    categoryId: type === "TRANSFER" ? null : categoryId,
                    dueDate: isCreditCardItem ? transaction.dueDate ?? undefined : settlementDate,
                    settlementDate: isCreditCardItem
                        ? transaction.purchaseDate ?? transaction.settlementDate ?? settlementDate : settlementDate,
                    expectedAmount: amountNumber,
                    settledAmount: amountNumber,
                    description: description || undefined,
                    documentNumber: transaction.documentNumber ?? undefined,
                    fiscalDocumentPolicy:
                        type === "EXPENSE" ? fiscalDocumentPolicy : "CATEGORY",
                    fiscalDocumentNote:
                        type === "EXPENSE"
                            ? normalizeFiscalDocumentNote(
                                fiscalDocumentPolicy,
                                fiscalDocumentNote,
                            )
                            : null,
                    transferDirection: type === "TRANSFER" ? transferDirection : null,
                    transferCounterpartyAccountId:
                        type === "TRANSFER" ? transferCounterpartyAccountId : null,
                    allocations: validAllocations,
                },
            });

            if (attachmentsToUpload.length === 0) {
                toast.success("Transação classificada com sucesso.");
                setPendingAttachments([]);
                onSaved?.();
                return;
            }

            const failedFiles: string[] = [];

            for (const attachment of attachmentsToUpload) {
                try {
                    await uploadAttachmentMutation.mutateAsync({
                        transactionId: transaction.id,
                        type: attachment.type,
                        file: attachment.file,
                    });
                } catch {
                    failedFiles.push(attachment.file.name);
                }
            }

            if (failedFiles.length === 0) {
                toast.success(
                    attachmentsToUpload.length === 1
                        ? "Transação classificada e anexo enviado com sucesso."
                        : "Transação classificada e anexos enviados com sucesso.",
                );
            } else if (failedFiles.length === attachmentsToUpload.length) {
                toast.warning(
                    "A transação foi classificada, mas nenhum anexo foi enviado. Envie novamente pela ação Anexos.",
                );
            } else {
                toast.warning(
                    `A transação foi classificada, mas alguns anexos falharam: ${failedFiles.join(", ")}.`,
                );
            }

            setPendingAttachments([]);
            onSaved?.();
        } catch (error) {
            toast.error(
                getApiErrorMessage(error, "Não foi possível classificar a transação."),
            );
        }
    }

    useEffect(() => {
        if (!dialogOpen) {
            return;
        }

        const resetForm = () => {
            hasManualChangesRef.current = false;
            setType(transaction.type);
            setCategoryId(transaction.category?.id ?? "");
            setDescription(transaction.description ?? "");
            setSettlementDate(transaction.settlementDate ?? "");
            setSettledAmount(
                String(
                    Math.abs(
                        transaction.settledAmount ?? transaction.expectedAmount ?? 0,
                    ),
                ),
            );
            setFiscalDocumentPolicy(transaction.fiscalDocumentPolicy ?? "CATEGORY");
            setFiscalDocumentNote(transaction.fiscalDocumentNote ?? "");
            setAllocations([]);
            setPendingAttachments([]);
            setTransferDirection(
                transaction.transferDirection ??
                (transaction.type === "INCOME" ? "IN" : "OUT"),
            );

            setTransferCounterpartyAccountId(
                transaction.transferCounterpartyAccount?.id ?? "",
            );
            setSelectedTransferMatchId("");
        };

        const timeoutId = window.setTimeout(resetForm, 0);
        return () => window.clearTimeout(timeoutId);
    }, [
        dialogOpen,
        transaction.id,
        transaction.type,
        transaction.category?.id,
        transaction.description,
        transaction.settlementDate,
        transaction.settledAmount,
        transaction.expectedAmount,
        transaction.fiscalDocumentPolicy,
        transaction.fiscalDocumentNote,
        transaction.transferDirection,
        transaction.transferCounterpartyAccount?.id,
    ]);

    useEffect(() => {
        if (!dialogOpen || !autoFillEnabled) {
            return;
        }

        const suggestion = classificationSuggestionQuery.data;

        if (!suggestion?.available || !suggestion.type || !suggestion.category) {
            return;
        }

        if (hasManualChangesRef.current) {
            return;
        }

        const suggestionKey = `${transaction.id}:${suggestion.basedOnTransactionId}`;

        if (appliedSuggestionKeyRef.current === suggestionKey) {
            return;
        }

        const timeoutId = window.setTimeout(() => {
            if (hasManualChangesRef.current) {
                return;
            }

            appliedSuggestionKeyRef.current = suggestionKey;
            setType(suggestion.type!);
            setCategoryId(suggestion.category!.id);

            if (!description.trim() && suggestion.description) {
                setDescription(suggestion.description);
            }

            const defaultReferenceMonth = settlementDate
                ? settlementDate.slice(0, 7)
                : "";

            setAllocations(
                suggestion.allocations.map(
                    (allocation) => ({
                        fundId: allocation.fund.id,
                        sourcePartyId: allocation.sourceParty?.id ?? "",
                        recipientPartyId: allocation.recipientParty?.id ?? allocation.beneficiary?.id ?? "",
                        referenceMonth: defaultReferenceMonth,
                        amount: String(Math.abs(Number(allocation.amount))),
                        financialCommitmentId: "",
                    }),
                ),
            );
            toast.info(
                "Sugestão aplicada com base no histórico. Categoria, fundos e contatos foram preenchidos para revisão.",
            )
        }, 0);

        return () => window.clearTimeout(timeoutId);
    }, [
        autoFillEnabled,
        classificationSuggestionQuery.data,
        description,
        dialogOpen,
        settlementDate,
        transaction.id,
    ]);

    function handlePairTransfer() {
        if (!currentTransferMatchId) {
            toast.error("Selecione a movimentação correspondente.");
            return;
        }

        const confirmed = window.confirm(
            "As duas movimentações serão classificadas como transferência e vinculadas entre si. Deseja continuar?",
        );

        if (!confirmed) {
            return;
        }

        pairTransferMutation.mutate(
            {
                transactionId: transaction.id,
                matchingTransactionId: currentTransferMatchId,
            },
            {
                onSuccess: () => {
                    toast.success(
                        "As duas pontas da transferência foram classificadas e vinculadas.",
                    );

                    onSaved?.();
                },

                onError: (error) => {
                    toast.error(
                        getApiErrorMessage(
                            error,
                            "Não foi possível vincular as movimentações.",
                        ),
                    );
                },
            },
        );
    }

    useEffect(() => {
        appliedSuggestionKeyRef.current = null;
    }, [transaction.id]);

    function getMaxAmountForAllocation(index: number) {
        const totalOfOtherAllocationsInCents = allocations.reduce(
            (total, allocation, allocationIndex) => {
                if (allocationIndex === index) {
                    return total;
                }

                return total + formatCents(allocation.amount);
            },
            0,
        );

        return Math.max(
            fromCents(formatCents(amountNumber) - totalOfOtherAllocationsInCents),
            0,
        );
    }

    return (
        <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="rounded-lg border bg-muted/30 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Descrição original do banco
                </p>

                <p className="mt-2 break-words text-sm">
                    {transaction.rawDescription ||
                        transaction.description ||
                        "Sem descrição original"}
                </p>
            </div>

            {transferMatchQuery.data?.available && (
                <div className="space-y-3 rounded-lg border border-blue-200 bg-blue-50 p-4">
                    <div className="flex items-start gap-3">
                        <ArrowRightLeft className="mt-0.5 size-5 text-blue-700" />

                        <div>
                            <p className="font-medium text-blue-950">
                                Possível transferência entre contas
                            </p>

                            <p className="text-sm text-blue-800">
                                Encontramos uma movimentação de mesmo valor, em outra conta, com
                                sentido oposto.
                            </p>
                        </div>
                    </div>

                    <EntityCombobox
                        value={currentTransferMatchId}
                        options={transferCandidates.map((candidate) => ({
                            value: candidate.transactionId,

                            label:
                                `${candidate.account.name} · ` +
                                `${formatCurrency(candidate.amount)} · ` +
                                `${candidate.settlementDate} · ` +
                                candidate.description,
                        }))}
                        placeholder="Selecione a outra ponta"
                        searchPlaceholder="Buscar movimentação..."
                        emptyMessage="Nenhuma candidata encontrada."
                        allowClear={false}
                        onChange={setSelectedTransferMatchId}
                    />

                    {selectedTransferCandidate && (
                        <p className="text-sm text-blue-900">
                            Esta transação será{" "}
                            <strong>
                                {transferMatchQuery.data.suggestedDirection === "OUT"
                                    ? "saída"
                                    : "entrada"}
                            </strong>{" "}
                            e a movimentação em{" "}
                            <strong>{selectedTransferCandidate.account.name}</strong> será a
                            ponta oposta.
                        </p>
                    )}

                    <Button
                        type="button"
                        variant="secondary"
                        disabled={!currentTransferMatchId || pairTransferMutation.isPending}
                        onClick={handlePairTransfer}
                    >
                        <ArrowRightLeft className="mr-2 size-4" />

                        {pairTransferMutation.isPending
                            ? "Vinculando..."
                            : "Classificar e vincular as duas"}
                    </Button>
                </div>
            )}

            <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                    <Label>Tipo</Label>
                    <Select
                        value={type}
                        onValueChange={(value) => {
                            const nextType = value as FinancialTransaction["type"];

                            markAsManuallyEdited();

                            setType(nextType);

                            setAllocations((current) =>
                                current.map(
                                    (allocation) => ({
                                        ...allocation,

                                        sourcePartyId:
                                            nextType === "INCOME"
                                                ? allocation.sourcePartyId
                                                : "",

                                        financialCommitmentId: "",
                                    }),
                                ),
                            );

                            setCategoryId("");

                            if (nextType !== "EXPENSE") {
                                setFiscalDocumentPolicy("CATEGORY");
                                setFiscalDocumentNote("");
                            }

                            if (nextType === "TRANSFER") {
                                setAllocations([]);
                                setPendingAttachments([]);

                                setTransferDirection(
                                    transaction.type === "INCOME" ? "IN" : "OUT",
                                );
                            }
                        }}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>

                        <SelectContent>
                            <SelectItem value="INCOME">Receita</SelectItem>
                            <SelectItem value="EXPENSE">Despesa</SelectItem>
                            <SelectItem value="TRANSFER">Transferência</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {type === "TRANSFER" ? (
                    <div className="space-y-2">
                        <Label>Direção</Label>

                        <Select
                            value={transferDirection ?? ""}
                            onValueChange={(value) => {
                                markAsManuallyEdited();
                                setTransferDirection(
                                    value as FinancialTransaction["transferDirection"],
                                );
                            }}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Selecione a direção" />
                            </SelectTrigger>

                            <SelectContent>
                                <SelectItem value="OUT">Saída para outra conta</SelectItem>
                                <SelectItem value="IN">Entrada de outra conta</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                ) : (
                    <div className="space-y-2">
                        <Label>Categoria</Label>
                        <CategoryComboboxWithCreate
                            value={categoryId}
                            type={type}
                            placeholder="Selecione a categoria"
                            searchPlaceholder="Buscar categoria..."
                            emptyMessage="Nenhuma categoria encontrada."
                            allowClear={false}
                            onChange={(value) => {
                                markAsManuallyEdited();
                                setCategoryId(value);

                                if (!value) {
                                    setPendingAttachments([]);
                                }
                            }}
                        />
                    </div>
                )}

                <div className="space-y-2">
                    <Label htmlFor="settlementDate">
                        {isCreditCardItem
                            ? "Data da compra"
                            : "Data de baixa"}
                    </Label>

                    <Input
                        id="settlementDate"
                        type="date"
                        value={settlementDate}
                        disabled={isCreditCardItem}
                        onChange={(event) => {
                            markAsManuallyEdited()
                            setSettlementDate(event.target.value)
                        }}
                    />

                    {isCreditCardItem && (
                        <p className="text-xs text-muted-foreground">
                            A compra já foi efetivada nesta data.
                            O pagamento será controlado pela fatura.
                        </p>
                    )}
                </div>

                <div className="space-y-2">
                    <Label>Valor baixado</Label>
                    <CurrencyInput
                        id="settledAmount"
                        value={amountNumber}
                        onValueChange={(value) => {
                            markAsManuallyEdited();
                            setSettledAmount(String(value ?? 0));
                        }}
                    />
                </div>

                <div className="space-y-2 md:col-span-2">
                    <Label>Descrição interna</Label>
                    <Input
                        value={description}
                        placeholder="Ex: Compra de material, oferta destinada, repasse..."
                        onChange={(event) => {
                            markAsManuallyEdited();
                            setDescription(event.target.value);
                        }}
                    />
                </div>

                {type === "TRANSFER" && (
                    <div className="space-y-2 md:col-span-2">
                        <Label>Conta contraparte</Label>

                        <EntityCombobox
                            value={transferCounterpartyAccountId}
                            options={transferCounterpartyAccountOptions}
                            placeholder="Selecione a outra conta"
                            searchPlaceholder="Buscar conta..."
                            emptyMessage="Nenhuma conta encontrada."
                            allowClear={false}
                            onChange={(value) => {
                                markAsManuallyEdited();
                                setTransferCounterpartyAccountId(value);
                            }}
                        />

                        <p className="text-xs text-muted-foreground">
                            Escolha a outra conta envolvida nesta transferência. Se a
                            transação atual é uma saída, esta será a conta de destino. Se é
                            uma entrada, esta será a conta de origem.
                        </p>
                    </div>
                )}
            </div>

            {type === "TRANSFER" && (
                <div className="rounded-lg border bg-muted/40 p-3 text-sm text-muted-foreground">
                    Transferências entre contas não usam categoria,
                    fundo, contatos financeiros nem anexo fiscal. Elas não entram como receita ou despesa nos relatórios.
                </div>
            )}

            {type === "EXPENSE" && (
                <FiscalDocumentPolicyField
                    value={fiscalDocumentPolicy}
                    note={fiscalDocumentNote}
                    onValueChange={(value) => {
                        markAsManuallyEdited();

                        setFiscalDocumentPolicy(value);

                        if (value === "CATEGORY" || value === "REQUIRED") {
                            setFiscalDocumentNote("");
                        }
                    }}
                    onNoteChange={(value) => {
                        markAsManuallyEdited();
                        setFiscalDocumentNote(value);
                    }}
                />
            )}

            <div className="space-y-3 rounded-xl border p-4">
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <h3 className="text-sm font-medium">Alocações</h3>
                        <p className="text-xs text-muted-foreground">
                            Se nenhuma alocação for informada, o sistema usará o fundo padrão.
                            Se houver alocação parcial, o restante continuará pendente para
                            alocação.
                            Para relacionar esta transação a um doador, favorecido ou compromisso financeiro, adicione uma alocação manual.
                        </p>
                    </div>

                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleAddAllocation}
                    >
                        <Plus className="mr-2 size-4" />
                        Adicionar
                    </Button>
                </div>

                {allocations.length === 0 ? (
                    <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                        Se nenhuma alocação manual for informada, o sistema usará o fundo
                        padrão da organização. Se você informar uma alocação parcial, o
                        restante continuará pendente e poderá ser alocado depois.
                    </div>
                ) : (
                    <div className="space-y-4">
                        {allocations.map((allocation, index) => {
                            const suggestion = getDefaultFundReallocationSuggestion({
                                fundId: allocation.fundId,
                                amount: Number(allocation.amount || 0),
                                transactionType: type,
                                funds,
                                settings,
                            });

                            return (
                                <div key={index} className="space-y-3">
                                    <div className={
                                        type === "INCOME"
                                            ? "grid gap-4 rounded-lg border bg-muted/20 p-4 md:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_160px_140px_auto]"
                                            : "grid gap-4 rounded-lg border bg-muted/20 p-4 md:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_160px_140px_auto]"
                                    }>

                                        {type === "INCOME" && (
                                            <div className="space-y-2">
                                                <Label>
                                                    Origem da receita
                                                </Label>

                                                <FinancialPartyCombobox
                                                    role="INCOME_SOURCE"
                                                    value={
                                                        allocation.sourcePartyId
                                                    }
                                                    allowClear
                                                    clearLabel="Sem origem identificada"
                                                    onChange={(value) =>
                                                        handleChangeAllocation(
                                                            index,
                                                            "sourcePartyId",
                                                            value,
                                                        )
                                                    }
                                                />
                                            </div>
                                        )}
                                        <div className="space-y-2">
                                            <Label>Fundo</Label>
                                            <FundComboboxWithCreate
                                                value={allocation.fundId}
                                                allowClear={false}
                                                onChange={(value) =>
                                                    handleChangeAllocation(index, "fundId", value)
                                                }
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label>
                                                {type === "INCOME"
                                                    ? "Destinatário / favorecido"
                                                    : "Recebedor do pagamento"}
                                            </Label>

                                            <FinancialPartyCombobox
                                                role="PAYMENT_RECIPIENT"
                                                value={
                                                    allocation.recipientPartyId
                                                }
                                                allowClear
                                                placeholder={
                                                    type === "INCOME"
                                                        ? "Sem destinação individual"
                                                        : "Sem recebedor identificado"
                                                }
                                                clearLabel={
                                                    type === "INCOME"
                                                        ? "Sem destinação individual"
                                                        : "Sem recebedor identificado"
                                                }
                                                onChange={(value) =>
                                                    handleChangeAllocation(
                                                        index,
                                                        "recipientPartyId",
                                                        value,
                                                    )
                                                }
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Competência</Label>
                                            <Input
                                                type="month"
                                                value={
                                                    allocation.referenceMonth
                                                        ? allocation.referenceMonth
                                                        : ""
                                                }
                                                onChange={(event) =>
                                                    handleChangeAllocation(
                                                        index,
                                                        "referenceMonth",
                                                        event.target.value,
                                                    )
                                                }
                                            />
                                            <p className="text-xs text-muted-foreground">
                                                Padrão: mês da baixa. Altere somente se este repasse
                                                quitar outro mês.
                                            </p>
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Valor</Label>
                                            <CurrencyInput
                                                value={Number(allocation.amount || 0)}
                                                onValueChange={(value) =>
                                                    handleChangeAllocation(
                                                        index,
                                                        "amount",
                                                        String(value ?? 0),
                                                    )
                                                }
                                            />
                                        </div>

                                        <div className="flex items-end">
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleRemoveAllocation(index)}
                                            >
                                                <Trash2 className="size-4 text-destructive" />
                                            </Button>
                                        </div>
                                    </div>

                                    <FinancialCommitmentAllocationCard
                                        transactionType={
                                            type === "INCOME"
                                                ? "INCOME"
                                                : "EXPENSE"
                                        }
                                        sourcePartyId={
                                            allocation.sourcePartyId
                                        }
                                        recipientPartyId={
                                            allocation
                                                .recipientPartyId
                                        }
                                        fundId={
                                            allocation.fundId
                                        }
                                        referenceMonth={
                                            allocation.referenceMonth
                                        }
                                        currentAmount={
                                            Math.abs(
                                                Number(
                                                    allocation.amount ||
                                                    0,
                                                ),
                                            )
                                        }
                                        availableAmount={
                                            Math.min(
                                                Math.abs(
                                                    Number(
                                                        allocation.amount ||
                                                        0,
                                                    ),
                                                ),

                                                getMaxAmountForAllocation(
                                                    index,
                                                ),
                                            )
                                        }
                                        selectedCommitmentId={
                                            allocation
                                                .financialCommitmentId
                                        }
                                        currentCommitment={
                                            null
                                        }
                                        onSelect={(
                                            commitmentSuggestion,
                                        ) =>
                                            handleSelectFinancialCommitment(
                                                index,
                                                commitmentSuggestion,
                                            )
                                        }
                                        onClear={() =>
                                            handleClearFinancialCommitment(
                                                index,
                                            )
                                        }
                                    />

                                    {type === "EXPENSE" && (
                                        <SupportAgreementSuggestionCard
                                            transactionType="EXPENSE"
                                            beneficiaryId={
                                                allocation
                                                    .recipientPartyId
                                            }
                                            fundId={
                                                allocation.fundId
                                            }
                                            referenceMonth={
                                                allocation
                                                    .referenceMonth
                                            }
                                            maxAmount={
                                                Math.min(
                                                    Math.abs(
                                                        Number(
                                                            allocation.amount ||
                                                            0,
                                                        ),
                                                    ),

                                                    getMaxAmountForAllocation(
                                                        index,
                                                    ),
                                                )
                                            }
                                            autoApply={false}
                                            onApply={(suggestion) =>
                                                handleApplySupportAgreementSuggestion(
                                                    index,
                                                    suggestion,
                                                )
                                            }
                                        />
                                    )}

                                    {suggestion && (
                                        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                                            <div className="flex gap-2">
                                                <AlertTriangle className="mt-0.5 size-4 shrink-0" />

                                                <div className="space-y-2">
                                                    <p className="font-medium">
                                                        O fundo selecionado não possui saldo suficiente.
                                                    </p>

                                                    <p>
                                                        Saldo disponível em{" "}
                                                        <strong>{suggestion.selectedFund.label}</strong>:{" "}
                                                        {formatCurrency(
                                                            Math.max(
                                                                suggestion.selectedFund.currentBalance,
                                                                0,
                                                            ),
                                                        )}
                                                        .
                                                    </p>

                                                    <p>
                                                        Sugestão: alocar{" "}
                                                        <strong>
                                                            {formatCurrency(suggestion.selectedFundAmount)}
                                                        </strong>{" "}
                                                        em {suggestion.selectedFund.label} e{" "}
                                                        <strong>
                                                            {formatCurrency(suggestion.defaultFundAmount)}
                                                        </strong>{" "}
                                                        em {suggestion.defaultFund.label}.
                                                    </p>

                                                    <p className="text-xs">
                                                        Nada será salvo automaticamente. Clique em aplicar,
                                                        revise e depois salve a classificação.
                                                    </p>

                                                    <Button
                                                        type="button"
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() =>
                                                            handleApplyReallocationSuggestion(index)
                                                        }
                                                    >
                                                        Aplicar sugestão
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}

                <div className="flex flex-col gap-1 border-t pt-3 text-sm sm:flex-row sm:items-center sm:justify-between">
                    <span className="text-muted-foreground">
                        Total alocado: R$ {totalAllocated.toFixed(2)}
                    </span>

                    <span
                        className={
                            remainingAmount < 0
                                ? "font-medium text-destructive"
                                : "text-muted-foreground"
                        }
                    >
                        Restante: R$ {remainingAmount.toFixed(2)}
                    </span>
                </div>
            </div>

            {type !== "TRANSFER" && (
                <div className="space-y-3 rounded-xl border p-4">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                            <Paperclip className="size-4 text-muted-foreground" />

                            <div>
                                <h3 className="text-sm font-medium">Anexos opcionais</h3>
                                <p className="text-xs text-muted-foreground">
                                    Os arquivos serão enviados somente depois que a classificação
                                    for salva.
                                </p>
                            </div>
                        </div>

                        {categoryId && (
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={handleAddPendingAttachment}
                            >
                                <Plus className="mr-2 size-4" />
                                Adicionar anexo
                            </Button>
                        )}
                    </div>

                    {!categoryId ? (
                        <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                            Selecione uma categoria para adicionar anexos à classificação.
                        </div>
                    ) : pendingAttachments.length === 0 ? (
                        <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                            Nenhum anexo selecionado. Você pode salvar a classificação sem
                            anexos ou adicionar comprovantes e documentos agora.
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {pendingAttachments.map((attachment) => (
                                <div
                                    key={attachment.id}
                                    className="grid gap-3 rounded-lg border border-dashed p-3 md:grid-cols-[180px_minmax(0,1fr)_auto] md:items-end"
                                >
                                    <div className="space-y-2">
                                        <Label>Tipo</Label>

                                        <Select
                                            value={attachment.type}
                                            onValueChange={(value) =>
                                                handleChangePendingAttachmentType(
                                                    attachment.id,
                                                    value as AttachmentType,
                                                )
                                            }
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>

                                            <SelectContent>
                                                <SelectItem value="PROOF_OF_PAYMENT">
                                                    {attachmentTypeLabels.PROOF_OF_PAYMENT}
                                                </SelectItem>

                                                <SelectItem value="RECEIPT">
                                                    {attachmentTypeLabels.RECEIPT}
                                                </SelectItem>

                                                <SelectItem value="INVOICE">
                                                    {attachmentTypeLabels.INVOICE}
                                                </SelectItem>

                                                <SelectItem value="CONTRACT">
                                                    {attachmentTypeLabels.CONTRACT}
                                                </SelectItem>

                                                <SelectItem value="OTHER">
                                                    {attachmentTypeLabels.OTHER}
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Arquivo</Label>

                                        <Input
                                            type="file"
                                            accept={getAttachmentAcceptAttribute()}
                                            onChange={(event) =>
                                                handleChangePendingAttachmentFile(
                                                    attachment.id,
                                                    event.target.files?.[0] ?? null,
                                                )
                                            }
                                        />

                                        {attachment.file && (
                                            <p className="text-xs text-muted-foreground">
                                                {getAttachmentRulesDescription()}
                                            </p>
                                        )}
                                    </div>

                                    <div className="flex items-end">
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            onClick={() =>
                                                handleRemovePendingAttachment(attachment.id)
                                            }
                                        >
                                            <Trash2 className="size-4 text-destructive" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            <div className="flex justify-end gap-2 border-t pt-4">
                {onCancel && (
                    <Button
                        type="button"
                        variant="outline"
                        disabled={
                            classifyTransaction.isPending ||
                            uploadAttachmentMutation.isPending
                        }
                        onClick={onCancel}
                    >
                        {cancelLabel}
                    </Button>
                )}

                <Button
                    type="submit"
                    disabled={
                        classifyTransaction.isPending || uploadAttachmentMutation.isPending
                    }
                >
                    {classifyTransaction.isPending
                        ? "Salvando classificação..."
                        : uploadAttachmentMutation.isPending
                            ? "Enviando anexo..."
                            : "Salvar classificação"}
                </Button>
            </div>
        </form>
    );
}