import {
    useState,
} from "react"

import {
    EntityCombobox,
} from "@/components/form/entity-combobox"

import {
    usePermissions,
} from "@/features/auth/hooks/use-permissions"

import {
    financialPartyClassificationLabels,
    formatFinancialPartyDocument,
} from "../financial-party-labels"

import {
    useFinancialPartyOptions,
} from "../hooks/use-financial-party-options"

import type {
    FinancialPartyRole,
} from "../financial-party-types"

import {
    CreateFinancialPartyDialog,
} from "./create-financial-party-dialog"

type FinancialPartyComboboxProps = {
    role:
    FinancialPartyRole

    value: string

    onChange: (
        value: string,
    ) => void

    placeholder?: string
    searchPlaceholder?: string
    emptyMessage?: string
    clearLabel?: string

    allowClear?: boolean
    allowCreate?: boolean
    disabled?: boolean
}

export function FinancialPartyCombobox({
    role,
    value,
    onChange,
    placeholder,
    searchPlaceholder,
    emptyMessage,
    clearLabel,
    allowClear = true,
    allowCreate = true,
    disabled = false,
}: FinancialPartyComboboxProps) {
    const [
        createDialogOpen,
        setCreateDialogOpen,
    ] = useState(false)

    const {
        canFinanceWrite,
    } = usePermissions()

    const optionsQuery =
        useFinancialPartyOptions(
            role,
        )

    const isIncomeSource =
        role ===
        "INCOME_SOURCE"

    const options =
        optionsQuery.data ?? []

    const createLabel =
        isIncomeSource
            ? "Cadastrar nova origem de receita"
            : "Cadastrar novo recebedor"

    return (
        <>
            <EntityCombobox
                value={
                    value
                }
                options={options.map(
                    (financialParty) => {
                        const classification =
                            financialPartyClassificationLabels[
                            financialParty
                                .classification
                            ]

                        const document =
                            formatFinancialPartyDocument(
                                financialParty.document,
                                financialParty.partyType,
                            )

                        const formattedDocument =
                            document !== "-"
                                ? document
                                : null

                        const label = [
                            financialParty.label,
                            classification,
                            formattedDocument,
                        ]
                            .filter(Boolean)
                            .join(" · ")

                        return {
                            value: financialParty.id,

                            label,

                            selectedLabel: financialParty.label,

                            searchValue: [
                                financialParty.label,
                                financialParty.document,
                                classification,
                            ]
                                .filter(Boolean)
                                .join(" "),

                        }
                    },
                )}
                placeholder={
                    placeholder ??
                    (
                        isIncomeSource
                            ? "Sem origem identificada"
                            : "Sem recebedor"
                    )
                }
                searchPlaceholder={
                    searchPlaceholder ??
                    (
                        isIncomeSource
                            ? "Buscar origem da receita..."
                            : "Buscar recebedor..."
                    )
                }
                emptyMessage={
                    emptyMessage ??
                    (
                        isIncomeSource
                            ? "Nenhuma origem de receita encontrada."
                            : "Nenhum recebedor encontrado."
                    )
                }
                allowClear={
                    allowClear
                }
                clearLabel={
                    clearLabel ??
                    (
                        isIncomeSource
                            ? "Sem origem identificada"
                            : "Sem recebedor"
                    )
                }
                disabled={
                    disabled ||
                    optionsQuery.isLoading
                }
                onChange={
                    onChange
                }
                createLabel={
                    createLabel
                }
                onCreate={
                    canFinanceWrite &&
                        allowCreate
                        ? () =>
                            setCreateDialogOpen(
                                true,
                            )
                        : undefined
                }
            />

            {canFinanceWrite &&
                allowCreate && (
                    <CreateFinancialPartyDialog
                        open={
                            createDialogOpen
                        }
                        onOpenChange={
                            setCreateDialogOpen
                        }
                        requiredRole={
                            role
                        }
                        showTrigger={
                            false
                        }
                        onCreated={(
                            financialParty,
                        ) => {
                            onChange(
                                financialParty.id,
                            )
                        }}
                    />
                )}
        </>
    )
}