import { useState } from "react"

import { EntityCombobox } from "@/components/form/entity-combobox"
import { CreateFundDialog } from "./create-fund-dialog"
import { useFundOptions } from "../hooks/use-fund-options"

type FundComboboxWithCreateProps = {
  value: string
  placeholder?: string
  searchPlaceholder?: string
  emptyMessage?: string
  allowClear?: boolean
  clearLabel?: string
  disabled?: boolean
  onChange: (value: string) => void
}

export function FundComboboxWithCreate({
  value,
  placeholder = "Selecione o fundo",
  searchPlaceholder = "Buscar fundo...",
  emptyMessage = "Nenhum fundo encontrado.",
  allowClear = false,
  clearLabel = "Sem fundo",
  disabled = false,
  onChange,
}: FundComboboxWithCreateProps) {
  const [createOpen, setCreateOpen] = useState(false)

  const { data: funds = [] } = useFundOptions()

  return (
    <>
      <EntityCombobox
        value={value}
        options={funds.map((fund) => ({
          value: fund.id,
          label: fund.label,
        }))}
        placeholder={placeholder}
        searchPlaceholder={searchPlaceholder}
        emptyMessage={emptyMessage}
        allowClear={allowClear}
        clearLabel={clearLabel}
        disabled={disabled}
        createLabel="Novo fundo"
        onCreate={() => setCreateOpen(true)}
        onChange={onChange}
      />

      <CreateFundDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={(fundId) => {
          onChange(fundId)
        }}
      />
    </>
  )
}