import {
  useMemo,
  useState,
} from "react"

import {
  AlertTriangle,
  ArrowDownToLine,
  ArrowLeft,
  ArrowUpFromLine,
  CheckCircle2,
  Clock3,
  TrendingUp,
} from "lucide-react"

import {
  Link,
} from "react-router-dom"

import {
  Badge,
} from "@/components/ui/badge"

import {
  Button,
} from "@/components/ui/button"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

import {
  Label,
} from "@/components/ui/label"

import {
  FinancialPartyCombobox,
} from "@/features/financial-parties/components/financial-party-combobox"

import {
  FundComboboxWithCreate,
} from "@/features/funds/components/fund-combobox-with-create"

import {
  useFinancialCommitmentMonthlyReport,
} from "@/features/reports/hooks/use-financial-commitment-monthly-report"

import type {
  FinancialCommitmentDirection,
} from "@/features/financial-commitments/financial-commitment-types"

import {
  financialCommitmentTypeLabels,
} from "@/features/financial-commitments/financial-commitment-labels"

import {
  formatCurrency,
  formatDate,
  formatReferenceMonth,
} from "@/utils/formatters"
import { MonthYearPickerPopover } from "@/components/filters/month-year-picker-popover"

type Props = {
  direction:
  FinancialCommitmentDirection
}

const statusContent = {
  NOT_DUE: {
    label:
      "Ainda não vencido",

    className:
      "border-blue-200 bg-blue-50 text-blue-800",
  },

  PENDING: {
    label:
      "Pendente",

    className:
      "border-red-200 bg-red-50 text-red-800",
  },

  PARTIAL: {
    label:
      "Parcial",

    className:
      "border-amber-200 bg-amber-50 text-amber-800",
  },

  FULFILLED: {
    label:
      "Cumprido",

    className:
      "border-emerald-200 bg-emerald-50 text-emerald-800",
  },

  EXCEEDED: {
    label:
      "Acima do previsto",

    className:
      "border-violet-200 bg-violet-50 text-violet-800",
  },
} as const

function getCurrentMonth() {
  const now =
    new Date()

  return [
    now.getFullYear(),

    String(
      now.getMonth() + 1,
    ).padStart(2, "0"),
  ].join("-")
}

export function FinancialCommitmentMonthlyReportPage({
  direction,
}: Props) {
  const receivable =
    direction ===
    "RECEIVABLE"

  const [
    referenceMonth,
    setReferenceMonth,
  ] = useState(
    getCurrentMonth(),
  )

  const [
    partyId,
    setPartyId,
  ] = useState("")

  const [
    designatedRecipientId,
    setDesignatedRecipientId,
  ] = useState("")

  const [
    fundId,
    setFundId,
  ] = useState("")

  const query =
    useFinancialCommitmentMonthlyReport({
      referenceMonth,
      direction,

      partyId:
        partyId ||
        undefined,

      designatedRecipientId:
        receivable &&
          designatedRecipientId
          ? designatedRecipientId
          : undefined,

      fundId:
        fundId ||
        undefined,
    })

  const report =
    query.data

  const completionRate =
    useMemo(() => {
      if (
        !report ||
        report.expectedTotal <= 0
      ) {
        return 0
      }

      return Math.min(
        (
          report.realizedTotal /
          report.expectedTotal
        ) * 100,

        100,
      )
    }, [report])

  const MainIcon =
    receivable
      ? ArrowDownToLine
      : ArrowUpFromLine

  return (
    <div className="space-y-6">
      <div>
        <Button
          asChild
          variant="ghost"
          className="-ml-3 mb-2"
        >
          <Link to="/reports">
            <ArrowLeft className="mr-2 size-4" />
            Voltar aos relatórios
          </Link>
        </Button>

        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
          <div className="flex gap-4">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
              <MainIcon className="size-6" />
            </div>

            <div>
              <h1 className="text-2xl font-semibold tracking-tight">
                {receivable
                  ? "Compromissos a receber"
                  : "Compromissos a pagar"}
              </h1>

              <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                {receivable
                  ? "Compare doações, clientes e contribuições previstas com os valores realmente recebidos."
                  : "Compare fornecedores, salários, serviços e reembolsos previstos com os valores realmente pagos."}
              </p>
            </div>
          </div>

          <Badge
            variant="outline"
            className="w-fit"
          >
            Competência{" "}
            {formatReferenceMonth(
              referenceMonth,
            )}
          </Badge>
        </div>
      </div>

      <Card>
        <CardContent className="grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-4">
          <div className="space-y-2">
            <Label>
              Competência
            </Label>

            <MonthYearPickerPopover
              value={referenceMonth}
              onChange={
                setReferenceMonth
              }
              placeholder="Selecionar competência"
            />
          </div>

          <div className="space-y-2">
            <Label>
              {receivable
                ? "Origem esperada"
                : "Recebedor esperado"}
            </Label>

            <FinancialPartyCombobox
              role={
                receivable
                  ? "INCOME_SOURCE"
                  : "PAYMENT_RECIPIENT"
              }
              value={
                partyId
              }
              allowClear
              onChange={
                setPartyId
              }
            />
          </div>

          {receivable ? (
            <div className="space-y-2">
              <Label>
                Destinatário indicado
              </Label>

              <FinancialPartyCombobox
                role="PAYMENT_RECIPIENT"
                value={
                  designatedRecipientId
                }
                allowClear
                onChange={
                  setDesignatedRecipientId
                }
              />
            </div>
          ) : (
            <div className="hidden xl:block" />
          )}

          <div className="space-y-2">
            <Label>
              Fundo
            </Label>

            <FundComboboxWithCreate
              value={
                fundId
              }
              allowClear
              onChange={
                setFundId
              }
            />
          </div>
        </CardContent>
      </Card>

      {query.isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({
            length: 4,
          }).map(
            (_, index) => (
              <div
                key={index}
                className="h-32 animate-pulse rounded-xl border bg-muted/30"
              />
            ),
          )}
        </div>
      ) : query.isError ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-5 text-sm text-destructive">
          Não foi possível carregar o relatório.
        </div>
      ) : report ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <SummaryCard
              label="Previsto"
              value={
                report.expectedTotal
              }
              icon={
                Clock3
              }
            />

            <SummaryCard
              label={
                receivable
                  ? "Recebido"
                  : "Pago"
              }
              value={
                report.realizedTotal
              }
              icon={
                CheckCircle2
              }
            />

            <SummaryCard
              label="Pendente"
              value={
                report.pendingTotal
              }
              icon={
                AlertTriangle
              }
            />

            <SummaryCard
              label="Acima do previsto"
              value={
                report.exceededTotal
              }
              icon={
                TrendingUp
              }
            />
          </div>

          <Card className="overflow-hidden">
            <CardHeader className="border-b bg-muted/20">
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                  <CardTitle className="text-base">
                    Progresso da competência
                  </CardTitle>

                  <p className="mt-1 text-sm text-muted-foreground">
                    {report.totalCommitments} compromisso(s) no período.
                  </p>
                </div>

                <strong className="text-xl">
                  {completionRate.toFixed(
                    1,
                  )}
                  %
                </strong>
              </div>

              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{
                    width:
                      `${completionRate}%`,
                  }}
                />
              </div>
            </CardHeader>

            <CardContent className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-5">
              <StatusCount
                label="Não vencidos"
                value={
                  report.notDueCount
                }
              />

              <StatusCount
                label="Pendentes"
                value={
                  report.pendingCount
                }
              />

              <StatusCount
                label="Parciais"
                value={
                  report.partialCount
                }
              />

              <StatusCount
                label="Cumpridos"
                value={
                  report.fulfilledCount
                }
              />

              <StatusCount
                label="Excedidos"
                value={
                  report.exceededCount
                }
              />
            </CardContent>
          </Card>

          {report.items.length === 0 ? (
            <div className="rounded-2xl border border-dashed p-10 text-center">
              <CheckCircle2 className="mx-auto size-10 text-muted-foreground" />

              <h2 className="mt-4 font-semibold">
                Nenhum compromisso nesta competência
              </h2>

              <p className="mt-2 text-sm text-muted-foreground">
                Ajuste os filtros ou cadastre um compromisso aplicável ao período.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {report.items.map(
                (item) => {
                  const status =
                    statusContent[
                    item.status
                    ]

                  return (
                    <Card
                      key={
                        `${item.commitment.id}-${item.referenceMonth}`
                      }
                    >
                      <CardContent className="space-y-5 p-5">
                        <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-start">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="font-semibold">
                                {
                                  item.commitment
                                    .party.name
                                }
                              </h3>

                              <Badge
                                variant="outline"
                                className={
                                  status.className
                                }
                              >
                                {
                                  status.label
                                }
                              </Badge>

                              {item.overdue && (
                                <Badge variant="destructive">
                                  Vencido
                                </Badge>
                              )}
                            </div>

                            <p className="mt-1 text-sm text-muted-foreground">
                              {
                                financialCommitmentTypeLabels[
                                item
                                  .commitment
                                  .commitmentType
                                ]
                              }
                              {" · "}
                              {
                                item.commitment
                                  .plannedFund
                                  .name
                              }
                            </p>
                          </div>

                          <div className="text-left lg:text-right">
                            <p className="text-xs text-muted-foreground">
                              Vencimento
                            </p>

                            <p className="font-medium">
                              {formatDate(
                                item.dueDate,
                              )}
                            </p>
                          </div>
                        </div>

                        {item.commitment
                          .designatedRecipient && (
                            <div className="rounded-lg border bg-muted/20 p-3 text-sm">
                              Destinado a{" "}
                              <strong>
                                {
                                  item.commitment
                                    .designatedRecipient
                                    .name
                                }
                              </strong>
                            </div>
                          )}

                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                          <AmountField
                            label="Previsto"
                            value={
                              item.expectedAmount
                            }
                          />

                          <AmountField
                            label={
                              receivable
                                ? "Recebido"
                                : "Pago"
                            }
                            value={
                              item.realizedAmount
                            }
                          />

                          <AmountField
                            label="Pendente"
                            value={
                              item.pendingAmount
                            }
                          />

                          <AmountField
                            label="Excedente"
                            value={
                              item.exceededAmount
                            }
                          />

                          <div>
                            <p className="text-xs text-muted-foreground">
                              Última realização
                            </p>

                            <p className="mt-1 font-medium">
                              {item.lastSettlementDate
                                ? formatDate(
                                  item.lastSettlementDate,
                                )
                                : "Nenhuma"}
                            </p>

                            <p className="mt-1 text-xs text-muted-foreground">
                              {item.allocationCount} alocação(ões)
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                },
              )}
            </div>
          )}
        </>
      ) : null}
    </div>
  )
}

function SummaryCard({
  label,
  value,
  icon: Icon,
}: {
  label: string
  value: number
  icon:
  typeof Clock3
}) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between gap-4 p-5">
        <div>
          <p className="text-sm text-muted-foreground">
            {label}
          </p>

          <p className="mt-1 text-2xl font-semibold">
            {formatCurrency(
              value,
            )}
          </p>
        </div>

        <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon className="size-5" />
        </div>
      </CardContent>
    </Card>
  )
}

function StatusCount({
  label,
  value,
}: {
  label: string
  value: number
}) {
  return (
    <div className="rounded-xl border bg-background p-3">
      <p className="text-2xl font-semibold">
        {value}
      </p>

      <p className="text-xs text-muted-foreground">
        {label}
      </p>
    </div>
  )
}

function AmountField({
  label,
  value,
}: {
  label: string
  value: number
}) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">
        {label}
      </p>

      <p className="mt-1 font-medium">
        {formatCurrency(
          value,
        )}
      </p>
    </div>
  )
}

export function FinancialCommitmentsReceivableReportPage() {
  return (
    <FinancialCommitmentMonthlyReportPage
      direction="RECEIVABLE"
    />
  )
}

export function FinancialCommitmentsPayableReportPage() {
  return (
    <FinancialCommitmentMonthlyReportPage
      direction="PAYABLE"
    />
  )
}