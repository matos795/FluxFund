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

import { useEffect, useMemo, useState } from "react"
import { useAccountOptions } from "@/features/accounts/hooks/use-account-options"
import { CurrencyInput } from "@/components/form/currency-input"
import { CategoryComboboxWithCreate } from "@/features/categories/components/category-combobox-with-create"
import { AccountComboboxWithCreate } from "@/features/accounts/components/account-combobox-with-create"
import { FiscalDocumentPolicyField } from "./fiscal-document-policy-field"
import type { CreateTransactionAllocationRequest, TransferDirection } from "../financial-transaction-types"
import { useAccounts } from "@/features/accounts/hooks/use-accounts"
import { useDraftTransferMatchSuggestion } from "../hooks/use-draft-transfer-match-suggestion"
import { EntityCombobox } from "@/components/form/entity-combobox"
import { formatCents, formatCurrency, fromCents } from "@/utils/formatters"
import { toast } from "sonner"
import type { AttachmentType } from "@/features/attachments/attachment-types"
import { Paperclip, Plus, Trash2 } from "lucide-react"
import { FundComboboxWithCreate } from "@/features/funds/components/fund-combobox-with-create"
import { attachmentTypeLabels } from "@/features/attachments/attachment-labels"
import { getAttachmentAcceptAttribute, getAttachmentRulesDescription, validateAttachmentFile } from "@/features/attachments/attachment-validation"
import { FinancialPartyCombobox } from "@/features/financial-parties/components/financial-party-combobox"
import { FinancialCommitmentAllocationCard } from "@/features/financial-commitments/components/financial-commitment-allocation-card"
import type { FinancialCommitmentAllocationSuggestion } from "@/features/financial-commitments/financial-commitment-types"

type AllocationFormItem = {
  id: string
  fundId: string
  sourcePartyId: string
  recipientPartyId: string
  referenceMonth: string
  amount: string
  financialCommitmentId: string
}

type PendingManualAttachment = {
  id: string
  type: AttachmentType
  file: File | null
}

export type CreateManualTransactionSubmission = {
  data: FinancialTransactionFormData
  allocations: CreateTransactionAllocationRequest[]
  attachments: {
    type: AttachmentType
    file: File
  }[]
  transferDirection: TransferDirection | null
  transferCounterpartyAccountId: string | null
  matchingTransactionId: string | null
  allowUnmatchedCreation: boolean
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

  const selectedSettledAmount = useWatch({
    control,
    name: "settledAmount",
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

  const [allocations, setAllocations] =
    useState<AllocationFormItem[]>([])

  const [pendingAttachments, setPendingAttachments] =
    useState<PendingManualAttachment[]>([])

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

  const allocationBaseAmount =
    selectedSettlementDate
      ? fromCents(
        formatCents(
          Number(selectedSettledAmount ?? 0),
        ),
      )
      : 0

  const totalAllocated = useMemo(() => {
    const totalInCents = allocations.reduce(
      (total, allocation) =>
        total + formatCents(allocation.amount),
      0,
    )

    return fromCents(totalInCents)
  }, [allocations])

  const remainingAmount = fromCents(
    formatCents(allocationBaseAmount) -
    formatCents(totalAllocated),
  )

  function handleAddAllocation() {
    if (!selectedSettlementDate) {
      toast.error(
        "Informe a data de baixa antes de adicionar alocações.",
      )
      return
    }

    if (
      !selectedSettledAmount ||
      Number(selectedSettledAmount) <= 0
    ) {
      toast.error(
        "Informe o valor baixado antes de adicionar alocações.",
      )
      return
    }

    setAllocations((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        fundId: "",
        sourcePartyId: "",
        recipientPartyId: "",
        referenceMonth: selectedSettlementDate.slice(0, 7),
        amount: remainingAmount > 0 ? String(remainingAmount) : "",
        financialCommitmentId: "",
      },
    ])
  }

  function handleRemoveAllocation(id: string) {
    setAllocations((current) =>
      current.filter(
        (allocation) => allocation.id !== id,
      ),
    )
  }

  function handleChangeAllocation(
    id: string,

    field:
      keyof Omit<
        AllocationFormItem,
        "id"
      >,

    value: string,
  ) {
    const changesCommitmentContext =
      field ===
      "sourcePartyId" ||
      field ===
      "recipientPartyId" ||
      field ===
      "referenceMonth"

    setAllocations((current) =>
      current.map(
        (allocation) => {
          if (
            allocation.id !== id
          ) {
            return allocation
          }

          const contextChanged =
            changesCommitmentContext &&
            allocation[field] !==
            value

          return {
            ...allocation,

            [field]:
              value,

            financialCommitmentId:
              contextChanged
                ? ""
                : allocation
                  .financialCommitmentId,
          }
        },
      ),
    )
  }

  function handleSelectFinancialCommitment(
    allocationId: string,

    suggestion:
      FinancialCommitmentAllocationSuggestion,
  ) {
    setAllocations((current) =>
      current.map(
        (allocation) =>
          allocation.id ===
            allocationId
            ? {
              ...allocation,

              financialCommitmentId:
                suggestion
                  .commitment
                  .id,

              amount:
                String(
                  suggestion
                    .suggestedAmount,
                ),
            }
            : allocation,
      ),
    )
  }

  function handleClearFinancialCommitment(
    allocationId: string,
  ) {
    setAllocations((current) =>
      current.map(
        (allocation) =>
          allocation.id ===
            allocationId
            ? {
              ...allocation,

              financialCommitmentId:
                "",
            }
            : allocation,
      ),
    )
  }

  function getMaxAmountForAllocation(
    allocationId: string,
  ) {
    const otherAllocationsInCents =
      allocations.reduce(
        (
          total,
          allocation,
        ) => {
          if (
            allocation.id ===
            allocationId
          ) {
            return total
          }

          return (
            total +
            formatCents(
              allocation.amount,
            )
          )
        },
        0,
      )

    return Math.max(
      fromCents(
        formatCents(
          allocationBaseAmount,
        ) -
        otherAllocationsInCents,
      ),
      0,
    )
  }

  function handleAddAttachment() {
    setPendingAttachments((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        type: "PROOF_OF_PAYMENT",
        file: null,
      },
    ])
  }

  function handleRemoveAttachment(id: string) {
    setPendingAttachments((current) =>
      current.filter(
        (attachment) => attachment.id !== id,
      ),
    )
  }

  function handleChangeAttachmentType(
    id: string,
    type: AttachmentType,
  ) {
    setPendingAttachments((current) =>
      current.map((attachment) =>
        attachment.id === id
          ? {
            ...attachment,
            type,
          }
          : attachment,
      ),
    )
  }

  function handleChangeAttachmentFile(
    id: string,
    file: File | null,
  ) {
    if (file) {
      const validationError =
        validateAttachmentFile(file)

      if (validationError) {
        toast.error(validationError)
        return
      }
    }

    setPendingAttachments((current) =>
      current.map((attachment) =>
        attachment.id === id
          ? {
            ...attachment,
            file,
          }
          : attachment,
      ),
    )
  }

  function handleManualSubmit(
    data: FinancialTransactionFormData,
  ) {

    let allowUnmatchedCreation = false

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

      const hasCompatibleTransactionIgnored =
        transferCandidates.length > 0 &&
        !currentMatchingTransactionId

      if (hasCompatibleTransactionIgnored) {
        const confirmed = window.confirm(
          "Existe uma movimentação compatível em outra conta.\n\n" +
          "Continuar sem vinculá-la criará uma nova movimentação " +
          "e poderá duplicar o saldo.\n\n" +
          "Deseja criar a transferência mesmo assim?",
        )

        if (!confirmed) {
          return
        }

        allowUnmatchedCreation = true
      }
    }

    const validAllocations =
      data.type === "TRANSFER"
        ? []
        : allocations
          .filter(
            (allocation) =>
              allocation.fundId &&
              Number(allocation.amount || 0) > 0,
          )
          .map((allocation) => ({
            fundId: allocation.fundId,
            sourcePartyId: data.type === "INCOME" ? allocation.sourcePartyId || null : null,
            recipientPartyId: allocation.recipientPartyId || null,
            referenceMonth: allocation.referenceMonth ? `${allocation.referenceMonth}-01` : null,
            amount: Math.abs(Number(allocation.amount)),
            financialCommitmentId: allocation.financialCommitmentId || null,
          }))

    const hasIncompleteAllocation =
      data.type !== "TRANSFER" &&
      allocations.some(
        (allocation) =>
          Number(allocation.amount || 0) > 0 &&
          !allocation.fundId,
      )

    if (hasIncompleteAllocation) {
      toast.error(
        "Selecione um fundo para todas as alocações com valor.",
      )
      return
    }

    if (validAllocations.length > 0 &&
      (!data.settlementDate ||
        !data.settledAmount ||
        data.settledAmount <= 0)
    ) {
      toast.error(
        "Somente transações baixadas podem receber alocações.",
      )
      return
    }

    const allocatedTotal =
      validAllocations.reduce(
        (total, allocation) =>
          total + Math.abs(allocation.amount),
        0,
      )

    const settledAmount =
      Number(data.settledAmount ?? 0)

    if (allocatedTotal > settledAmount) {
      toast.error(
        "O valor alocado não pode ultrapassar o valor baixado.",
      )
      return
    }

    if (
      allocatedTotal > 0 &&
      allocatedTotal < settledAmount
    ) {
      const confirmed = window.confirm(
        "A transação ficará parcialmente alocada. O restante poderá ser alocado posteriormente. Deseja continuar?",
      )

      if (!confirmed) {
        return
      }
    }

    const hasIncompleteAttachment =
      pendingAttachments.some(
        (attachment) => !attachment.file,
      )

    if (hasIncompleteAttachment) {
      toast.error(
        "Selecione um arquivo em todos os anexos ou remova a linha vazia.",
      )
      return
    }

    const validAttachments =
      pendingAttachments.map((attachment) => ({
        type: attachment.type,
        file: attachment.file!,
      }))

    onSubmit({
      data,
      allocations: validAllocations,
      attachments: validAttachments,
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
      allowUnmatchedCreation
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

              setAllocations((current) =>
                current.map(
                  (allocation) => ({
                    ...allocation,

                    sourcePartyId:
                      nextType === "INCOME"
                        ? allocation
                          .sourcePartyId
                        : "",

                    /*
                     * Receita e despesa usam direções
                     * diferentes de compromisso.
                     */
                    financialCommitmentId:
                      "",
                  }),
                ),
              )

              setValue("categoryId", "", {
                shouldValidate: true,
              })

              setTransferCounterpartyAccountId("")
              setMatchingTransactionId(null)

              if (nextType === "TRANSFER") {
                setValue(
                  "settledAmount",
                  Number(selectedExpectedAmount ?? 0),
                  {
                    shouldValidate: true,
                  },
                )

                setAllocations([])

                setPendingAttachments((current) =>
                  current.map((attachment) => ({
                    ...attachment,
                    type: "PROOF_OF_PAYMENT",
                  })),
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

      {selectedType !== "TRANSFER" && (
        <div className="space-y-4 rounded-xl border p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-sm font-medium">
                Alocações
              </h3>

              <p className="text-xs text-muted-foreground">
                {selectedType === "INCOME"
                  ? "Identifique quem enviou o recurso e distribua o valor entre fundos e destinações."
                  : "Distribua o pagamento entre fundos e recebedores. Sem alocação manual, o sistema utiliza o fundo padrão da organização."}
              </p>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={
                !selectedSettlementDate ||
                allocationBaseAmount <= 0
              }
              onClick={handleAddAllocation}
            >
              <Plus className="mr-2 size-4" />
              Adicionar
            </Button>
          </div>

          {!selectedSettlementDate ? (
            <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
              Informe a data e o valor da baixa para
              adicionar alocações.
            </div>
          ) : allocations.length === 0 ? (
            <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
              Nenhuma alocação manual. O fundo padrão será utilizado quando aplicável.
              Para relacionar esta transação a um doador, favorecido ou compromisso financeiro, adicione uma alocação manual.
            </div>
          ) : (
            <div className="space-y-3">
              {allocations.map((allocation) => (
                <div
                  key={allocation.id}
                  className={
                    selectedType === "INCOME"
                      ? "grid gap-4 rounded-lg border bg-muted/20 p-4 md:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_160px_150px_auto]"
                      : "grid gap-4 rounded-lg border bg-muted/20 p-4 md:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_160px_150px_auto]"
                  }
                >

                  {selectedType === "INCOME" && (
                    <div className="space-y-2">
                      <Label>
                        Origem da receita
                      </Label>

                      <FinancialPartyCombobox
                        role="INCOME_SOURCE"
                        value={
                          allocation.sourcePartyId
                        }
                        allowClear
                        clearLabel="Sem origem identificada"
                        onChange={(value) =>
                          handleChangeAllocation(
                            allocation.id,
                            "sourcePartyId",
                            value,
                          )
                        }
                      />

                      <p className="text-xs text-muted-foreground">
                        Quem enviou este recurso.
                      </p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>Fundo</Label>

                    <FundComboboxWithCreate
                      value={allocation.fundId}
                      allowClear={false}
                      onChange={(value) =>
                        handleChangeAllocation(
                          allocation.id,
                          "fundId",
                          value,
                        )
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>
                      {selectedType === "INCOME"
                        ? "Destinatário / favorecido"
                        : "Recebedor do pagamento"}
                    </Label>

                    <FinancialPartyCombobox
                      role="PAYMENT_RECIPIENT"
                      value={
                        allocation.recipientPartyId
                      }
                      allowClear
                      placeholder={
                        selectedType === "INCOME"
                          ? "Sem destinação individual"
                          : "Sem recebedor identificado"
                      }
                      clearLabel={
                        selectedType === "INCOME"
                          ? "Sem destinação individual"
                          : "Sem recebedor identificado"
                      }
                      onChange={(value) =>
                        handleChangeAllocation(
                          allocation.id,
                          "recipientPartyId",
                          value,
                        )
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Competência</Label>

                    <Input
                      type="month"
                      value={allocation.referenceMonth}
                      onChange={(event) =>
                        handleChangeAllocation(
                          allocation.id,
                          "referenceMonth",
                          event.target.value,
                        )
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Valor</Label>

                    <CurrencyInput
                      value={Number(
                        allocation.amount || 0,
                      )}
                      onValueChange={(value) =>
                        handleChangeAllocation(
                          allocation.id,
                          "amount",
                          String(value ?? 0),
                        )
                      }
                    />
                  </div>

                  <div className="flex items-end">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        handleRemoveAllocation(
                          allocation.id,
                        )
                      }
                    >
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </div>

                  <div className="md:col-span-2 xl:col-span-full">
                    <FinancialCommitmentAllocationCard
                      transactionType={
                        selectedType ===
                          "INCOME"
                          ? "INCOME"
                          : "EXPENSE"
                      }
                      sourcePartyId={
                        allocation
                          .sourcePartyId
                      }
                      recipientPartyId={
                        allocation
                          .recipientPartyId
                      }
                      fundId={
                        allocation.fundId
                      }
                      referenceMonth={
                        allocation
                          .referenceMonth
                      }
                      currentAmount={
                        Math.abs(
                          Number(
                            allocation.amount ||
                            0,
                          ),
                        )
                      }
                      availableAmount={
                        Math.min(
                          Math.abs(
                            Number(
                              allocation.amount ||
                              0,
                            ),
                          ),

                          getMaxAmountForAllocation(
                            allocation.id,
                          ),
                        )
                      }
                      selectedCommitmentId={
                        allocation
                          .financialCommitmentId
                      }
                      currentCommitment={
                        null
                      }
                      onSelect={(
                        suggestion,
                      ) =>
                        handleSelectFinancialCommitment(
                          allocation.id,
                          suggestion,
                        )
                      }
                      onClear={() =>
                        handleClearFinancialCommitment(
                          allocation.id,
                        )
                      }
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex flex-col gap-1 border-t pt-3 text-sm sm:flex-row sm:items-center sm:justify-between">
            <span className="text-muted-foreground">
              Total alocado:{" "}
              {formatCurrency(totalAllocated)}
            </span>

            <span
              className={
                remainingAmount < 0
                  ? "font-medium text-destructive"
                  : "text-muted-foreground"
              }
            >
              Restante:{" "}
              {formatCurrency(remainingAmount)}
            </span>
          </div>
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

      <div className="space-y-3 rounded-xl border p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-2">
            <Paperclip className="mt-0.5 size-4 text-muted-foreground" />

            <div>
              <h3 className="text-sm font-medium">
                Anexos
              </h3>

              <p className="text-xs text-muted-foreground">
                Os arquivos serão enviados depois que a
                transação for criada.
              </p>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddAttachment}
          >
            <Plus className="mr-2 size-4" />
            Adicionar anexo
          </Button>
        </div>

        {pendingAttachments.length === 0 ? (
          <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
            Nenhum arquivo selecionado. A transação pode ser
            criada sem anexos.
          </div>
        ) : (
          <div className="space-y-3">
            {pendingAttachments.map((attachment) => (
              <div
                key={attachment.id}
                className="grid gap-3 rounded-lg border border-dashed p-3 md:grid-cols-[190px_minmax(0,1fr)_auto] md:items-end"
              >
                <div className="space-y-2">
                  <Label>Tipo</Label>

                  <Select
                    value={attachment.type}
                    onValueChange={(value) =>
                      handleChangeAttachmentType(
                        attachment.id,
                        value as AttachmentType,
                      )
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>

                    <SelectContent>
                      <SelectItem value="PROOF_OF_PAYMENT">
                        {
                          attachmentTypeLabels
                            .PROOF_OF_PAYMENT
                        }
                      </SelectItem>

                      {selectedType !== "TRANSFER" && (
                        <>
                          <SelectItem value="RECEIPT">
                            {attachmentTypeLabels.RECEIPT}
                          </SelectItem>

                          <SelectItem value="INVOICE">
                            {attachmentTypeLabels.INVOICE}
                          </SelectItem>

                          <SelectItem value="CONTRACT">
                            {attachmentTypeLabels.CONTRACT}
                          </SelectItem>
                        </>
                      )}

                      <SelectItem value="OTHER">
                        {attachmentTypeLabels.OTHER}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Arquivo</Label>

                  <Input
                    type="file"
                    accept={getAttachmentAcceptAttribute()}
                    onChange={(event) =>
                      handleChangeAttachmentFile(
                        attachment.id,
                        event.target.files?.[0] ??
                        null,
                      )
                    }
                  />

                  {attachment.file && (
                    <p className="text-xs text-muted-foreground">
                      {attachment.file.name}
                      {" · "}
                      {getAttachmentRulesDescription()}
                    </p>
                  )}
                </div>

                <div className="flex items-end">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      handleRemoveAttachment(
                        attachment.id,
                      )
                    }
                  >
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
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