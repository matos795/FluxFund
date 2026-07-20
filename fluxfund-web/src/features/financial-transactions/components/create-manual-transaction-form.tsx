import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, useForm, useWatch } from "react-hook-form"

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
import { Textarea } from "@/components/ui/textarea"

import {
  financialTransactionFormSchema,
  type FinancialTransactionFormData,
  type FinancialTransactionFormInput,
} from "@/features/financial-transactions/financial-transaction-schema"
import { financialTransactionTypeLabels } from "@/features/financial-transactions/financial-transaction-labels"

import { useEffect, useState } from "react"
import { useAccountOptions } from "@/features/accounts/hooks/use-account-options"
import { CurrencyInput } from "@/components/form/currency-input"
import { CategoryComboboxWithCreate } from "@/features/categories/components/category-combobox-with-create"
import { AccountComboboxWithCreate } from "@/features/accounts/components/account-combobox-with-create"
import { FiscalDocumentPolicyField } from "./fiscal-document-policy-field"
import type { TransferDirection } from "../financial-transaction-types"
import { useAccounts } from "@/features/accounts/hooks/use-accounts"
import { useDraftTransferMatchSuggestion } from "../hooks/use-draft-transfer-match-suggestion"
import { EntityCombobox } from "@/components/form/entity-combobox"
import { formatCurrency } from "@/utils/formatters"
import { toast } from "sonner"

export type CreateManualTransactionSubmission = {
  data: FinancialTransactionFormData
  transferDirection: TransferDirection | null
  transferCounterpartyAccountId: string | null
  matchingTransactionId: string | null
}

type CreateManualTransactionFormProps = {
  onSubmit: (submission: CreateManualTransactionSubmission,) => void
  isSubmitting?: boolean
  defaultValues?: Partial<FinancialTransactionFormInput>
  submitLabel?: string
  disableAccountField?: boolean
  showFiscalDocumentPolicy?: boolean
}

export function CreateManualTransactionForm({
  onSubmit,
  isSubmitting = false,
  defaultValues,
  submitLabel = "Salvar transação",
  disableAccountField,
  showFiscalDocumentPolicy = true,
}: CreateManualTransactionFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    reset,
    control,
    formState: { errors },
  } = useForm<
    FinancialTransactionFormInput,
    unknown,
    FinancialTransactionFormData
  >({
    resolver: zodResolver(financialTransactionFormSchema),
    defaultValues: {
      accountId: defaultValues?.accountId ?? "",
      type: defaultValues?.type ?? "EXPENSE",
      categoryId: defaultValues?.categoryId ?? "",
      dueDate:
        defaultValues?.dueDate ?? new Date().toISOString().slice(0, 10),
      settlementDate: defaultValues?.settlementDate ?? "",
      expectedAmount: defaultValues?.expectedAmount ?? 0,
      settledAmount:
        defaultValues?.settledAmount ??
        (defaultValues?.type === "TRANSFER"
          ? defaultValues?.expectedAmount ?? 0
          : undefined),
      description: defaultValues?.description ?? "",
      documentNumber: defaultValues?.documentNumber ?? "",
      fiscalDocumentPolicy: defaultValues?.fiscalDocumentPolicy ?? "CATEGORY",
      fiscalDocumentNote: defaultValues?.fiscalDocumentNote ?? "",
    },
  })

  useEffect(() => {
    if (!defaultValues) {
      return
    }

    reset({
      accountId: defaultValues.accountId ?? "",
      type: defaultValues.type ?? "EXPENSE",
      categoryId: defaultValues.categoryId ?? "",
      dueDate: defaultValues.dueDate ?? "",
      settlementDate: defaultValues.settlementDate ?? "",
      expectedAmount: defaultValues.expectedAmount ?? 0,
      settledAmount:
        defaultValues.settledAmount ??
        (defaultValues.type === "TRANSFER"
          ? defaultValues.expectedAmount ?? 0
          : undefined),
      description: defaultValues.description ?? "",
      documentNumber: defaultValues.documentNumber ?? "",
      fiscalDocumentPolicy: defaultValues.fiscalDocumentPolicy ?? "CATEGORY",
      fiscalDocumentNote: defaultValues.fiscalDocumentNote ?? "",
    })
  }, [defaultValues, reset])

  const selectedType = useWatch({ control, name: "type" })
  const selectedAccountId = useWatch({ control, name: "accountId" })
  const selectedCategoryId = useWatch({ control, name: "categoryId" })

  const fiscalDocumentPolicy = useWatch({
    control,
    name: "fiscalDocumentPolicy",
  })

  const fiscalDocumentNote = useWatch({
    control,
    name: "fiscalDocumentNote",
  })

  const selectedSettlementDate = useWatch({
    control,
    name: "settlementDate",
  })

  const selectedExpectedAmount = useWatch({
    control,
    name: "expectedAmount",
  })

  const [transferDirection, setTransferDirection] =
    useState<TransferDirection>("OUT")

  const [
    transferCounterpartyAccountId,
    setTransferCounterpartyAccountId,
  ] = useState("")

  // null: permite seleção automática; "": usuário recusou a sugestão automática.
  const [matchingTransactionId, setMatchingTransactionId] = useState<
    string | null
  >(null)

  const accountsQuery = useAccounts({
    page: 0,
    size: 200,
  })

  const transferCounterpartyAccountOptions =
    accountsQuery.data?.content
      .filter(
        (account) =>
          account.active &&
          account.type !== "CREDIT_CARD" &&
          account.id !== selectedAccountId,
      )
      .map((account) => ({
        value: account.id,

        label: account.bankName
          ? `${account.name} · ${account.bankName}`
          : account.name,
      })) ?? []

  const transferMatchQuery = useDraftTransferMatchSuggestion(
    {
      accountId: selectedAccountId,
      direction: transferDirection,
      transferDate: selectedSettlementDate ?? "",
      amount: Number(selectedExpectedAmount ?? 0),
    },
    {
      enabled:
        selectedType === "TRANSFER" &&
        Boolean(selectedAccountId) &&
        Boolean(selectedSettlementDate) &&
        Number(selectedExpectedAmount ?? 0) > 0,
    },
  )

  const transferCandidates = transferMatchQuery.data?.candidates ?? []

  const automaticTransferCandidate =
    transferCandidates.length === 1 ? transferCandidates[0] : undefined

  const manuallySelectedTransferCandidate = matchingTransactionId
    ? transferCandidates.find(
        (candidate) => candidate.transactionId === matchingTransactionId,
      )
    : undefined

  const selectedTransferCandidate =
    matchingTransactionId === ""
      ? undefined
      : manuallySelectedTransferCandidate ?? automaticTransferCandidate

  const currentMatchingTransactionId =
    selectedTransferCandidate?.transactionId ?? ""

  const currentTransferCounterpartyAccountId =
    selectedTransferCandidate?.account.id ?? transferCounterpartyAccountId

  const accountOptionsQuery = useAccountOptions()

  function handleManualSubmit(
    data: FinancialTransactionFormData,
  ) {
    if (data.type === "TRANSFER") {
      if (!transferDirection) {
        toast.error(
          "Selecione a direção da transferência.",
        )

        return
      }

      if (!currentTransferCounterpartyAccountId) {
        toast.error(
          "Selecione a conta contraparte.",
        )

        return
      }

      if (
        currentTransferCounterpartyAccountId ===
        data.accountId
      ) {
        toast.error(
          "A conta contraparte deve ser diferente da conta principal.",
        )

        return
      }

      if (!data.settlementDate) {
        toast.error(
          "Informe a data da transferência.",
        )

        return
      }
    }

    onSubmit({
      data,

      transferDirection:
        data.type === "TRANSFER"
          ? transferDirection
          : null,

      transferCounterpartyAccountId:
        data.type === "TRANSFER"
          ? currentTransferCounterpartyAccountId
          : null,

      matchingTransactionId:
        data.type === "TRANSFER"
          ? currentMatchingTransactionId || null
          : null,
    })
  }

  return (
    <form
      onSubmit={handleSubmit(handleManualSubmit)}
      className="space-y-4"
    >
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Conta</Label>
          <AccountComboboxWithCreate
            value={selectedAccountId}
            disabled={disableAccountField}
            allowClear={false}
            onChange={(value) => {
              setValue("accountId", value, {
                shouldValidate: true,
              })
              setTransferCounterpartyAccountId("")
              setMatchingTransactionId(null)
            }}
          />

          {errors.accountId && (
            <p className="text-sm text-destructive">
              {errors.accountId.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label>Tipo</Label>
          <Select
            value={selectedType}
            onValueChange={(value) => {
              const nextType = value as FinancialTransactionFormInput["type"]

              setValue("type", nextType, {
                shouldValidate: true,
              })

              setValue("categoryId", "", {
                shouldValidate: true,
              })

              setTransferCounterpartyAccountId("")
              setMatchingTransactionId(null)

              if (nextType === "TRANSFER") {
                setValue(
                  "settledAmount",
                  Number(selectedExpectedAmount ?? 0),
                  { shouldValidate: true },
                )
              }

              if (nextType !== "EXPENSE") {
                setValue("fiscalDocumentPolicy", "CATEGORY", {
                  shouldValidate: true,
                })

                setValue("fiscalDocumentNote", "", {
                  shouldValidate: true,
                })
              }
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione o tipo" />
            </SelectTrigger>

            <SelectContent>
              {Object.entries(financialTransactionTypeLabels).map(
                ([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ),
              )}
            </SelectContent>
          </Select>

          {errors.type && (
            <p className="text-sm text-destructive">{errors.type.message}</p>
          )}
        </div>
      </div>

      {selectedType === "TRANSFER" ? (
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Direção</Label>

            <Select
              value={transferDirection}
              onValueChange={(value) => {
                setTransferDirection(
                  value as TransferDirection,
                )

                setTransferCounterpartyAccountId("")
                setMatchingTransactionId(null)
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="OUT">
                  Saída para outra conta
                </SelectItem>

                <SelectItem value="IN">
                  Entrada de outra conta
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Conta contraparte</Label>

            <EntityCombobox
              value={currentTransferCounterpartyAccountId}
              options={
                transferCounterpartyAccountOptions
              }
              placeholder="Selecione a outra conta"
              searchPlaceholder="Buscar conta..."
              emptyMessage="Nenhuma conta encontrada."
              allowClear={false}
              onChange={(value) => {
                setTransferCounterpartyAccountId(
                  value,
                )

                // Conta escolhida manualmente: não vincula uma movimentação.
                setMatchingTransactionId("")
              }}
            />
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <Label>Categoria</Label>

          <CategoryComboboxWithCreate
            value={selectedCategoryId ?? ""}
            type={selectedType}
            placeholder="Selecione a categoria"
            searchPlaceholder="Buscar categoria..."
            emptyMessage="Nenhuma categoria encontrada."
            allowClear={false}
            disabled={false}
            onChange={(value) => {
              setValue("categoryId", value, {
                shouldValidate: true,
              })
            }}
          />

          {errors.categoryId && (
            <p className="text-sm text-destructive">
              {errors.categoryId.message}
            </p>
          )}
        </div>
      )}

      {selectedType === "TRANSFER" &&
        transferCandidates.length > 0 && (
          <div className="space-y-3 rounded-lg border border-blue-200 bg-blue-50 p-4">
            <div>
              <p className="font-medium text-blue-950">
                Possível movimentação correspondente
              </p>

              <p className="text-sm text-blue-800">
                Já existe uma movimentação de mesmo
                valor em outra conta. Ao selecioná-la,
                o sistema criará somente a ponta que
                está faltando.
              </p>
            </div>

            <EntityCombobox
              value={currentMatchingTransactionId}
              options={transferCandidates.map(
                (candidate) => ({
                  value:
                    candidate.transactionId,

                  label:
                    `${candidate.account.name} · ` +
                    `${formatCurrency(candidate.amount)} · ` +
                    `${candidate.settlementDate} · ` +
                    candidate.description,
                }),
              )}
              placeholder="Selecione a movimentação existente"
              searchPlaceholder="Buscar movimentação..."
              emptyMessage="Nenhuma candidata encontrada."
              allowClear
              onChange={(value) => {
                // Uma string vazia registra que o usuário recusou a sugestão.
                setMatchingTransactionId(value || "")
              }}
            />
          </div>
        )}

      {showFiscalDocumentPolicy && selectedType === "EXPENSE" && (
        <FiscalDocumentPolicyField
          value={fiscalDocumentPolicy ?? "CATEGORY"}
          note={fiscalDocumentNote ?? ""}
          policyError={errors.fiscalDocumentPolicy?.message}
          noteError={errors.fiscalDocumentNote?.message}
          onValueChange={(value) => {
            setValue("fiscalDocumentPolicy", value, {
              shouldValidate: true,
            })

            if (value === "CATEGORY" || value === "REQUIRED") {
              setValue("fiscalDocumentNote", "", {
                shouldValidate: true,
              })
            }
          }}
          onNoteChange={(value) =>
            setValue("fiscalDocumentNote", value, {
              shouldValidate: true,
            })
          }
        />
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="dueDate">Data de vencimento</Label>
          <Input id="dueDate" type="date" {...register("dueDate")} />
          {errors.dueDate && (
            <p className="text-sm text-destructive">
              {errors.dueDate.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="settlementDate">Data de baixa</Label>
          <Input
            id="settlementDate"
            type="date"
            {...register("settlementDate", {
              onChange: () => setMatchingTransactionId(null),
            })}
          />
          {errors.settlementDate && (
            <p className="text-sm text-destructive">
              {errors.settlementDate.message}
            </p>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="expectedAmount">Valor previsto</Label>
          <Controller
            name="expectedAmount"
            control={control}
            render={({ field }) => (
              <CurrencyInput
                id="expectedAmount"
                value={field.value as number | null | undefined}
                onValueChange={(value) => {
                  field.onChange(value)
                  setMatchingTransactionId(null)

                  if (selectedType === "TRANSFER") {
                    setValue("settledAmount", Number(value ?? 0), {
                      shouldValidate: true,
                    })
                  }
                }}
              />
            )}
          />
          {errors.expectedAmount && (
            <p className="text-sm text-destructive">
              {errors.expectedAmount.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="settledAmount">Valor baixado</Label>
          <Controller
            name="settledAmount"
            control={control}
            render={({ field }) => (
              <CurrencyInput
                id="settledAmount"
                value={field.value as number | null | undefined}
                allowEmpty
                onValueChange={field.onChange}
              />
            )}
          />
          {errors.settledAmount && (
            <p className="text-sm text-destructive">
              {errors.settledAmount.message}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Descrição interna</Label>
        <Textarea
          id="description"
          placeholder="Descrição opcional para uso interno..."
          {...register("description")}
        />
        {errors.description && (
          <p className="text-sm text-destructive">
            {errors.description.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="documentNumber">Número do documento</Label>
        <Input
          id="documentNumber"
          placeholder="Ex: NF-123, REC-456, DOC-789"
          {...register("documentNumber")}
        />
        {errors.documentNumber && (
          <p className="text-sm text-destructive">
            {errors.documentNumber.message}
          </p>
        )}
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button
          type="submit"
          disabled={
            isSubmitting ||
            accountOptionsQuery.isLoading ||
            accountsQuery.isLoading
          }
        >
          {isSubmitting ? "Salvando..." : submitLabel}
        </Button>
      </div>
    </form>
  )
}