import { AlertTriangle, FileCheck2 } from "lucide-react"

import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import type { FiscalDocumentPolicy } from "../financial-transaction-types"
import {
  fiscalDocumentPolicyDescriptions,
  fiscalDocumentPolicyLabels,
  fiscalDocumentPolicyRequiresNote,
} from "../financial-transaction-labels"

type FiscalDocumentPolicyFieldProps = {
  value: FiscalDocumentPolicy
  note: string
  onValueChange: (value: FiscalDocumentPolicy) => void
  onNoteChange: (value: string) => void
  policyError?: string
  noteError?: string
  disabled?: boolean
}

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
    <div className="space-y-3 rounded-xl border p-4">
      <div className="flex items-start gap-3">
        <div className="rounded-lg bg-muted p-2">
          <FileCheck2 className="size-4 text-muted-foreground" />
        </div>

        <div>
          <h3 className="text-sm font-medium">Documento fiscal</h3>
          <p className="text-xs text-muted-foreground">
            Defina como esta transação deve ser tratada no dashboard de documentação.
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Regra desta transação</Label>

        <Select
          value={value}
          disabled={disabled}
          onValueChange={(nextValue) =>
            onValueChange(nextValue as FiscalDocumentPolicy)
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione a regra documental" />
          </SelectTrigger>

          <SelectContent>
            <SelectItem value="CATEGORY">
              {fiscalDocumentPolicyLabels.CATEGORY}
            </SelectItem>

            <SelectItem value="REQUIRED">
              {fiscalDocumentPolicyLabels.REQUIRED}
            </SelectItem>

            <SelectItem value="WAIVED">
              {fiscalDocumentPolicyLabels.WAIVED}
            </SelectItem>

            <SelectItem value="MISSING">
              {fiscalDocumentPolicyLabels.MISSING}
            </SelectItem>
          </SelectContent>
        </Select>

        {policyError && (
          <p className="text-sm text-destructive">{policyError}</p>
        )}
      </div>

      <div className="rounded-lg bg-muted/40 p-3 text-xs text-muted-foreground">
        {fiscalDocumentPolicyDescriptions[value]}
      </div>

      {requiresNote && (
        <div className="space-y-2">
          <Label>Motivo</Label>

          <Textarea
            value={note}
            disabled={disabled}
            maxLength={500}
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