import {
  Search,
  X,
} from "lucide-react"

import {
  Button,
} from "@/components/ui/button"

import {
  Input,
} from "@/components/ui/input"

import {
  Label,
} from "@/components/ui/label"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import {
  FinancialPartyCombobox,
} from "@/features/financial-parties/components/financial-party-combobox"

import {
  financialCommitmentDirectionLabels,
  financialCommitmentRecurrenceLabels,
  financialCommitmentTypeLabels,
  getCommitmentTypesByDirection,
} from "../financial-commitment-labels"

import type {
  FinancialCommitmentDirection,
  FinancialCommitmentRecurrence,
  FinancialCommitmentType,
} from "../financial-commitment-types"
import { EntityCombobox } from "@/components/form/entity-combobox"

type FinancialCommitmentFiltersProps = {
  search: string

  direction:
  | FinancialCommitmentDirection
  | ""

  commitmentType:
  | FinancialCommitmentType
  | ""

  recurrence:
  | FinancialCommitmentRecurrence
  | ""

  designatedRecipientId:
  string

  onSearchChange: (
    value: string,
  ) => void

  onDirectionChange: (
    value:
      | FinancialCommitmentDirection
      | "",
  ) => void

  onCommitmentTypeChange: (
    value:
      | FinancialCommitmentType
      | "",
  ) => void

  onRecurrenceChange: (
    value:
      | FinancialCommitmentRecurrence
      | "",
  ) => void

  onDesignatedRecipientIdChange: (
    value: string,
  ) => void

  onClear: () => void
}

export function FinancialCommitmentFilters({
  search,
  direction,
  commitmentType,
  recurrence,
  designatedRecipientId,
  onSearchChange,
  onDirectionChange,
  onCommitmentTypeChange,
  onRecurrenceChange,
  onDesignatedRecipientIdChange,
  onClear,
}: FinancialCommitmentFiltersProps) {
  const commitmentTypes =
    direction
      ? getCommitmentTypesByDirection(
        direction,
      )
      : (
        Object.keys(
          financialCommitmentTypeLabels,
        ) as
        FinancialCommitmentType[]
      )

  const recipientFilterDisabled =
    direction === "PAYABLE"

  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm">
      <div className="grid min-w-0 gap-4 md:grid-cols-2 xl:grid-cols-[minmax(260px,2fr)_repeat(4,minmax(150px,1fr))_auto] xl:items-end">
        <div className="space-y-2">
          <Label htmlFor="financial-commitment-search">
            Buscar
          </Label>

          <div className="relative">
            <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />

            <Input
              id="financial-commitment-search"
              className="pl-9"
              placeholder="Contato, destinatário, fundo ou descrição..."
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
          <Label>
            Direção
          </Label>

          <Select
            value={
              direction || "ALL"
            }
            onValueChange={(value) =>
              onDirectionChange(
                value === "ALL"
                  ? ""
                  : value as
                  FinancialCommitmentDirection,
              )
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>

            <SelectContent>
              <SelectItem value="ALL">
                Todos
              </SelectItem>

              {Object.entries(
                financialCommitmentDirectionLabels,
              ).map(
                ([
                  value,
                  label,
                ]) => (
                  <SelectItem
                    key={value}
                    value={value}
                  >
                    {label}
                  </SelectItem>
                ),
              )}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>
            Tipo
          </Label>

          <EntityCombobox
            value={
              commitmentType
            }
            options={
              commitmentTypes.map(
                (type) => ({
                  value:
                    type,

                  label:
                    financialCommitmentTypeLabels[
                    type
                    ],
                }),
              )
            }
            placeholder="Todos os tipos"
            searchPlaceholder="Buscar tipo..."
            emptyMessage="Nenhum tipo encontrado."
            allowClear
            clearLabel="Todos os tipos"
            onChange={(
              value,
            ) =>
              onCommitmentTypeChange(
                value as
                | FinancialCommitmentType
                | "",
              )
            }
          />
        </div>

        <div className="space-y-2">
          <Label>
            Recorrência
          </Label>

          <Select
            value={
              recurrence || "ALL"
            }
            onValueChange={(value) =>
              onRecurrenceChange(
                value === "ALL"
                  ? ""
                  : value as
                  FinancialCommitmentRecurrence,
              )
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>

            <SelectContent>
              <SelectItem value="ALL">
                Todas
              </SelectItem>

              {Object.entries(
                financialCommitmentRecurrenceLabels,
              ).map(
                ([
                  value,
                  label,
                ]) => (
                  <SelectItem
                    key={value}
                    value={value}
                  >
                    {label}
                  </SelectItem>
                ),
              )}
            </SelectContent>
          </Select>
        </div>

        <div className="min-w-0 space-y-2">
          <Label>
            Destinatário
          </Label>

          <FinancialPartyCombobox
            role="PAYMENT_RECIPIENT"
            value={
              designatedRecipientId
            }
            allowClear
            allowCreate={false}
            disabled={
              recipientFilterDisabled
            }
            placeholder={
              recipientFilterDisabled
                ? "Somente para valores a receber"
                : "Todos os destinatários"
            }
            clearLabel="Todos os destinatários"
            onChange={
              onDesignatedRecipientIdChange
            }
          />
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