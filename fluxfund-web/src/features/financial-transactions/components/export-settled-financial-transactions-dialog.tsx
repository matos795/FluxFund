import { useState } from "react"
import { FileSpreadsheet } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogTrigger,
} from "@/components/ui/dialog"
import { downloadFile } from "@/utils/download-file"
import { useExportSettledFinancialTransactionsExcel } from "../hooks/use-export-settled-financial-transactions-excel"
import { AppDialogBody, AppDialogContent, AppDialogFooter, AppDialogHeader } from "@/components/layout/app-dialog"
import { getDateRangeForPreset, type DateRangeValue } from "@/components/filters/date-range-presets"
import { DateRangePresetFilter } from "@/components/filters/date-range-preset-filter"

export function ExportSettledFinancialTransactionsDialog() {
  const [open, setOpen] = useState(false)

  const [period, setPeriod] = useState<DateRangeValue>(() =>
    getDateRangeForPreset("current-month"),
  )

  const { startDate, endDate } = period

  const hasInvalidPeriod =
    !startDate ||
    !endDate ||
    startDate > endDate

  const exportSettledTransactionsMutation =
    useExportSettledFinancialTransactionsExcel()

  function handleExport() {
    if (hasInvalidPeriod) {
      toast.error("Informe um período válido para exportar o Excel.")
      return
    }

    exportSettledTransactionsMutation.mutate(
      {
        startDate,
        endDate,
      },
      {
        onSuccess: (blob) => {
          downloadFile(
            blob,
            `movimento-financeiro-${startDate}-${endDate}.xlsx`,
          )

          toast.success("Movimento financeiro exportado com sucesso.")
          setOpen(false)
        },
        onError: () => {
          toast.error("Não foi possível exportar o movimento financeiro.")
        },
      },
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <FileSpreadsheet className="mr-2 size-4" />
          Exportar Excel
        </Button>
      </DialogTrigger>

      <AppDialogContent size="sm">
        <AppDialogHeader
          icon={<FileSpreadsheet className="size-4 text-muted-foreground" />}
          title="Exportar movimento financeiro"
          description="Gere um Excel com contas recebidas, contas pagas, resumo e todas as transações baixadas no período."
        />

        <AppDialogBody className="space-y-4">
          <DateRangePresetFilter
            value={period}
            onChange={setPeriod}
            idPrefix="settled-transactions-export-period"
            label="Período da exportação"
            layout="compact"
            className="w-full"
          />
        </AppDialogBody>

        <AppDialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
          >
            Cancelar
          </Button>

          <Button
            type="button"
            onClick={handleExport}
            disabled={
              exportSettledTransactionsMutation.isPending ||
              hasInvalidPeriod
            }
          >
            {exportSettledTransactionsMutation.isPending
              ? "Exportando..."
              : "Exportar Excel"}
          </Button>
        </AppDialogFooter>
      </AppDialogContent>
    </Dialog>
  )
}