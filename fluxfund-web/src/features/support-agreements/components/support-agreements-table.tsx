import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { SupportAgreement } from "../support-agreement-types"
import { SupportAgreementActions } from "./support-agreement-actions"

type SupportAgreementsTableProps = {
  agreements: SupportAgreement[]
  isLoading?: boolean
}

export function SupportAgreementsTable({
  agreements,
  isLoading = false,
}: SupportAgreementsTableProps) {
  if (isLoading) {
    return (
      <div className="p-6 text-sm text-muted-foreground">
        Carregando compromissos...
      </div>
    )
  }

  if (agreements.length === 0) {
    return (
      <div className="p-6 text-sm text-muted-foreground">
        Nenhum compromisso encontrado.
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Favorecido</TableHead>
          <TableHead>Fundo</TableHead>
          <TableHead>Valor mensal</TableHead>
          <TableHead>Vigência</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="w-[80px]" />
        </TableRow>
      </TableHeader>

      <TableBody>
        {agreements.map((agreement) => (
          <TableRow key={agreement.id}>
            <TableCell className="font-medium">
              {agreement.beneficiary.name}
            </TableCell>

            <TableCell>{agreement.fund.name}</TableCell>

            <TableCell>{formatCurrency(agreement.amount)}</TableCell>

            <TableCell className="text-muted-foreground">
              {formatDate(agreement.startDate)} até{" "}
              {agreement.endDate ? formatDate(agreement.endDate) : "sem fim"}
            </TableCell>

            <TableCell>
              <SupportAgreementStatusBadge status={agreement.status} />
            </TableCell>

            <TableCell>
              <SupportAgreementActions agreement={agreement} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

function SupportAgreementStatusBadge({
  status,
}: {
  status: SupportAgreement["status"]
}) {
  switch (status) {
    case "ACTIVE":
      return <Badge>Vigente</Badge>

    case "SCHEDULED":
      return <Badge variant="outline">Agendado</Badge>

    case "EXPIRED":
      return <Badge variant="secondary">Encerrado</Badge>

    case "INACTIVE":
      return (
        <Badge
          variant="secondary"
          className="text-muted-foreground"
        >
          Desativado
        </Badge>
      )
  }
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value)
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
  }).format(new Date(`${value}T00:00:00`))
}