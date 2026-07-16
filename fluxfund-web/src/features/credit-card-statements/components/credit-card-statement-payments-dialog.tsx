import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  History,
  Link2,
} from "lucide-react"
import { useState, type ReactNode } from "react"
import { toast } from "sonner"

import { EntityCombobox } from "@/components/form/entity-combobox"
import {
  AppDialogBody,
  AppDialogContent,
  AppDialogFooter,
  AppDialogHeader,
} from "@/components/layout/app-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { useAccounts } from "@/features/accounts/hooks/use-accounts"
import { getApiErrorMessage } from "@/utils/api-error"
import { formatCurrency, formatDate } from "@/utils/formatters"
import type {
  CreditCardStatement,
  CreditCardStatementPayment,
} from "../credit-card-statement-types"
import { useCreditCardPaymentLinkCandidates } from "../hooks/use-credit-card-payment-link-candidates"
import { useCreditCardStatementPayments } from "../hooks/use-credit-card-statement-payments"
import { useLinkCreditCardStatementPayment } from "../hooks/use-link-credit-card-statement-payment"
import { useMarkCreditCardPaymentAsOpeningBalance } from "../hooks/use-mark-credit-card-payment-as-opening-balance"
import { ConfirmActionDialog } from "@/components/layout/confirm-action-dialog"

type CreditCardStatementPaymentsDialogProps = {
  statement: CreditCardStatement
  canManage: boolean
  open?: boolean
  onOpenChange?: (open: boolean) => void
  trigger?: ReactNode | null
}

export function CreditCardStatementPaymentsDialog({
  statement,
  canManage,
  open,
  onOpenChange,
  trigger,
}: CreditCardStatementPaymentsDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const [activePaymentId, setActivePaymentId] = useState("")
  const [paymentAccountId, setPaymentAccountId] = useState("")
  const [paymentTransactionId, setPaymentTransactionId] = useState("")
  const [paymentToMarkAsOpeningBalance, setPaymentToMarkAsOpeningBalance] = useState<CreditCardStatementPayment | null>(null)

  const dialogOpen = open ?? internalOpen
  const setDialogOpen = onOpenChange ?? setInternalOpen

  const paymentsQuery = useCreditCardStatementPayments(
    statement.id,
    dialogOpen,
  )
  const accountsQuery = useAccounts({ page: 0, size: 200 })
  const linkMutation = useLinkCreditCardStatementPayment()

  const openingBalanceMutation = useMarkCreditCardPaymentAsOpeningBalance()

  const payments = paymentsQuery.data ?? []

  const openingBalancePayments = payments.filter(
    (payment) => payment.openingBalance,
  )

  const openingBalanceTotal = openingBalancePayments.reduce(
    (total, payment) => total + payment.amount,
    0,
  )

  const activePayment = payments.find(
    (payment) => payment.id === activePaymentId,
  )

  const paymentAccounts =
    accountsQuery.data?.content.filter(
      (account) => account.type !== "CREDIT_CARD",
    ) ?? []

  const candidatesQuery = useCreditCardPaymentLinkCandidates({
    payment: activePayment,
    paymentAccountId,
  })

  const candidates = candidatesQuery.data ?? []
  const bestCandidate = candidates[0]

  function resetLinkForm() {
    setActivePaymentId("")
    setPaymentAccountId("")
    setPaymentTransactionId("")
  }

  function handleOpenChange(value: boolean) {
    if (!value) {
      resetLinkForm()
    }

    setDialogOpen(value)
  }

  function startLink(payment: CreditCardStatementPayment) {
    setActivePaymentId(payment.id)
    setPaymentAccountId("")
    setPaymentTransactionId("")
  }

  function handleLink() {
    if (!activePayment) {
      return
    }

    if (!paymentAccountId || !paymentTransactionId) {
      toast.error("Selecione a conta e a saída bancária correspondente.")
      return
    }

    linkMutation.mutate(
      {
        statementId: statement.id,
        paymentId: activePayment.id,
        data: {
          paymentAccountId,
          paymentTransactionId,
        },
      },
      {
        onSuccess: () => {
          toast.success("Pagamento conciliado com a saída bancária.")
          resetLinkForm()
        },
        onError: (error) => {
          toast.error(
            getApiErrorMessage(
              error,
              "Não foi possível conciliar o pagamento.",
            ),
          )
        },
      },
    )
  }

  function handleMarkAsOpeningBalance() {
    if (!paymentToMarkAsOpeningBalance) {
      return
    }

    openingBalanceMutation.mutate(
      {
        statementId: statement.id,
        paymentId: paymentToMarkAsOpeningBalance.id,
      },
      {
        onSuccess: () => {
          toast.success(
            "Pagamento marcado como anterior ao início da operação.",
          )

          setPaymentToMarkAsOpeningBalance(null)
        },

        onError: (error) => {
          toast.error(
            getApiErrorMessage(
              error,
              "Não foi possível marcar o pagamento como histórico.",
            ),
          )
        },
      },
    )
  }

  return (
    <>
      <Dialog open={dialogOpen} onOpenChange={handleOpenChange}>
        {trigger === undefined ? (
          <DialogTrigger asChild>
            <Button size="sm" variant="outline">
              <History className="mr-2 size-4" />
              Ver pagamentos
            </Button>
          </DialogTrigger>
        ) : (
          trigger
        )}

        <AppDialogContent size="xl">
          <AppDialogHeader
            icon={<History className="size-4 text-muted-foreground" />}
            title={`Pagamentos · ${statement.name}`}
            description="Confira os pagamentos detectados na fatura e concilie cada um com a saída correspondente no extrato bancário."
          />

          <AppDialogBody className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border p-3">
                <p className="text-xs text-muted-foreground">Total da fatura</p>
                <p className="mt-1 font-semibold">
                  {formatCurrency(statement.totalAmount)}
                </p>
              </div>

              <div className="rounded-xl border p-3">
                <p className="text-xs text-muted-foreground">Já pago</p>
                <p className="mt-1 font-semibold">
                  {formatCurrency(statement.paidAmount)}
                </p>
              </div>

              <div className="rounded-xl border p-3">
                <p className="text-xs text-muted-foreground">Restante</p>
                <p className="mt-1 font-semibold">
                  {formatCurrency(statement.outstandingAmount)}
                </p>
              </div>
            </div>

            {openingBalancePayments.length > 0 && (
              <div className="rounded-xl border bg-muted/30 p-3 text-sm">
                <div className="flex items-center gap-2">
                  <CalendarClock className="size-4 text-muted-foreground" />

                  <p className="font-medium">
                    {openingBalancePayments.length === 1
                      ? "1 pagamento anterior ao início"
                      : `${openingBalancePayments.length} pagamentos anteriores ao início`}
                  </p>
                </div>

                <p className="mt-1 text-muted-foreground">
                  Total histórico: {formatCurrency(openingBalanceTotal)}. Esses
                  pagamentos não exigem conciliação com extratos anteriores.
                </p>
              </div>
            )}

            {paymentsQuery.isLoading && (
              <p className="text-sm text-muted-foreground">
                Carregando pagamentos...
              </p>
            )}

            {paymentsQuery.isError && (
              <div className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                Não foi possível carregar os pagamentos da fatura.
              </div>
            )}

            {!paymentsQuery.isLoading &&
              !paymentsQuery.isError &&
              payments.length === 0 && (
                <div className="rounded-xl border border-dashed p-6 text-center">
                  <p className="font-medium">Nenhum pagamento registrado.</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Pagamentos recebidos no OFX do cartão aparecerão aqui.
                  </p>
                </div>
              )}

            {payments.map((payment) => {
              const isActive = activePaymentId === payment.id
              const description = payment.description?.trim() || "Pagamento registrado manualmente"

              const paymentStatusLabel = payment.linked
                ? "Conciliado"
                : payment.openingBalance
                  ? "Anterior ao início"
                  : "Aguardando vínculo bancário"

              const paymentStatusVariant = payment.linked
                ? "default"
                : payment.openingBalance
                  ? "outline"
                  : "secondary"

              return (
                <div key={payment.id} className="rounded-xl border p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold">
                          {formatCurrency(payment.amount)}
                        </p>

                        <Badge variant={paymentStatusVariant}>
                          {paymentStatusLabel}
                        </Badge>
                      </div>

                      <p className="text-sm text-muted-foreground">
                        {description}
                      </p>

                      <p className="text-xs text-muted-foreground">
                        Data informada pela fatura: {formatDate(payment.paymentDate)}
                      </p>

                      {payment.linked && payment.paymentAccount && (
                        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <CheckCircle2 className="size-3.5 text-emerald-600" />
                          Saída conciliada em {payment.paymentAccount.name}
                        </p>
                      )}

                      {payment.openingBalance && (
                        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <CalendarClock className="size-3.5" />
                          Pagamento ocorrido antes do início do controle bancário no FluxFund.
                        </p>
                      )}


                    </div>

                    {!payment.linked &&
                      !payment.openingBalance &&
                      canManage &&
                      !isActive && (
                        <div className="flex flex-wrap gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              setPaymentToMarkAsOpeningBalance(payment)
                            }
                          >
                            <CalendarClock className="mr-2 size-4" />
                            Anterior ao início
                          </Button>

                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => startLink(payment)}
                          >
                            <Link2 className="mr-2 size-4" />
                            Vincular saída bancária
                          </Button>
                        </div>
                      )}
                  </div>

                  {isActive && (
                    <div className="mt-4 space-y-4 border-t pt-4">
                      <div className="rounded-lg bg-muted/40 p-3 text-sm text-muted-foreground">
                        Selecione a conta da qual o dinheiro saiu. O FluxFund
                        buscará transações OFX com o mesmo valor próximas à data
                        do pagamento.
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label>Conta que realizou o pagamento</Label>
                          <EntityCombobox
                            value={paymentAccountId}
                            options={paymentAccounts.map((account) => ({
                              value: account.id,
                              label: account.bankName
                                ? `${account.name} · ${account.bankName}`
                                : account.name,
                            }))}
                            placeholder="Selecione a conta pagadora"
                            searchPlaceholder="Buscar conta..."
                            emptyMessage="Nenhuma conta disponível."
                            allowClear={false}
                            onChange={(value) => {
                              setPaymentAccountId(value)
                              setPaymentTransactionId("")
                            }}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Saída bancária correspondente</Label>
                          <EntityCombobox
                            value={paymentTransactionId}
                            options={candidates.map(
                              ({ transaction, score }, index) => {
                                const transactionDescription =
                                  transaction.description?.trim() ||
                                  transaction.rawDescription?.trim() ||
                                  "Transação OFX"

                                return {
                                  value: transaction.id,
                                  label: `${index === 0 && score > 0 ? "Sugestão: " : ""
                                    }${transactionDescription} · ${formatCurrency(
                                      Math.abs(
                                        transaction.settledAmount ??
                                        transaction.expectedAmount ??
                                        0,
                                      ),
                                    )} · ${formatDate(transaction.settlementDate)}`,
                                }
                              },
                            )}
                            placeholder={
                              paymentAccountId
                                ? "Selecione a saída bancária"
                                : "Selecione primeiro a conta"
                            }
                            searchPlaceholder="Buscar transação..."
                            emptyMessage={
                              candidatesQuery.isFetching
                                ? "Buscando transações..."
                                : "Nenhuma saída OFX com esse valor foi encontrada."
                            }
                            allowClear
                            onChange={setPaymentTransactionId}
                          />
                        </div>
                      </div>

                      {bestCandidate && !paymentTransactionId && (
                        <div className="rounded-lg border bg-muted/30 p-3 text-sm">
                          <p className="font-medium">Sugestão encontrada</p>
                          <p className="text-muted-foreground">
                            {bestCandidate.transaction.description?.trim() ||
                              bestCandidate.transaction.rawDescription?.trim() ||
                              "Transação OFX"}
                            {" · "}
                            {formatDate(
                              bestCandidate.transaction.settlementDate,
                            )}
                          </p>

                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            className="mt-2"
                            onClick={() =>
                              setPaymentTransactionId(
                                bestCandidate.transaction.id,
                              )
                            }
                          >
                            Usar sugestão
                          </Button>
                        </div>
                      )}

                      {candidatesQuery.isError && (
                        <p className="text-sm text-destructive">
                          Não foi possível buscar as saídas bancárias candidatas.
                        </p>
                      )}

                      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                        <Button
                          type="button"
                          variant="outline"
                          disabled={linkMutation.isPending}
                          onClick={resetLinkForm}
                        >
                          Cancelar vínculo
                        </Button>

                        <Button
                          type="button"
                          disabled={
                            linkMutation.isPending ||
                            !paymentAccountId ||
                            !paymentTransactionId
                          }
                          onClick={handleLink}
                        >
                          {linkMutation.isPending
                            ? "Conciliando..."
                            : "Confirmar conciliação"}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </AppDialogBody>

          <AppDialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
            >
              Fechar
            </Button>
          </AppDialogFooter>
        </AppDialogContent>
      </Dialog>

      <ConfirmActionDialog
        open={Boolean(paymentToMarkAsOpeningBalance)}
        onOpenChange={(open) => {
          if (!open && !openingBalanceMutation.isPending) {
            setPaymentToMarkAsOpeningBalance(null)
          }
        }}
        title="Marcar como anterior ao início?"
        description={
          paymentToMarkAsOpeningBalance
            ? (
              <>
                O pagamento de{" "}
                <strong>
                  {formatCurrency(
                    paymentToMarkAsOpeningBalance.amount,
                  )}
                </strong>{" "}
                será aceito como histórico anterior ao início da operação.
                Ele reduzirá o saldo da fatura sem exigir uma saída bancária
                no FluxFund.
              </>
            )
            : ""
        }
        confirmLabel="Marcar como anterior"
        pendingLabel="Salvando..."
        isPending={openingBalanceMutation.isPending}
        icon={<CalendarClock className="size-5" />}
        onConfirm={handleMarkAsOpeningBalance}
      />
    </>
  )
}
