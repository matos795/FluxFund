import { useState } from "react"
import { ShieldCheck } from "lucide-react"

import { PageHeader } from "@/components/layout/page-header"
import { PagePagination } from "@/components/pagination/page-pagination"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { usePermissions } from "@/features/auth/hooks/use-permissions"
import { useAuditLogs } from "@/features/audit-logs/hooks/use-audit-logs"
import {
  auditActionLabels,
  auditEntityTypeLabels,
} from "@/features/audit-logs/audit-log-labels"
import type {
  AuditAction,
  AuditEntityType,
} from "@/features/audit-logs/audit-log-types"

const PAGE_SIZE = 20

const auditActions: AuditAction[] = [
  "CREATE",
  "UPDATE",
  "CANCEL",
  "CLASSIFY",
  "ADD_ALLOCATION",
  "UPDATE_ALLOCATION",
  "REMOVE_ALLOCATION",
  "UPLOAD_ATTACHMENT",
  "DELETE_ATTACHMENT",
  "ACTIVATE",
  "DEACTIVATE",
  "CHANGE_DEFAULT_FUND",
  "IMPORT_OFX",
]

const entityTypes: AuditEntityType[] = [
  "FINANCIAL_TRANSACTION",
  "TRANSACTION_ALLOCATION",
  "ATTACHMENT",
  "SUPPORT_AGREEMENT",
  "ORGANIZATION_SETTINGS",
  "OFX_IMPORT",
  "FUND",
]

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value))
}

export function AuditLogReportPage() {
  const { canAdmin } = usePermissions()

  const [page, setPage] = useState(0)
  const [action, setAction] = useState<AuditAction | "ALL">("ALL")
  const [entityType, setEntityType] = useState<AuditEntityType | "ALL">("ALL")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")

  const { data, isLoading, isError, isFetching } = useAuditLogs({
    page,
    size: PAGE_SIZE,
    action: action === "ALL" ? undefined : action,
    entityType: entityType === "ALL" ? undefined : entityType,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
  })

  const logs = data?.content ?? []

  if (!canAdmin) {
    return (
      <div className="space-y-4">
        <PageHeader
          title="Auditoria"
          description="Histórico de ações críticas do sistema."
        />

        <Card>
          <CardContent className="py-8">
            <p className="text-sm text-muted-foreground">
              Você não tem permissão para acessar o relatório de auditoria.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Auditoria"
        description="Acompanhe quem criou, alterou, classificou, cancelou e anexou documentos no sistema."
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="size-5 text-muted-foreground" />
            Filtros da auditoria
          </CardTitle>
        </CardHeader>

        <CardContent className="grid gap-4 md:grid-cols-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Ação</label>
            <Select
              value={action}
              onValueChange={(value) => {
                setPage(0)
                setAction(value as AuditAction | "ALL")
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todas" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="ALL">Todas</SelectItem>
                {auditActions.map((item) => (
                  <SelectItem key={item} value={item}>
                    {auditActionLabels[item]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Entidade</label>
            <Select
              value={entityType}
              onValueChange={(value) => {
                setPage(0)
                setEntityType(value as AuditEntityType | "ALL")
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todas" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="ALL">Todas</SelectItem>
                {entityTypes.map((item) => (
                  <SelectItem key={item} value={item}>
                    {auditEntityTypeLabels[item]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Início</label>
            <Input
              type="date"
              value={startDate}
              onChange={(event) => {
                setPage(0)
                setStartDate(event.target.value)
              }}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Fim</label>
            <Input
              type="date"
              value={endDate}
              onChange={(event) => {
                setPage(0)
                setEndDate(event.target.value)
              }}
            />
          </div>
        </CardContent>
      </Card>

      {isFetching && !isLoading && (
        <p className="text-xs text-muted-foreground">
          Atualizando auditoria...
        </p>
      )}

      {isError && (
        <p className="text-sm text-destructive">
          Não foi possível carregar a auditoria.
        </p>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Histórico de ações</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">
              Carregando auditoria...
            </p>
          ) : logs.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhum registro de auditoria encontrado.
            </p>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Ação</TableHead>
                    <TableHead>Entidade</TableHead>
                    <TableHead>Descrição</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="whitespace-nowrap text-sm">
                        {formatDateTime(log.createdAt)}
                      </TableCell>

                      <TableCell>
                        <div className="space-y-1">
                          <p className="text-sm font-medium">
                            {log.actorName ?? "Usuário removido"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {log.actorEmail ?? log.actorUserId}
                          </p>
                        </div>
                      </TableCell>

                      <TableCell>
                        <Badge variant="secondary">
                          {auditActionLabels[log.action]}
                        </Badge>
                      </TableCell>

                      <TableCell>
                        <div className="space-y-1">
                          <p className="text-sm">
                            {auditEntityTypeLabels[log.entityType]}
                          </p>
                          <p className="max-w-48 truncate text-xs text-muted-foreground">
                            {log.entityId}
                          </p>
                        </div>
                      </TableCell>

                      <TableCell className="max-w-xl">
                        <p className="line-clamp-2 text-sm">
                          {log.description ?? "-"}
                        </p>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {data && (
            <PagePagination
              page={data.number}
              totalPages={data.totalPages}
              totalElements={data.totalElements}
              size={data.size}
              isFirst={data.first}
              isLast={data.last}
              onPageChange={setPage}
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}