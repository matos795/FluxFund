import { AlertTriangle, FileCheck2 } from "lucide-react"

import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import {
  fiscalDocumentPolicyDescriptions,
  fiscalDocumentPolicyLabels,
  fiscalDocumentPolicyRequiresNote,
} from "../financial-transaction-labels"
import type { FiscalDocumentPolicy } from "../financial-transaction-types"

type FiscalDocumentPolicyFieldProps = {
  value: FiscalDocumentPolicy
  note: string
  onValueChange: (value: FiscalDocumentPolicy) => void
  onNoteChange: (value: string) => void
  policyError?: string
  noteError?: string
  disabled?: boolean
}

const fiscalDocumentPolicyOptions: FiscalDocumentPolicy[] = [
  "CATEGORY",
  "REQUIRED",
  "WAIVED",
  "MISSING",
]

export function FiscalDocumentPolicyField({
  value,
  note,
  onValueChange,
  onNoteChange,
  policyError,
  noteError,
  disabled = false,
}: FiscalDocumentPolicyFieldProps) {
  const requiresNote = fiscalDocumentPolicyRequiresNote(value)

  return (
    <div className="space-y-4 rounded-xl border bg-muted/20 p-4">
      <div className="flex items-start gap-3">
        <div className="rounded-lg bg-background p-2 shadow-sm">
          <FileCheck2 className="size-4 text-muted-foreground" />
        </div>

        <div className="space-y-1">
          <h3 className="text-sm font-semibold">Documento fiscal</h3>
          <p className="text-xs text-muted-foreground">
            Defina como esta transação deve ser tratada no dashboard de documentação.
          </p>
        </div>
      </div>

      <RadioGroup
        value={value}
        disabled={disabled}
        onValueChange={(nextValue) =>
          onValueChange(nextValue as FiscalDocumentPolicy)
        }
        className="grid gap-2 md:grid-cols-2"
      >
        {fiscalDocumentPolicyOptions.map((option) => {
          const optionId = `fiscal-document-policy-${option}`
          const selected = value === option

          return (
            <Label
              key={option}
              htmlFor={optionId}
              className={cn(
                "flex cursor-pointer items-start gap-3 rounded-lg border bg-background p-3 text-sm transition-colors hover:bg-muted/50",
                selected && "border-primary bg-primary/5",
                disabled && "cursor-not-allowed opacity-60",
              )}
            >
              <RadioGroupItem
                id={optionId}
                value={option}
                className="mt-0.5"
              />

              <div className="space-y-1">
                <p className="font-medium leading-none">
                  {fiscalDocumentPolicyLabels[option]}
                </p>

                <p className="text-xs leading-relaxed text-muted-foreground">
                  {fiscalDocumentPolicyDescriptions[option]}
                </p>
              </div>
            </Label>
          )
        })}
      </RadioGroup>

      {policyError && (
        <p className="text-sm text-destructive">{policyError}</p>
      )}

      {requiresNote && (
        <div className="space-y-2 rounded-lg border bg-background p-3">
          <Label>Motivo</Label>

          <Textarea
            value={note}
            disabled={disabled}
            maxLength={500}
            className="min-h-24 resize-none"
            placeholder={
              value === "WAIVED"
                ? "Ex: Lançamento de cartão sem documento fiscal disponível."
                : "Ex: Fornecedor não enviou a nota fiscal."
            }
            onChange={(event) => onNoteChange(event.target.value)}
          />

          <div className="flex items-start gap-2 text-xs text-muted-foreground">
            <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
            <p>
              Informe um motivo claro para manter o histórico financeiro auditável.
            </p>
          </div>

          {noteError && (
            <p className="text-sm text-destructive">{noteError}</p>
          )}
        </div>
      )}
    </div>
  )
}