import { FileDown } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { useExportCreditCardStatementPdf } from "@/features/reports/hooks/use-export-credit-card-statement-pdf"
import { getApiErrorMessage } from "@/utils/api-error"
import { downloadFile } from "@/utils/download-file"
import type { CreditCardStatement } from "@/features/credit-card-statements/credit-card-statement-types"
import { DropdownMenuItem } from "@/components/ui/dropdown-menu"

type ExportCreditCardStatementReportButtonProps = {
  statement: CreditCardStatement
  presentation?: "button" | "menu-item"
}

export function ExportCreditCardStatementReportButton({
  statement,
  presentation = "button",
}: ExportCreditCardStatementReportButtonProps) {
  const exportPdfMutation = useExportCreditCardStatementPdf()

  function handleExport() {
    exportPdfMutation.mutate(statement.id, {
      onSuccess: (blob) => {
        downloadFile(
          blob,
          `relatorio-fatura-${statement.dueDate}.pdf`,
        )

        toast.success(
          `Relatório da fatura "${statement.name}" exportado com sucesso.`,
        )
      },
      onError: (error) => {
        toast.error(
          getApiErrorMessage(
            error,
            "Não foi possível exportar o relatório da fatura.",
          ),
        )
      },
    })
  }

  const isDisabled =
    statement.status === "CANCELED" ||
    exportPdfMutation.isPending

  if (presentation === "menu-item") {
    return (
      <DropdownMenuItem
        disabled={isDisabled}
        onSelect={() => handleExport()}
      >
        <FileDown className="mr-2 size-4" />

        {exportPdfMutation.isPending
          ? "Gerando relatório..."
          : "Exportar relatório PDF"}
      </DropdownMenuItem>
    )
  }

  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      disabled={
        statement.status === "CANCELED" ||
        exportPdfMutation.isPending
      }
      onClick={handleExport}
    >
      <FileDown className="mr-2 size-4" />

      {exportPdfMutation.isPending
        ? "Gerando..."
        : "Relatório"}
    </Button>
  )
}