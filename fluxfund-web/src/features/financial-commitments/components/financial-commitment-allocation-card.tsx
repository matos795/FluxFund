import {
    AlertTriangle,
    CheckCircle2,
    CircleHelp,
    HandCoins,
    Link2Off,
    RefreshCw,
    SearchX,
} from "lucide-react"

import {
    Badge,
} from "@/components/ui/badge"

import {
    Button,
} from "@/components/ui/button"

import {
    formatCurrency,
} from "@/utils/formatters"

import {
    financialCommitmentRecurrenceLabels,
    financialCommitmentTypeLabels,
} from "../financial-commitment-labels"

import type {
    FinancialCommitmentAllocationSuggestion,
    FinancialCommitmentAllocationSummary,
} from "../financial-commitment-types"

import {
    useFinancialCommitmentAllocationSuggestions,
} from "../hooks/use-financial-commitment-allocation-suggestions"
import { getApiErrorMessage } from "@/utils/api-error"

type FinancialCommitmentAllocationCardProps = {
    transactionType:
    | "INCOME"
    | "EXPENSE"

    sourcePartyId?:
    string | null

    recipientPartyId?:
    string | null

    fundId?:
    string | null

    referenceMonth?:
    string | null

    /*
     * Valor que ainda pode ser usado nesta
     * alocação sem ultrapassar a transação.
     */
    availableAmount: number

    /*
     * Valor atualmente preenchido no input.
     */
    currentAmount: number

    excludedAllocationId?:
    string | null

    selectedCommitmentId?:
    string | null

    /*
     * Necessário para continuar mostrando
     * um vínculo histórico, inclusive quando
     * o compromisso já foi desativado.
     */
    currentCommitment?:
    FinancialCommitmentAllocationSummary
    | null

    onSelect: (
        suggestion:
            FinancialCommitmentAllocationSuggestion,
    ) => void

    onClear: () => void
}

export function FinancialCommitmentAllocationCard({
    transactionType,
    sourcePartyId,
    recipientPartyId,
    fundId,
    referenceMonth,
    availableAmount,
    currentAmount,
    excludedAllocationId,
    selectedCommitmentId,
    currentCommitment,
    onSelect,
    onClear,
}: FinancialCommitmentAllocationCardProps) {
    const hasRequiredParty =
        transactionType === "INCOME"
            ? Boolean(
                sourcePartyId,
            )
            : Boolean(
                recipientPartyId,
            )

    const missingRequirements = [
        !hasRequiredParty
            ? transactionType ===
                "INCOME"
                ? "origem da receita"
                : "recebedor do pagamento"
            : null,

        !fundId
            ? "fundo"
            : null,

        !referenceMonth
            ? "competência"
            : null,

        currentAmount <= 0
            ? "valor da alocação"
            : null,

        currentAmount > 0 &&
            availableAmount <= 0
            ? "valor disponível na transação"
            : null,
    ].filter(
        (
            requirement,
        ): requirement is string =>
            Boolean(requirement),
    )

    const canSearch =
        missingRequirements.length ===
        0

    const suggestionsQuery =
        useFinancialCommitmentAllocationSuggestions({
            params: {
                transactionType,

                sourcePartyId:
                    sourcePartyId ||
                    null,

                recipientPartyId:
                    recipientPartyId ||
                    null,

                fundId:
                    fundId || "",

                referenceMonth:
                    referenceMonth || "",

                availableAmount,

                excludedAllocationId:
                    excludedAllocationId ||
                    null,
            },

            enabled:
                canSearch,
        })

    const suggestions =
        suggestionsQuery.data ?? []

    const selectedSuggestion =
        selectedCommitmentId
            ? suggestions.find(
                (suggestion) =>
                    suggestion
                        .commitment
                        .id ===
                    selectedCommitmentId,
            )
            : undefined

    /*
     * Em vínculos novos, o compromisso vem
     * da sugestão.
     *
     * Em vínculos antigos ou desativados,
     * usamos o resumo presente na alocação.
     */
    const selectedCommitment =
        selectedSuggestion
            ?.commitment ??
        (
            currentCommitment?.id ===
                selectedCommitmentId
                ? currentCommitment
                : null
        )

    if (
        selectedCommitmentId &&
        selectedCommitment
    ) {
        const exactFundMatch =
            selectedSuggestion
                ? selectedSuggestion
                    .exactFundMatch
                : selectedCommitment
                    .plannedFund
                    .id === fundId

        const remainingBeforeAllocation =
            selectedSuggestion
                ?.remainingAmount

        const amountAboveExpected =
            remainingBeforeAllocation ===
                undefined
                ? 0
                : Math.max(
                    Math.abs(
                        currentAmount,
                    ) -
                    Number(
                        remainingBeforeAllocation,
                    ),
                    0,
                )

        return (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-950">
                <div className="flex gap-3">
                    <CheckCircle2 className="mt-0.5 size-5 shrink-0" />

                    <div className="min-w-0 flex-1 space-y-3">
                        <div className="flex flex-wrap items-center gap-2">
                            <p className="font-medium">
                                Alocação vinculada a um compromisso
                            </p>

                            <Badge variant="outline">
                                {
                                    financialCommitmentTypeLabels[
                                    selectedCommitment
                                        .commitmentType
                                    ]
                                }
                            </Badge>

                            {!selectedCommitment.active && (
                                <Badge variant="secondary">
                                    Compromisso desativado
                                </Badge>
                            )}
                        </div>

                        <CommitmentDescription
                            commitment={
                                selectedCommitment
                            }
                        />

                        <div className="grid gap-3 sm:grid-cols-3">
                            <CommitmentValue
                                label="Previsto"
                                value={
                                    selectedCommitment
                                        .amount
                                }
                            />

                            <CommitmentValue
                                label="Já realizado antes desta alocação"
                                value={
                                    selectedSuggestion
                                        ?.realizedAmount
                                }
                            />

                            <CommitmentValue
                                label="Valor desta alocação"
                                value={
                                    currentAmount
                                }
                            />
                        </div>

                        {!exactFundMatch && (
                            <div className="flex gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-amber-950">
                                <AlertTriangle className="mt-0.5 size-4 shrink-0" />

                                <p className="text-xs">
                                    O compromisso prevê o fundo{" "}
                                    <strong>
                                        {
                                            selectedCommitment
                                                .plannedFund
                                                .name
                                        }
                                    </strong>
                                    , mas esta alocação está usando outro fundo. O vínculo é permitido e essa diferença ficará registrada.
                                </p>
                            </div>
                        )}

                        {amountAboveExpected >
                            0 && (
                                <div className="flex gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-amber-950">
                                    <AlertTriangle className="mt-0.5 size-4 shrink-0" />

                                    <p className="text-xs">
                                        Esta alocação possui{" "}
                                        <strong>
                                            {
                                                formatCurrency(
                                                    amountAboveExpected,
                                                )
                                            }
                                        </strong>{" "}
                                        acima do valor que faltava para o compromisso. O relatório poderá mostrar esse valor como recebido ou pago acima do previsto.
                                    </p>
                                </div>
                            )}

                        {!selectedCommitment.active && (
                            <p className="text-xs text-muted-foreground">
                                O vínculo histórico será preservado. Um compromisso desativado não aparecerá em novas sugestões.
                            </p>
                        )}

                        <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={
                                onClear
                            }
                        >
                            <Link2Off className="mr-2 size-4" />
                            Remover vínculo
                        </Button>
                    </div>
                </div>
            </div>
        )
    }

    if (!canSearch) {
        return (
            <div className="rounded-lg border border-dashed bg-muted/20 p-3 text-sm">
                <div className="flex gap-3">
                    <CircleHelp className="mt-0.5 size-4 shrink-0 text-muted-foreground" />

                    <div className="space-y-1">
                        <p className="font-medium">
                            Verificação de compromisso
                        </p>

                        <p className="text-xs text-muted-foreground">
                            Preencha{" "}
                            {
                                missingRequirements.join(
                                    ", ",
                                )
                            }{" "}
                            para o sistema verificar se esta alocação realiza algum compromisso financeiro.
                        </p>

                        <p className="text-xs text-muted-foreground">
                            O vínculo é opcional. Receitas e despesas comuns continuam podendo ser salvas normalmente.
                        </p>
                    </div>
                </div>
            </div>
        )
    }

    if (
        suggestionsQuery.isLoading
    ) {
        return (
            <div className="rounded-lg border bg-muted/30 p-3 text-sm text-muted-foreground">
                Verificando compromissos compatíveis...
            </div>
        )
    }

    if (
        suggestionsQuery.isError
    ) {
        return (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">
                <div className="flex gap-3">
                    <AlertTriangle className="mt-0.5 size-4 shrink-0" />

                    <div className="space-y-2">
                        <div>
                            <p className="font-medium">
                                Não foi possível verificar os compromissos
                            </p>

                            <p className="text-xs">
                                {
                                    getApiErrorMessage(
                                        suggestionsQuery.error,
                                        "O sistema não conseguiu consultar os compromissos compatíveis.",
                                    )
                                }
                            </p>
                        </div>

                        <p className="text-xs">
                            A alocação ainda pode ser salva sem vínculo.
                        </p>

                        <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() =>
                                suggestionsQuery.refetch()
                            }
                        >
                            <RefreshCw className="mr-2 size-4" />
                            Verificar novamente
                        </Button>
                    </div>
                </div>
            </div>
        )
    }

    const availableSuggestions =
        suggestions.filter(
            (suggestion) =>
                !suggestion.fulfilled &&
                suggestion
                    .suggestedAmount >
                0,
        )

    if (
        availableSuggestions.length ===
        0
    ) {
        return (
            <div className="rounded-lg border bg-muted/20 p-3 text-sm">
                <div className="flex gap-3">
                    <SearchX className="mt-0.5 size-4 shrink-0 text-muted-foreground" />

                    <div className="space-y-1">
                        <p className="font-medium">
                            Nenhum compromisso compatível
                        </p>

                        <p className="text-xs text-muted-foreground">
                            O sistema verificou o contato, a destinação, a competência e os compromissos vigentes, mas não encontrou uma correspondência.
                        </p>

                        <p className="text-xs text-muted-foreground">
                            Salve normalmente quando este lançamento não estiver relacionado a um compromisso.
                        </p>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-950">
            <div className="flex gap-3">
                <HandCoins className="mt-0.5 size-5 shrink-0" />

                <div className="min-w-0 flex-1 space-y-3">
                    <div className="space-y-1">
                        <p className="font-medium">
                            {availableSuggestions.length ===
                                1
                                ? "Compromisso compatível encontrado"
                                : "Mais de um compromisso pode corresponder a esta alocação"}
                        </p>

                        <p className="text-xs text-blue-900/80">
                            Nada será vinculado automaticamente. Confira os dados e escolha o compromisso correto.
                        </p>
                    </div>

                    <div className="space-y-3">
                        {availableSuggestions.map(
                            (suggestion) => (
                                <div
                                    key={
                                        suggestion
                                            .commitment
                                            .id
                                    }
                                    className="rounded-md border border-blue-200 bg-background/80 p-3"
                                >
                                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                                        <div className="min-w-0 space-y-2">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <p className="font-medium">
                                                    {
                                                        financialCommitmentTypeLabels[
                                                        suggestion
                                                            .commitment
                                                            .commitmentType
                                                        ]
                                                    }
                                                </p>

                                                <Badge variant="outline">
                                                    {
                                                        financialCommitmentRecurrenceLabels[
                                                        suggestion
                                                            .commitment
                                                            .recurrence
                                                        ]
                                                    }
                                                </Badge>
                                            </div>

                                            <CommitmentDescription
                                                commitment={
                                                    suggestion
                                                        .commitment
                                                }
                                            />

                                            <div className="grid gap-2 sm:grid-cols-4">
                                                <CommitmentValue
                                                    label="Previsto"
                                                    value={
                                                        suggestion
                                                            .commitment
                                                            .amount
                                                    }
                                                />

                                                <CommitmentValue
                                                    label="Já realizado"
                                                    value={
                                                        suggestion
                                                            .realizedAmount
                                                    }
                                                />

                                                <CommitmentValue
                                                    label="Ainda falta"
                                                    value={
                                                        suggestion
                                                            .remainingAmount
                                                    }
                                                />

                                                <CommitmentValue
                                                    label="Usar agora"
                                                    value={
                                                        suggestion
                                                            .suggestedAmount
                                                    }
                                                />
                                            </div>

                                            {!suggestion
                                                .exactFundMatch && (
                                                    <div className="flex gap-2 rounded-md border border-amber-200 bg-amber-50 p-2 text-amber-950">
                                                        <AlertTriangle className="mt-0.5 size-4 shrink-0" />

                                                        <p className="text-xs">
                                                            Fundo previsto:{" "}
                                                            <strong>
                                                                {
                                                                    suggestion
                                                                        .commitment
                                                                        .plannedFund
                                                                        .name
                                                                }
                                                            </strong>
                                                            . O vínculo pode ser utilizado mantendo o fundo atualmente selecionado.
                                                        </p>
                                                    </div>
                                                )}
                                        </div>

                                        <Button
                                            type="button"
                                            size="sm"
                                            onClick={() =>
                                                onSelect(
                                                    suggestion,
                                                )
                                            }
                                        >
                                            Usar compromisso
                                        </Button>
                                    </div>
                                </div>
                            ),
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

function CommitmentDescription({
    commitment,
}: {
    commitment:
    FinancialCommitmentAllocationSummary
}) {
    return (
        <div className="space-y-1 text-xs text-muted-foreground">
            <p>
                <strong className="text-foreground">
                    {
                        commitment
                            .party
                            .name
                    }
                </strong>

                {commitment
                    .designatedRecipient && (
                        <>
                            {" → "}

                            <strong className="text-foreground">
                                {
                                    commitment
                                        .designatedRecipient
                                        .name
                                }
                            </strong>
                        </>
                    )}
            </p>

            <p>
                Fundo previsto:{" "}
                <strong>
                    {
                        commitment
                            .plannedFund
                            .name
                    }
                </strong>
            </p>
        </div>
    )
}

function CommitmentValue({
    label,
    value,
}: {
    label: string
    value?:
    number | null
}) {
    return (
        <div className="rounded-md border bg-background/70 p-2">
            <p className="text-[11px] text-muted-foreground">
                {label}
            </p>

            <p className="font-medium">
                {value ===
                    undefined ||
                    value === null
                    ? "—"
                    : formatCurrency(
                        Number(value),
                    )}
            </p>
        </div>
    )
}