import {
  useState,
} from "react"

import {
  ArrowDownToLine,
  ArrowLeft,
  ArrowUpFromLine,
  HandHeart,
  Scale,
  TriangleAlert,
  type LucideIcon,
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
} from "@/components/ui/card"

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
  Switch,
} from "@/components/ui/switch"

import {
  FundComboboxWithCreate,
} from "@/features/funds/components/fund-combobox-with-create"

import {
  FinancialForecastChart,
} from "@/features/reports/components/financial-forecast-chart"

import {
  useFinancialForecastReport,
} from "@/features/reports/hooks/use-financial-forecast-report"

import {
  formatCurrency,
  formatReferenceMonth,
} from "@/utils/formatters"

function getNextMonth() {
  const date =
    new Date()

  date.setMonth(
    date.getMonth() + 1,
  )

  return [
    date.getFullYear(),

    String(
      date.getMonth() + 1,
    ).padStart(
      2,
      "0",
    ),
  ].join("-")
}

export function FinancialForecastReportPage() {
  const [
    startMonth,
    setStartMonth,
  ] = useState(
    getNextMonth(),
  )

  const [
    months,
    setMonths,
  ] = useState(
    6,
  )

  const [
    fundId,
    setFundId,
  ] = useState("")

  const [
    includeSupport,
    setIncludeSupport,
  ] = useState(
    true,
  )

  const query =
    useFinancialForecastReport({
      startMonth,
      months,

      fundId:
        fundId ||
        undefined,

      includeSupport,
    })

  const report =
    query.data

  const negativeForecast =
    report != null &&
    report.netTotal < 0

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
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Previsão financeira
            </h1>

            <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
              Projete entradas, pagamentos genéricos e compromissos de Sustento para os próximos meses.
            </p>
          </div>

          <Badge variant="outline">
            Planejamento futuro
          </Badge>
        </div>
      </div>

      <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-950">
        Esta previsão utiliza os valores brutos cadastrados nos compromissos. Ela mostra a variação planejada e não substitui o saldo bancário nem os relatórios de realizado.
      </div>

      <Card>
        <CardContent className="grid gap-5 p-5 md:grid-cols-2 xl:grid-cols-4">
          <div className="space-y-2">
            <Label>
              Mês inicial
            </Label>

            <Input
              type="month"
              value={
                startMonth
              }
              onChange={(event) =>
                setStartMonth(
                  event.target.value,
                )
              }
            />
          </div>

          <div className="space-y-2">
            <Label>
              Horizonte
            </Label>

            <Select
              value={
                String(
                  months,
                )
              }
              onValueChange={(
                value,
              ) =>
                setMonths(
                  Number(
                    value,
                  ),
                )
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>

              <SelectContent>
                {[3, 6, 12, 18, 24].map(
                  (value) => (
                    <SelectItem
                      key={
                        value
                      }
                      value={
                        String(
                          value,
                        )
                      }
                    >
                      {value} meses
                    </SelectItem>
                  ),
                )}
              </SelectContent>
            </Select>
          </div>

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

          <div className="flex items-center justify-between gap-4 rounded-xl border p-4">
            <div>
              <Label>
                Incluir Sustento
              </Label>

              <p className="mt-1 text-xs text-muted-foreground">
                Soma os compromissos missionários às saídas previstas.
              </p>
            </div>

            <Switch
              checked={
                includeSupport
              }
              onCheckedChange={
                setIncludeSupport
              }
            />
          </div>
        </CardContent>
      </Card>

      {query.isLoading ? (
        <div className="space-y-4">
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

          <div className="h-96 animate-pulse rounded-xl border bg-muted/30" />
        </div>
      ) : query.isError ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-5 text-sm text-destructive">
          Não foi possível carregar a previsão financeira.
        </div>
      ) : report ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <SummaryCard
              label="Entradas previstas"
              value={
                report.receivableTotal
              }
              icon={
                ArrowDownToLine
              }
            />

            <SummaryCard
              label="Saídas previstas"
              value={
                report.payableTotal
              }
              icon={
                ArrowUpFromLine
              }
            />

            <SummaryCard
              label="Sustento incluído"
              value={
                report.supportTotal
              }
              icon={
                HandHeart
              }
            />

            <SummaryCard
              label="Resultado projetado"
              value={
                report.netTotal
              }
              icon={
                Scale
              }
            />
          </div>

          <div
            className={
              negativeForecast
                ? "flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950"
                : "flex gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-950"
            }
          >
            <TriangleAlert className="mt-0.5 size-5 shrink-0" />

            <div>
              <p className="font-medium">
                {negativeForecast
                  ? "As saídas previstas superam as entradas."
                  : "As entradas previstas cobrem as saídas cadastradas."}
              </p>

              <p className="mt-1 text-xs opacity-80">
                Menor variação acumulada:{" "}
                <strong>
                  {formatCurrency(
                    report.lowestCumulativeNet,
                  )}
                </strong>

                {report.lowestCumulativeMonth
                  ? ` em ${formatReferenceMonth(
                      report.lowestCumulativeMonth,
                    )}`
                  : ""}
              </p>
            </div>
          </div>

          <FinancialForecastChart
            data={
              report.months
            }
          />

          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[980px] text-sm">
                  <thead className="border-b bg-muted/30 text-left">
                    <tr>
                      <th className="p-4 font-medium">
                        Mês
                      </th>

                      <th className="p-4 text-right font-medium">
                        A receber
                      </th>

                      <th className="p-4 text-right font-medium">
                        A pagar
                      </th>

                      <th className="p-4 text-right font-medium">
                        Sustento
                      </th>

                      <th className="p-4 text-right font-medium">
                        Saídas totais
                      </th>

                      <th className="p-4 text-right font-medium">
                        Resultado
                      </th>

                      <th className="p-4 text-right font-medium">
                        Acumulado
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {report.months.map(
                      (month) => (
                        <tr
                          key={
                            month.referenceMonth
                          }
                          className="border-b last:border-0"
                        >
                          <td className="p-4 font-medium">
                            {formatReferenceMonth(
                              month.referenceMonth,
                            )}
                          </td>

                          <td className="p-4 text-right">
                            {formatCurrency(
                              month.receivableAmount,
                            )}

                            <p className="text-xs text-muted-foreground">
                              {month.receivableCount} compromisso(s)
                            </p>
                          </td>

                          <td className="p-4 text-right">
                            {formatCurrency(
                              month.genericPayableAmount,
                            )}

                            <p className="text-xs text-muted-foreground">
                              {month.genericPayableCount} compromisso(s)
                            </p>
                          </td>

                          <td className="p-4 text-right">
                            {formatCurrency(
                              month.supportAmount,
                            )}

                            <p className="text-xs text-muted-foreground">
                              {month.supportCount} sustento(s)
                            </p>
                          </td>

                          <td className="p-4 text-right font-medium">
                            {formatCurrency(
                              month.payableAmount,
                            )}
                          </td>

                          <td className="p-4 text-right font-medium">
                            {formatCurrency(
                              month.netAmount,
                            )}
                          </td>

                          <td className="p-4 text-right font-semibold">
                            {formatCurrency(
                              month.cumulativeNetAmount,
                            )}
                          </td>
                        </tr>
                      ),
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
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
  icon: LucideIcon
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