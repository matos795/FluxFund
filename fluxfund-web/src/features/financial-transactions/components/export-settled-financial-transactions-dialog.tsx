import { useState } from "react"
import { FileSpreadsheet } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { downloadFile } from "@/utils/download-file"
import { useExportSettledFinancialTransactionsExcel } from "../hooks/use-export-settled-financial-transactions-excel"
import { AppDialogBody, AppDialogContent, AppDialogFooter, AppDialogHeader } from "@/components/layout/app-dialog"

function getTodayDateInputValue() {
  return new Date().toISOString().slice(0, 10)
}

function getFirstDayOfCurrentMonthInputValue() {
  const today = new Date()
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1)

  return firstDay.toISOString().slice(0, 10)
}

export function ExportSettledFinancialTransactionsDialog() {
  const [open, setOpen] = useState(false)
  const [startDate, setStartDate] = useState(getFirstDayOfCurrentMonthInputValue())
  const [endDate, setEndDate] = useState(getTodayDateInputValue())

  const exportSettledTransactionsMutation =
    useExportSettledFinancialTransactionsExcel()

  function handleExport() {
    exportSettledTransactionsMutation.mutate(
      {
        startDate,
        endDate,
      },
      {
        onSuccess: (blob) => {
          downloadFile(
            blob,
            `movimento-financeiro-${startDate || "inicio"}-${endDate || "fim"}.xlsx`,
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
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Data inicial</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Data final</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(event) => setEndDate(event.target.value)}
              />
            </div>
          </div>

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
            disabled={exportSettledTransactionsMutation.isPending}
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