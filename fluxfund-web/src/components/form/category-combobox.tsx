import { Check, ChevronsUpDown, Search, X } from "lucide-react"

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
}: CategoryComboboxProps) {
  const selectedOption = options.find((option) => option.id === value)

  const parentOptions = options.filter((option) => !option.parentId)

  const orphanChildOptions = options.filter(
    (option) =>
      option.parentId &&
      !options.some((parent) => parent.id === option.parentId),
  )

  return (
    <Popover>
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

      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command>
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 size-4 shrink-0 opacity-50" />
            <CommandInput placeholder={searchPlaceholder} />
          </div>

          <CommandList>
            <CommandEmpty>{emptyMessage}</CommandEmpty>

            {allowClear && (
              <CommandGroup>
                <CommandItem
                  value={clearLabel}
                  onSelect={() => onChange("")}
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
                    value={[
                      parent.name,
                      parent.label,
                      parent.parentName ?? "",
                    ].join(" ")}
                    onSelect={() => onChange(parent.id)}
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
                      value={[
                        child.name,
                        child.label,
                        child.parentName ?? "",
                      ].join(" ")}
                      onSelect={() => onChange(child.id)}
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
                    value={[
                      category.name,
                      category.label,
                      category.parentName ?? "",
                    ].join(" ")}
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