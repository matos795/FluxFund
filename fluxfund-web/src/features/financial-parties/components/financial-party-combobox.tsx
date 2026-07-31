import {
  EntityCombobox,
} from "@/components/form/entity-combobox"

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

type FinancialPartyComboboxProps = {
  role: FinancialPartyRole

  value: string

  onChange: (
    value: string,
  ) => void

  placeholder?: string
  searchPlaceholder?: string
  emptyMessage?: string
  clearLabel?: string

  allowClear?: boolean
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
  disabled = false,
}: FinancialPartyComboboxProps) {
  const optionsQuery =
    useFinancialPartyOptions(
      role,
    )

  const isIncomeSource =
    role === "INCOME_SOURCE"

  const options =
    optionsQuery.data ?? []

  return (
    <EntityCombobox
      value={value}
      options={options.map(
        (financialParty) => {
          const classification =
            financialPartyClassificationLabels[
              financialParty.classification
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
            value:
              financialParty.id,

            label,

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
    />
  )
}