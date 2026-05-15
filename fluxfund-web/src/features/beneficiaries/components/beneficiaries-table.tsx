
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { Beneficiary } from "../beneficiary-types"
import { beneficiaryTypeLabels } from "../beneficiary-labels"
import { BeneficiaryActions } from "./beneficiary-actions"

type BeneficiariesTableProps = {
  beneficiaries: Beneficiary[]
}

export function BeneficiariesTable({ beneficiaries }: BeneficiariesTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Favorecidos cadastrados</CardTitle>
      </CardHeader>

      <CardContent>
        {beneficiaries.length === 0 ? (
          <div className="flex h-48 items-center justify-center rounded-lg border border-dashed">
            <p className="text-sm text-muted-foreground">
              Nenhum favorecido cadastrado ainda.
            </p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Celular</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Documento</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[50px]" />
                </TableRow>
              </TableHeader>

              <TableBody>
                {beneficiaries.map((beneficiary) => (
                  <TableRow key={beneficiary.id}>
                    <TableCell className="font-medium">
                      {beneficiary.name}
                    </TableCell>

                    <TableCell>
                      {beneficiaryTypeLabels[beneficiary.type]}
                    </TableCell>

                    <TableCell>
                      {beneficiary.phone ?? "-"}
                    </TableCell>

                    <TableCell>
                      {beneficiary.email ?? "-"}
                    </TableCell>

                    <TableCell>
                      {beneficiary.document ?? "-"}
                    </TableCell>

                    <TableCell>
                      {beneficiary.active ? (
                        <Badge>Ativo</Badge>
                      ) : (
                        <Badge variant="secondary">Inativo</Badge>
                      )}
                    </TableCell>

                    <TableCell>
                      <BeneficiaryActions beneficiary={beneficiary} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}