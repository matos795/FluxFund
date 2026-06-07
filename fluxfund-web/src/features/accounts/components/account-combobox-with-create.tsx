import { useState } from "react"

import { EntityCombobox } from "@/components/form/entity-combobox"
import { CreateAccountDialog } from "./create-account-dialog"
import { useAccountOptions } from "../hooks/use-account-options"

type AccountComboboxWithCreateProps = {
  value: string
  placeholder?: string
  searchPlaceholder?: string
  emptyMessage?: string
  allowClear?: boolean
  clearLabel?: string
  disabled?: boolean
  onChange: (value: string) => void
}

export function AccountComboboxWithCreate({
  value,
  placeholder = "Selecione a conta",
  searchPlaceholder = "Buscar conta...",
  emptyMessage = "Nenhuma conta encontrada.",
  allowClear = false,
  clearLabel = "Sem conta",
  disabled = false,
  onChange,
}: AccountComboboxWithCreateProps) {
  const [createOpen, setCreateOpen] = useState(false)

  const { data: accounts = [] } = useAccountOptions()

  return (
    <>
      <EntityCombobox
        value={value}
        options={accounts.map((account) => ({
          value: account.id,
          label: account.label,
        }))}
        placeholder={placeholder}
        searchPlaceholder={searchPlaceholder}
        emptyMessage={emptyMessage}
        allowClear={allowClear}
        clearLabel={clearLabel}
        disabled={disabled}
        createLabel="Nova conta"
        onCreate={() => setCreateOpen(true)}
        onChange={onChange}
      />

      <CreateAccountDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={(accountId) => {
          onChange(accountId)
        }}
      />
    </>
  )
}