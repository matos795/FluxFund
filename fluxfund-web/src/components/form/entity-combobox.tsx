import { Check, ChevronsUpDown, Plus, Search, X } from "lucide-react"

import { cn } from "@/lib/utils"
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
import { useState } from "react"
import { useCommandListWheelScroll } from "./use-command-list-wheel-scroll"

type EntityComboboxOption = {
  value: string
  label: string
  searchValue?: string
  selectedLabel?: string
}

type EntityComboboxProps = {
  value: string
  options: EntityComboboxOption[]
  placeholder: string
  searchPlaceholder?: string
  emptyMessage?: string
  onChange: (value: string) => void
  disabled?: boolean
  allowClear?: boolean
  clearLabel?: string
  createLabel?: string
  onCreate?: () => void
}

export function EntityCombobox({
  value,
  options,
  placeholder,
  searchPlaceholder = "Buscar...",
  emptyMessage = "Nenhum resultado encontrado.",
  onChange,
  disabled = false,
  allowClear = true,
  clearLabel = "Todos",
  createLabel = "Criar novo",
  onCreate,
}: EntityComboboxProps) {
  const selectedOption = options.find((option) => option.value === value)
  const [open, setOpen] = useState(false)
  const { listRef, handleWheel } = useCommandListWheelScroll()

  return (
    <div className="w-full min-w-0">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            disabled={disabled}
            className="w-full min-w-0 max-w-full justify-between overflow-hidden"
          >
            <span className="min-w-0 flex-1 truncate text-left">
              {selectedOption
                ? selectedOption.selectedLabel ??
                selectedOption.label
                : placeholder}
            </span>

            <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>

        <PopoverContent
          side="bottom"
          align="start"
          sideOffset={6}
          collisionPadding={12}
          className="w-[--radix-popover-trigger-width] max-w-[calc(100vw-2rem)] p-0"
          onWheelCapture={handleWheel}
        >
          <Command>
            <div className="flex items-center border-b px-3">
              <Search className="mr-2 size-4 shrink-0 opacity-50" />
              <CommandInput placeholder={searchPlaceholder} />
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

              <CommandGroup>
                {allowClear && (
                  <CommandItem
                    value={clearLabel}
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
                )}

                {options.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={option.searchValue ?? option.label}
                    onSelect={() => {
                      onChange(option.value)
                      setOpen(false)
                    }}
                    className="min-w-0"
                  >
                    <Check
                      className={cn(
                        "mr-2 size-4",
                        value === option.value ? "opacity-100" : "opacity-0",
                      )}
                    />

                    <span
                      className="min-w-0 flex-1 truncate"
                      title={option.label}
                    >
                      {option.label}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
}