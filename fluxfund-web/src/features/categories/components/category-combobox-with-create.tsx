import { useState } from "react"

import { CreateCategoryDialog } from "./create-category-dialog"
import { useCategoryOptions } from "../hooks/use-category-options"
import type { CategoryType } from "../category-types"
import { CategoryCombobox } from "@/components/form/category-combobox"

type CategoryComboboxWithCreateProps = {
  value: string
  type?: CategoryType
  placeholder?: string
  searchPlaceholder?: string
  emptyMessage?: string
  allowClear?: boolean
  clearLabel?: string
  disabled?: boolean
  onChange: (value: string) => void
}

export function CategoryComboboxWithCreate({
  value,
  type,
  placeholder = "Selecione a categoria",
  searchPlaceholder = "Buscar categoria...",
  emptyMessage = "Nenhuma categoria encontrada.",
  allowClear = false,
  clearLabel = "Sem categoria",
  disabled = false,
  onChange,
}: CategoryComboboxWithCreateProps) {
  const [createOpen, setCreateOpen] = useState(false)

  const { data: categories = [] } = useCategoryOptions(type)

  return (
    <>
      <CategoryCombobox
        value={value}
        options={categories}
        placeholder={placeholder}
        searchPlaceholder={searchPlaceholder}
        emptyMessage={emptyMessage}
        allowClear={allowClear}
        clearLabel={clearLabel}
        disabled={disabled}
        createLabel="Nova categoria"
        onCreate={() => setCreateOpen(true)}
        onChange={onChange}
      />

      <CreateCategoryDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={(categoryId) => {
          onChange(categoryId)
        }}
      />
    </>
  )
}