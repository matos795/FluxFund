import { zodResolver } from "@hookform/resolvers/zod"
import { AlertTriangle, CheckCircle2, CreditCard } from "lucide-react"
import { useEffect, useMemo, useState, type ReactNode } from "react"
import { useForm, useWatch } from "react-hook-form"
import { toast } from "sonner"

import { EntityCombobox } from "@/components/form/entity-combobox"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAccounts } from "@/features/accounts/hooks/use-accounts"
import type { CreditCardStatement } from "../credit-card-statement-types"
import {
  payCreditCardStatementFormSchema,
  type PayCreditCardStatementFormData,
  type PayCreditCardStatementFormInput,
} from "../credit-card-statement-schema"
import { usePayCreditCardStatement } from "../hooks/use-pay-credit-card-statement"
import { useCreditCardPaymentCandidates } from "../hooks/use-credit-card-payment-candidates"
import { formatCurrency, formatDate } from "@/utils/formatters"
import { getCreditCardStatementItemsSummary } from "../credit-card-statement-items-summary"
import { useCreditCardStatementItems } from "../hooks/use-credit-card-statement-items"
import { AppDialogBody, AppDialogContent, AppDialogFooter, AppDialogHeader } from "@/components/layout/app-dialog"

type PayCreditCardStatementDialogProps = {
  statement: CreditCardStatement
  open?: boolean
  onOpenChange?: (open: boolean) => void
  trigger?: ReactNode | null
}

export function PayCreditCardStatementDialog({
  statement,
  open,
  onOpenChange,
  trigger,
}: PayCreditCardStatementDialogProps) {
  const [acknowledgePendingReview, setAcknowledgePendingReview] = useState(false)
  const [internalOpen, setInternalOpen] = useState(false)

  const dialogOpen = open ?? internalOpen
  const setDialogOpen = onOpenChange ?? setInternalOpen
  const payStatementMutation = usePayCreditCardStatement()
  const accountsQuery = useAccounts({ page: 0, size: 200 })

  const paymentAccounts =
    accountsQuery.data?.content.filter((account) => account.type !== "CREDIT_CARD") ?? []

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    control,
    formState: { errors },
  } = useForm<
    PayCreditCardStatementFormInput,
    unknown,
    PayCreditCardStatementFormData
  >({
    resolver: zodResolver(payCreditCardStatementFormSchema),
    defaultValues: {
      paymentAccountId: "",
      paymentDate: new Date().toISOString().slice(0, 10),
      paymentTransactionId: "",
    },
  })

  const selectedPaymentAccountId = useWatch({
    control,
    name: "paymentAccountId",
  })

  const itemsQuery = useCreditCardStatementItems(statement.id, dialogOpen)

  const statementItems = useMemo(() => {
    return itemsQuery.data ?? []
  }, [itemsQuery.data])

  const statementItemsSummary = useMemo(() => {
    return getCreditCardStatementItemsSummary(statementItems)
  }, [statementItems])

  const hasNoItems =
    !itemsQuery.isLoading && !itemsQuery.isError && statementItems.length === 0

  const hasReviewIssues = statementItemsSummary.hasReviewIssues

  const mustAcknowledgeReview =
    hasReviewIssues && !acknowledgePendingReview

  useEffect(() => {
    if (!selectedPaymentAccountId) {
      return
    }

    const selectedAccount = accountsQuery.data?.content.find(
      (account) => account.id === selectedPaymentAccountId,
    )

    if (selectedAccount?.type === "CREDIT_CARD") {
      setValue("paymentAccountId", "", {
        shouldValidate: true,
      })
    }
  }, [accountsQuery.data?.content, selectedPaymentAccountId, setValue])

  const paymentCandidatesQuery = useCreditCardPaymentCandidates({
    statement,
    paymentAccountId: selectedPaymentAccountId,
  })

  const paymentCandidates = paymentCandidatesQuery.data ?? []
  const bestCandidate = paymentCandidates[0]
  const selectedPaymentTransactionId = useWatch({
    control,
    name: "paymentTransactionId",
  })

  function handleOpenChange(value: boolean) {
    if (!value) {
      reset()
      setAcknowledgePendingReview(false)
    }

    setDialogOpen(value)
  }

  function handlePayStatement(data: PayCreditCardStatementFormData) {

    if (itemsQuery.isLoading) {
      toast.error("Aguarde a verificação dos itens da fatura.")
      return
    }

    if (hasNoItems) {
      toast.error("Não é possível pagar uma fatura sem itens.")
      return
    }

    if (hasReviewIssues && !acknowledgePendingReview) {
      toast.error("Confirme que deseja pagar a fatura mesmo com pendências.")
      return
    }

    payStatementMutation.mutate(
      {
        statementId: statement.id,
        data: {
          paymentAccountId: data.paymentAccountId,
          paymentDate: data.paymentDate,
          paymentTransactionId: data.paymentTransactionId || null,
        },
      },
      {
        onSuccess: () => {
          toast.success("Fatura marcada como paga.")
          handleOpenChange(false)
        },
        onError: () => {
          toast.error("Não foi possível marcar a fatura como paga.")
        },
      },
    )
  }

  const canPay = statement.status !== "PAID" && statement.status !== "CANCELED"

  const isPaymentDisabled =
    payStatementMutation.isPending ||
    itemsQuery.isLoading ||
    hasNoItems ||
    mustAcknowledgeReview

  return (
    <Dialog open={dialogOpen} onOpenChange={handleOpenChange}>
      {trigger === undefined ? (
        <DialogTrigger asChild>
          <Button size="sm" variant="outline" disabled={!canPay}>
            <CreditCard className="mr-2 size-4" />
            Pagar
          </Button>
        </DialogTrigger>
      ) : (
        trigger
      )}

      <AppDialogContent size="lg">
        <AppDialogHeader
          icon={<CreditCard className="size-4 text-muted-foreground" />}
          title="Pagar fatura"
          description="Informe a conta de pagamento e a data. Você pode vincular uma transação OFX existente para evitar duplicidade."
        />

        <form onSubmit={handleSubmit(handlePayStatement)} className="contents">
          <AppDialogBody className="space-y-4">
            <div className="space-y-2 rounded-lg border bg-muted/40 p-3 text-sm text-muted-foreground">
              <p>
                Depois disso, os itens do cartão continuam sendo as despesas reais. A saída bancária da fatura deve ser tratada como transferência/pagamento de cartão.
              </p>
            </div>

            <div className="space-y-2">
              <Label>Conta de pagamento</Label>
              <EntityCombobox
                value={selectedPaymentAccountId}
                options={paymentAccounts.map((account) => ({
                  value: account.id,
                  label: account.bankName
                    ? `${account.name} · ${account.bankName}`
                    : account.name,
                }))}
                placeholder="Selecione a conta que pagou a fatura"
                searchPlaceholder="Buscar conta..."
                emptyMessage="Nenhuma conta de pagamento encontrada."
                allowClear={false}
                onChange={(value) =>
                  setValue("paymentAccountId", value, {
                    shouldValidate: true,
                  })
                }
              />
              {errors.paymentAccountId && (
                <p className="text-sm text-destructive">
                  {errors.paymentAccountId.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="paymentDate">Data de pagamento</Label>
              <Input id="paymentDate" type="date" {...register("paymentDate")} />
              {errors.paymentDate && (
                <p className="text-sm text-destructive">
                  {errors.paymentDate.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Transação OFX do pagamento da fatura</Label>

              <EntityCombobox
                value={selectedPaymentTransactionId ?? ""}
                options={paymentCandidates.map(({ transaction, score }, index) => {
                  const amount = Math.abs(
                    transaction.settledAmount ?? transaction.expectedAmount ?? 0,
                  )

                  const description =
                    transaction.description?.trim() ||
                    transaction.rawDescription?.trim() ||
                    "Transação OFX"

                  const isBest = index === 0 && score > 0

                  return {
                    value: transaction.id,
                    label: `${isBest ? "Sugestão: " : ""}${description} · ${formatCurrency(amount)} · ${formatDate(transaction.settlementDate)}`,
                  }
                })}
                placeholder={
                  selectedPaymentAccountId
                    ? "Selecione a transação OFX do pagamento"
                    : "Selecione primeiro a conta de pagamento"
                }
                searchPlaceholder="Buscar transação..."
                emptyMessage={
                  paymentCandidatesQuery.isFetching
                    ? "Buscando transações..."
                    : "Nenhuma transação OFX candidata encontrada."
                }
                allowClear
                onChange={(value) => {
                  setValue("paymentTransactionId", value, {
                    shouldValidate: true,
                  })

                  const selectedCandidate = paymentCandidates.find(
                    ({ transaction }) => transaction.id === value,
                  )

                  if (selectedCandidate?.transaction.settlementDate) {
                    setValue("paymentDate", selectedCandidate.transaction.settlementDate, {
                      shouldValidate: true,
                    })
                  }
                }}
              />

              {bestCandidate && !selectedPaymentTransactionId && (
                <div className="rounded-lg border bg-muted/40 p-3 text-sm">
                  <p className="font-medium">Sugestão encontrada</p>
                  <p className="text-muted-foreground">
                    {bestCandidate.transaction.description?.trim() ||
                      bestCandidate.transaction.rawDescription?.trim() ||
                      "Transação OFX"}
                  </p>
                  <p className="text-muted-foreground">
                    Valor:{" "}
                    {formatCurrency(
                      Math.abs(
                        bestCandidate.transaction.settledAmount ??
                        bestCandidate.transaction.expectedAmount ??
                        0,
                      ),
                    )}{" "}
                    · Data: {formatDate(bestCandidate.transaction.settlementDate)}
                  </p>

                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    className="mt-2"
                    onClick={() => {
                      setValue("paymentTransactionId", bestCandidate.transaction.id, {
                        shouldValidate: true,
                      })

                      if (bestCandidate.transaction.settlementDate) {
                        setValue("paymentDate", bestCandidate.transaction.settlementDate, {
                          shouldValidate: true,
                        })
                      }
                    }}
                  >
                    Usar sugestão
                  </Button>
                </div>
              )}

              <p className="text-xs text-muted-foreground">
                Se você selecionar uma transação OFX, o backend deve vinculá-la à fatura e transformá-la em transferência para evitar duplicidade de despesa.
              </p>
            </div>

            <div className="space-y-3 rounded-lg border p-3">
              <div className="flex items-start gap-3">
                {itemsQuery.isLoading ? (
                  <AlertTriangle className="mt-0.5 size-4 text-muted-foreground" />
                ) : hasNoItems || hasReviewIssues ? (
                  <AlertTriangle className="mt-0.5 size-4 text-amber-600" />
                ) : (
                  <CheckCircle2 className="mt-0.5 size-4 text-emerald-600" />
                )}

                <div className="space-y-1">
                  <p className="text-sm font-medium">Conferência da fatura</p>

                  {itemsQuery.isLoading && (
                    <p className="text-sm text-muted-foreground">
                      Verificando itens da fatura...
                    </p>
                  )}

                  {itemsQuery.isError && (
                    <p className="text-sm text-destructive">
                      Não foi possível verificar os itens da fatura.
                    </p>
                  )}

                  {!itemsQuery.isLoading && !itemsQuery.isError && hasNoItems && (
                    <p className="text-sm text-amber-700">
                      Esta fatura não possui itens. Revise antes de marcar como paga.
                    </p>
                  )}

                  {!itemsQuery.isLoading &&
                    !itemsQuery.isError &&
                    !hasNoItems &&
                    !hasReviewIssues && (
                      <p className="text-sm text-muted-foreground">
                        Todos os itens estão classificados e alocados.
                      </p>
                    )}

                  {!itemsQuery.isLoading &&
                    !itemsQuery.isError &&
                    !hasNoItems &&
                    hasReviewIssues && (
                      <div className="space-y-1 text-sm text-amber-700">
                        <p>
                          Esta fatura ainda possui pendências de revisão:
                        </p>

                        {statementItemsSummary.unclassifiedCount > 0 && (
                          <p>
                            • {statementItemsSummary.unclassifiedCount} itens sem categoria (
                            {formatCurrency(statementItemsSummary.unclassifiedAmount)})
                          </p>
                        )}

                        {statementItemsSummary.unallocatedCount > 0 && (
                          <p>
                            • {statementItemsSummary.unallocatedCount} itens com alocação incompleta (
                            {formatCurrency(statementItemsSummary.unallocatedAmount)})
                          </p>
                        )}
                      </div>
                    )}
                </div>
              </div>

              {!itemsQuery.isLoading &&
                !itemsQuery.isError &&
                !hasNoItems &&
                hasReviewIssues && (
                  <label className="flex items-start gap-2 text-sm">
                    <input
                      type="checkbox"
                      className="mt-1"
                      checked={acknowledgePendingReview}
                      onChange={(event) =>
                        setAcknowledgePendingReview(event.target.checked)
                      }
                    />

                    <span>
                      Entendo que esta fatura ainda possui pendências e desejo marcar como paga mesmo assim.
                    </span>
                  </label>
                )}
            </div>

          </AppDialogBody>

          <AppDialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={payStatementMutation.isPending}
              onClick={() => handleOpenChange(false)}
            >
              Cancelar
            </Button>

            <Button type="submit" disabled={isPaymentDisabled}>
              {payStatementMutation.isPending ? "Pagando..." : "Pagar fatura"}
            </Button>
          </AppDialogFooter>
        </form>
      </AppDialogContent>
    </Dialog>
  )
}
