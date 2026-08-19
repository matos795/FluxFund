import {
  AlertTriangle,
  CheckCircle2,
  Download,
  FileText,
  Landmark,
  Trash2,
} from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

import { ConfirmActionDialog } from "@/components/layout/confirm-action-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { formatCurrency, formatDate } from "@/utils/formatters"
import { downloadFile } from "@/utils/download-file"
import {
  downloadBankStatementDocument,
} from "@/features/bank-statement-documents/bank-statement-document-api"
import type {
  BankStatementDocument,
  ClosingDossierAccountPreview,
  ClosingDossierDocumentIssue,
} from "../closing-dossier-types"
import { useDeleteBankStatementDocument } from "../hooks/use-bank-statement-document-mutations"
import { BankStatementUploadDialog } from "./bank-statement-upload-dialog"

type ClosingDossierAccountCardProps = {
  account: ClosingDossierAccountPreview
  periodStartDate: string
  periodEndDate: string
  canManageDocuments: boolean
  onDocumentsChanged: () => void
  showIssues?: boolean
  showMetrics?: boolean
}

const accountTypeLabels: Record<string, string> = {
  BANK: "Conta bancária",
  BANK_ACCOUNT: "Conta bancária",
  CASH: "Caixa físico",
  DIGITAL_WALLET: "Conta digital",
  OTHER: "Outra conta",
}

export function ClosingDossierAccountCard({
  account,
  periodStartDate,
  periodEndDate,
  canManageDocuments,
  onDocumentsChanged,
  showIssues = true,
  showMetrics = true,
}: ClosingDossierAccountCardProps) {
  const [documentToDelete, setDocumentToDelete] =
    useState<BankStatementDocument | null>(null)

  const deleteMutation = useDeleteBankStatementDocument()

  const totalIssues = account.paymentProofIssues.length + account.fiscalDocumentIssues.length

  const hasPendingBankStatement = account.requiresBankStatement && !account.hasBankStatement

  async function handleDownload(document: BankStatementDocument) {
    try {
      const blob = await downloadBankStatementDocument(document.id)
      downloadFile(blob, document.originalFilename)
    } catch {
      toast.error("Não foi possível baixar o extrato.")
    }
  }

  async function handleDelete() {
    if (!documentToDelete) {
      return
    }

    try {
      await deleteMutation.mutateAsync(documentToDelete.id)

      toast.success("Extrato removido com sucesso.")
      setDocumentToDelete(null)
      onDocumentsChanged()
    } catch {
      toast.error("Não foi possível remover o extrato.")
    }
  }

  return (
    <>
      <Card
        className={
          account.includedInDossier
            ? "overflow-hidden"
            : "overflow-hidden border-dashed opacity-75"
        }
      >
        <CardHeader className="border-b bg-muted/30">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-background p-3 shadow-sm">
                <Landmark className="size-5 text-muted-foreground" />
              </div>

              <div className="space-y-1">
                <CardTitle className="text-lg">{account.accountName}</CardTitle>

                <p className="text-sm text-muted-foreground">
                  {accountTypeLabels[account.accountType] ?? account.accountType}
                </p>

                {!account.includedInDossier && (
                  <p className="text-xs text-muted-foreground">
                    Sem movimentação: esta conta ficará fora do Dossiê atual.
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Badge variant={account.hasMovement ? "secondary" : "outline"}>
                {account.hasMovement
                  ? `${account.transactionCount} movimentações`
                  : "Sem movimento"}
              </Badge>

              <Badge
                variant={
                  !account.requiresBankStatement
                    ? "secondary"
                    : account.hasBankStatement
                      ? "default"
                      : "destructive"
                }
              >
                {!account.requiresBankStatement
                  ? "Extrato não exigido"
                  : account.hasBankStatement
                    ? "Extrato disponível"
                    : "Extrato pendente"}
              </Badge>

              {showIssues &&
                totalIssues > 0 && (
                  <Badge variant="destructive">
                    {totalIssues} pendência{totalIssues > 1 ? "s" : ""}
                  </Badge>
                )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-5 pt-5">
          {showMetrics && (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <Metric label="Receitas" value={formatCurrency(account.incomeTotal)} />
              <Metric label="Despesas" value={formatCurrency(account.expenseTotal)} />
              <Metric
                label="Transferências"
                value={formatCurrency(account.transferTotal)}
              />
              <Metric label="Transações" value={String(account.transactionCount)} />
            </div>
          )}

          <section className="rounded-xl border bg-muted/20 p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  {hasPendingBankStatement ? (
                    <AlertTriangle className="size-4 text-destructive" />
                  ) : (
                    <CheckCircle2 className="size-4 text-primary" />
                  )}

                  <h3 className="font-medium">
                    {account.requiresBankStatement
                      ? "Extrato bancário oficial"
                      : account.accountType === "CASH"
                        ? "Registro do caixa físico"
                        : "Extrato não exigido"}
                  </h3>
                </div>

                <p className="mt-1 text-sm text-muted-foreground">
                  {account.requiresBankStatement
                    ? "O PDF oficial será incluído antes das transações desta conta."
                    : account.accountType === "CASH"
                      ? "Para o caixa físico, o relatório de movimentações gerado pelo FluxFund funciona como registro do período."
                      : "Nenhum extrato é exigido porque a conta não possui movimentações incluídas neste período."}
                </p>
              </div>

              {canManageDocuments &&
                account.accountType !== "CASH" && (
                  <BankStatementUploadDialog
                    accountId={account.accountId}
                    accountName={account.accountName}
                    periodStartDate={periodStartDate}
                    periodEndDate={periodEndDate}
                    onUploaded={onDocumentsChanged}
                  />
                )}
            </div>

            {account.bankStatementDocuments.length === 0 ? (
              <div className="mt-4 rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                {account.requiresBankStatement
                  ? "Nenhum extrato PDF encontrado para este período."
                  : account.accountType === "CASH"
                    ? "Nenhum PDF externo é necessário para o caixa físico."
                    : "Nenhum PDF é obrigatório para esta conta no período selecionado."}
              </div>
            ) : (
              <div className="mt-4 space-y-2">
                {account.bankStatementDocuments.map((document) => (
                  <div
                    key={document.id}
                    className="flex flex-col gap-3 rounded-lg border bg-background p-3 md:flex-row md:items-center md:justify-between"
                  >
                    <div className="flex min-w-0 items-start gap-3">
                      <div className="rounded-lg bg-muted p-2">
                        <FileText className="size-4 text-muted-foreground" />
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {document.originalFilename}
                        </p>

                        <p className="mt-1 text-xs text-muted-foreground">
                          {formatDate(document.periodStartDate)} até{" "}
                          {formatDate(document.periodEndDate)}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownload(document)}
                      >
                        <Download className="mr-2 size-4" />
                        Baixar
                      </Button>

                      {canManageDocuments && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => setDocumentToDelete(document)}
                        >
                          <Trash2 className="mr-2 size-4" />
                          Remover
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {showIssues && (
            <div className="grid gap-4 xl:grid-cols-2">
              <ClosingDossierIssueList
                title="Comprovantes de pagamento"
                issues={account.paymentProofIssues}
                emptyMessage="Nenhuma despesa pendente de comprovante."
              />

              <ClosingDossierIssueList
                title="Documentos fiscais"
                issues={account.fiscalDocumentIssues}
                emptyMessage="Nenhuma despesa pendente de documento fiscal."
              />
            </div>
          )}
        </CardContent>
      </Card>

      <ConfirmActionDialog
        open={Boolean(documentToDelete)}
        onOpenChange={(open) => {
          if (!open) {
            setDocumentToDelete(null)
          }
        }}
        title="Remover extrato?"
        description={
          <>
            O arquivo{" "}
            <strong>
              {documentToDelete?.originalFilename ?? "selecionado"}
            </strong>{" "}
            será removido do Dossiê.
          </>
        }
        confirmLabel="Remover"
        pendingLabel="Removendo..."
        isPending={deleteMutation.isPending}
        isDestructive
        onConfirm={handleDelete}
      />
    </>
  )
}

function Metric({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div className="rounded-lg border bg-background p-3">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>

      <p className="mt-1 text-base font-semibold">{value}</p>
    </div>
  )
}

export function ClosingDossierIssueList({
  title,
  issues,
  emptyMessage,
}: {
  title: string
  issues: ClosingDossierDocumentIssue[]
  emptyMessage: string
}) {
  return (
    <section className="rounded-xl border p-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-medium">{title}</h3>

        <Badge variant={issues.length > 0 ? "destructive" : "secondary"}>
          {issues.length}
        </Badge>
      </div>

      {issues.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">{emptyMessage}</p>
      ) : (
        <details className="mt-3">
          <summary className="cursor-pointer text-sm font-medium text-primary">
            Ver transações pendentes
          </summary>

          <div className="mt-3 space-y-2">
            {issues.map((issue) => (
              <div
                key={`${issue.issueType}-${issue.transactionId}`}
                className="rounded-lg border bg-muted/30 p-3"
              >
                <p className="text-sm font-medium">
                  {issue.description ?? issue.rawDescription ?? "Sem descrição"}
                </p>

                <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                  <span>{formatDate(issue.settlementDate)}</span>
                  <span>{issue.categoryName ?? "Sem categoria"}</span>
                  <span>{formatCurrency(issue.amount)}</span>
                </div>

                {issue.fiscalDocumentNote && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Observação: {issue.fiscalDocumentNote}
                  </p>
                )}
              </div>
            ))}
          </div>
        </details>
      )}
    </section>
  )
}