import { Check, ChevronsUpDown, Plus, Search, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import type { CategoryOption } from "@/features/categories/category-types"
import { normalizeSearch } from "@/utils/normalizer"
import { useState } from "react"
import { useCommandListWheelScroll } from "./use-command-list-wheel-scroll"

type CategoryComboboxProps = {
  value: string
  options: CategoryOption[]
  placeholder?: string
  searchPlaceholder?: string
  emptyMessage?: string
  onChange: (value: string) => void
  disabled?: boolean
  allowClear?: boolean
  clearLabel?: string
  onCreate?: () => void
  createLabel?: string
}

export function CategoryCombobox({
  value,
  options,
  placeholder = "Selecione a categoria",
  searchPlaceholder = "Buscar categoria...",
  emptyMessage = "Nenhuma categoria encontrada.",
  onChange,
  disabled = false,
  allowClear = true,
  clearLabel = "Todas as categorias",
  onCreate,
  createLabel = "Nova categoria",
}: CategoryComboboxProps) {
  const selectedOption = options.find((option) => option.id === value)

  const { listRef, handleWheel } = useCommandListWheelScroll()

  const [open, setOpen] = useState(false)

  const parentOptions = options.filter((option) => !option.parentId)

  const orphanChildOptions = options.filter(
    (option) =>
      option.parentId &&
      !options.some((parent) => parent.id === option.parentId),
  )

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          disabled={disabled}
          className="w-full justify-between"
        >
          <span className="truncate">
            {selectedOption ? selectedOption.label : placeholder}
          </span>

          <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>

      <PopoverContent
        side="bottom"
        align="start"
        sideOffset={6}
        collisionPadding={12}
        className="w-[--radix-popover-trigger-width] p-0"
        onWheelCapture={handleWheel}
      >
        <Command
          filter={(value, search) => {
            const normalizedSearch = normalizeSearch(search)

            return value.includes(normalizedSearch) ? 1 : 0
          }}
        >
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 size-4 shrink-0 opacity-50" />

            <CommandInput
              placeholder={searchPlaceholder}
              className="flex-1"
            />

            {onCreate && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="ml-2 size-8 shrink-0"
                title={createLabel}
                onClick={(event) => {
                  event.preventDefault()
                  event.stopPropagation()

                  setOpen(false)
                  onCreate()
                }}
              >
                <Plus className="size-4" />
                <span className="sr-only">{createLabel}</span>
              </Button>
            )}
          </div>

          <CommandList
            ref={listRef}
            className="max-h-52"
          >
            <CommandEmpty>{emptyMessage}</CommandEmpty>

            {allowClear && (
              <CommandGroup>
                <CommandItem
                  value={normalizeSearch(clearLabel)}
                  onSelect={() => {
                    onChange("")
                    setOpen(false)
                  }}
                >
                  <X
                    className={cn(
                      "mr-2 size-4",
                      value === "" ? "opacity-100" : "opacity-40",
                    )}
                  />
                  {clearLabel}
                </CommandItem>
              </CommandGroup>
            )}

            {parentOptions.map((parent) => {
              const children = options.filter(
                (option) => option.parentId === parent.id,
              )

              return (
                <CommandGroup key={parent.id} heading={parent.name}>
                  <CommandItem
                    value={normalizeSearch(
                      [
                        parent.name,
                        parent.label,
                        parent.parentName ?? "",
                      ].join(" "),
                    )}
                    onSelect={() => {
                      onChange(parent.id)
                      setOpen(false)
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 size-4",
                        value === parent.id ? "opacity-100" : "opacity-0",
                      )}
                    />

                    <span className="font-medium">{parent.name}</span>
                  </CommandItem>

                  {children.map((child) => (
                    <CommandItem
                      key={child.id}
                      value={normalizeSearch(
                        [
                          child.name,
                          child.label,
                          child.parentName ?? "",
                        ].join(" "),
                      )}
                      onSelect={() => {
                        onChange(child.id)
                        setOpen(false)
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 size-4",
                          value === child.id ? "opacity-100" : "opacity-0",
                        )}
                      />

                      <span className="pl-4">
                        {child.name}
                      </span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )
            })}

            {orphanChildOptions.length > 0 && (
              <CommandGroup heading="Outras categorias">
                {orphanChildOptions.map((category) => (
                  <CommandItem
                    key={category.id}
                    value={normalizeSearch(
                      [
                        category.name,
                        category.label,
                        category.parentName ?? "",
                      ].join(" "),
                    )}
                    onSelect={() => onChange(category.id)}
                  >
                    <Check
                      className={cn(
                        "mr-2 size-4",
                        value === category.id ? "opacity-100" : "opacity-0",
                      )}
                    />

                    <span>{category.label}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}