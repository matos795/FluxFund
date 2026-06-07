import { useState } from "react"

import { EntityCombobox } from "@/components/form/entity-combobox"
import { CreateBeneficiaryDialog } from "./create-beneficiary-dialog"
import { useBeneficiaryOptions } from "../hooks/use-beneficiary-options"

type BeneficiaryComboboxWithCreateProps = {
  value: string
  placeholder?: string
  searchPlaceholder?: string
  emptyMessage?: string
  allowClear?: boolean
  clearLabel?: string
  disabled?: boolean
  onChange: (value: string) => void
}

export function BeneficiaryComboboxWithCreate({
  value,
  placeholder = "Sem favorecido",
  searchPlaceholder = "Buscar favorecido...",
  emptyMessage = "Nenhum favorecido encontrado.",
  allowClear = true,
  clearLabel = "Sem favorecido",
  disabled = false,
  onChange,
}: BeneficiaryComboboxWithCreateProps) {
  const [createOpen, setCreateOpen] = useState(false)

  const { data: beneficiaries = [] } = useBeneficiaryOptions()

  return (
    <>
      <EntityCombobox
        value={value}
        options={beneficiaries.map((beneficiary) => ({
          value: beneficiary.id,
          label: beneficiary.label,
        }))}
        placeholder={placeholder}
        searchPlaceholder={searchPlaceholder}
        emptyMessage={emptyMessage}
        allowClear={allowClear}
        clearLabel={clearLabel}
        disabled={disabled}
        createLabel="Novo favorecido"
        onCreate={() => setCreateOpen(true)}
        onChange={onChange}
      />

      <CreateBeneficiaryDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={(beneficiaryId) => {
          onChange(beneficiaryId)
        }}
      />
    </>
  )
}