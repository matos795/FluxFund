import {
  Search,
  X,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import {
  financialPartyClassificationLabels,
  financialPartyRoleLabels,
  financialPartyTypeLabels,
} from "../financial-party-labels"

import type {
  FinancialPartyClassification,
  FinancialPartyRole,
  FinancialPartyType,
} from "../financial-party-types"

type FinancialPartyFiltersProps = {
  search: string
  partyType: FinancialPartyType | ""
  classification:
    | FinancialPartyClassification
    | ""
  role: FinancialPartyRole | ""
  active: boolean

  onSearchChange: (value: string) => void

  onPartyTypeChange: (
    value: FinancialPartyType | "",
  ) => void

  onClassificationChange: (
    value:
      | FinancialPartyClassification
      | "",
  ) => void

  onRoleChange: (
    value: FinancialPartyRole | "",
  ) => void

  onActiveChange: (
    value: boolean,
  ) => void

  onClear: () => void
}

export function FinancialPartyFilters({
  search,
  partyType,
  classification,
  role,
  active,
  onSearchChange,
  onPartyTypeChange,
  onClassificationChange,
  onRoleChange,
  onActiveChange,
  onClear,
}: FinancialPartyFiltersProps) {
  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-[minmax(260px,2fr)_repeat(4,minmax(150px,1fr))_auto] xl:items-end">
        <div className="space-y-2">
          <Label htmlFor="financial-party-search">
            Buscar
          </Label>

          <div className="relative">
            <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />

            <Input
              id="financial-party-search"
              className="pl-9"
              placeholder="Nome, empresa, documento ou e-mail..."
              value={search}
              onChange={(event) =>
                onSearchChange(
                  event.target.value,
                )
              }
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Natureza</Label>

          <Select
            value={partyType || "ALL"}
            onValueChange={(value) =>
              onPartyTypeChange(
                value === "ALL"
                  ? ""
                  : value as FinancialPartyType,
              )
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Todas" />
            </SelectTrigger>

            <SelectContent>
              <SelectItem value="ALL">
                Todas
              </SelectItem>

              {Object.entries(
                financialPartyTypeLabels,
              ).map(([value, label]) => (
                <SelectItem
                  key={value}
                  value={value}
                >
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Classificação</Label>

          <Select
            value={
              classification || "ALL"
            }
            onValueChange={(value) =>
              onClassificationChange(
                value === "ALL"
                  ? ""
                  : value as FinancialPartyClassification,
              )
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Todas" />
            </SelectTrigger>

            <SelectContent>
              <SelectItem value="ALL">
                Todas
              </SelectItem>

              {Object.entries(
                financialPartyClassificationLabels,
              ).map(([value, label]) => (
                <SelectItem
                  key={value}
                  value={value}
                >
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Papel financeiro</Label>

          <Select
            value={role || "ALL"}
            onValueChange={(value) =>
              onRoleChange(
                value === "ALL"
                  ? ""
                  : value as FinancialPartyRole,
              )
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Todos" />
            </SelectTrigger>

            <SelectContent>
              <SelectItem value="ALL">
                Todos
              </SelectItem>

              {Object.entries(
                financialPartyRoleLabels,
              ).map(([value, label]) => (
                <SelectItem
                  key={value}
                  value={value}
                >
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Status</Label>

          <Select
            value={
              active
                ? "ACTIVE"
                : "INACTIVE"
            }
            onValueChange={(value) =>
              onActiveChange(
                value === "ACTIVE",
              )
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>

            <SelectContent>
              <SelectItem value="ACTIVE">
                Ativos
              </SelectItem>

              <SelectItem value="INACTIVE">
                Inativos
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={onClear}
        >
          <X className="mr-2 size-4" />
          Limpar
        </Button>
      </div>
    </div>
  )
}