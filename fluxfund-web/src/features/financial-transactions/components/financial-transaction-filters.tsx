import { Filter, Search, X } from "lucide-react"
import { useState } from "react"

import { EntityCombobox } from "@/components/form/entity-combobox"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type FinancialTransactionFiltersProps = {
  type: string
  status: string
  description: string
  settlementDateFrom: string
  settlementDateTo: string
  accountId: string
  categoryId: string
  accounts: {
    id: string
    name: string
  }[]
  categories: {
    id: string
    name: string
  }[]
  source: string
  onlyUnclassified: boolean
  onlyUnallocated: boolean
  onSourceChange: (value: string) => void
  onOnlyUnclassifiedChange: (value: boolean) => void
  onOnlyUnallocatedChange: (value: boolean) => void
  onAccountIdChange: (value: string) => void
  onCategoryIdChange: (value: string) => void
  onTypeChange: (value: string) => void
  onStatusChange: (value: string) => void
  onDescriptionChange: (value: string) => void
  onSettlementDateFromChange: (value: string) => void
  onSettlementDateToChange: (value: string) => void
  onClear: () => void
}

export function FinancialTransactionFilters({
  type,
  status,
  description,
  settlementDateFrom,
  settlementDateTo,
  accountId,
  categoryId,
  accounts,
  categories,
  source,
  onlyUnclassified,
  onlyUnallocated,
  onOnlyUnclassifiedChange,
  onOnlyUnallocatedChange,
  onSourceChange,
  onAccountIdChange,
  onCategoryIdChange,
  onTypeChange,
  onStatusChange,
  onDescriptionChange,
  onSettlementDateFromChange,
  onSettlementDateToChange,
  onClear,
}: FinancialTransactionFiltersProps) {
  const [advancedOpen, setAdvancedOpen] = useState(false)

  const hasAdvancedFilters =
    settlementDateFrom || settlementDateTo || accountId || categoryId || source

  return (
    <div className="rounded-xl border bg-card p-3 shadow-sm">
      <div className="grid gap-3 lg:grid-cols-[minmax(260px,2fr)_80px_80px_auto_auto_auto] lg:items-end">
        <div className="space-y-2">
          <Label>Buscar</Label>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Descrição, documento ou texto do banco..."
              value={description}
              onChange={(event) => onDescriptionChange(event.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Tipo</Label>
          <Select
            value={type || "ALL"}
            onValueChange={(value) => onTypeChange(value === "ALL" ? "" : value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Todos" />
            </SelectTrigger>

            <SelectContent>
              <SelectItem value="ALL">Todos</SelectItem>
              <SelectItem value="INCOME">Receita</SelectItem>
              <SelectItem value="EXPENSE">Despesa</SelectItem>
              <SelectItem value="TRANSFER">Transferência</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Status</Label>
          <Select
            value={status || "ALL"}
            onValueChange={(value) => onStatusChange(value === "ALL" ? "" : value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Todos" />
            </SelectTrigger>

            <SelectContent>
              <SelectItem value="ALL">Todos</SelectItem>
              <SelectItem value="PENDING">Pendente</SelectItem>
              <SelectItem value="SETTLED">Baixada</SelectItem>
              <SelectItem value="CANCELED">Cancelada</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <label className="flex h-10 cursor-pointer items-center gap-2 rounded-md border px-3 text-sm">
          <Checkbox
            checked={onlyUnclassified}
            onCheckedChange={(checked) =>
              onOnlyUnclassifiedChange(Boolean(checked))
            }
          />
          Sem categoria
        </label>

        <label className="flex h-10 cursor-pointer items-center gap-2 rounded-md border px-3 text-sm">
          <Checkbox
            checked={onlyUnallocated}
            onCheckedChange={(checked) =>
              onOnlyUnallocatedChange(Boolean(checked))
            }
          />
          Sem alocação
        </label>

        <div className="flex gap-2">
          <Button
            type="button"
            variant={advancedOpen || hasAdvancedFilters ? "default" : "outline"}
            onClick={() => setAdvancedOpen((current) => !current)}
          >
            <Filter className="mr-2 size-4" />
            Avançados
          </Button>

          <Button type="button" variant="outline" onClick={onClear}>
            <X className="mr-2 size-4" />
            Limpar
          </Button>
        </div>
      </div>

      {advancedOpen && (
        <div className="mt-4 grid gap-3 border-t pt-4 md:grid-cols-2 lg:grid-cols-5">
          <div className="space-y-2">
            <Label>Data inicial</Label>
            <Input
              type="date"
              value={settlementDateFrom}
              onChange={(event) =>
                onSettlementDateFromChange(event.target.value)
              }
            />
          </div>

          <div className="space-y-2">
            <Label>Data final</Label>
            <Input
              type="date"
              value={settlementDateTo}
              onChange={(event) => onSettlementDateToChange(event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Conta</Label>
            <EntityCombobox
              value={accountId}
              placeholder="Todas as contas"
              searchPlaceholder="Buscar conta..."
              emptyMessage="Nenhuma conta encontrada."
              options={accounts.map((account) => ({
                value: account.id,
                label: account.name,
              }))}
              onChange={onAccountIdChange}
            />
          </div>

          <div className="space-y-2">
            <Label>Categoria</Label>
            <EntityCombobox
              value={categoryId}
              placeholder="Todas as categorias"
              searchPlaceholder="Buscar categoria..."
              emptyMessage="Nenhuma categoria encontrada."
              options={categories.map((category) => ({
                value: category.id,
                label: category.name,
              }))}
              onChange={onCategoryIdChange}
            />
          </div>

          <div className="space-y-2">
            <Label>Origem</Label>
            <Select
              value={source || "ALL"}
              onValueChange={(value) =>
                onSourceChange(value === "ALL" ? "" : value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Todas" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="ALL">Todas</SelectItem>
                <SelectItem value="MANUAL">Manual</SelectItem>
                <SelectItem value="OFX">OFX</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}
    </div>
  )
}