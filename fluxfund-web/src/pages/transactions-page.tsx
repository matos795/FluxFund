import { Plus, Upload } from "lucide-react"

import { PageHeader } from "@/components/layout/page-header"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export function TransactionsPage() {
  return (
    <div>
      <PageHeader
        title="Transações"
        description="Acompanhe lançamentos financeiros, conciliações e movimentações oficiais."
      >
        <div className="flex gap-2">
          <Button variant="outline">
            <Upload className="mr-2 size-4" />
            Importar OFX
          </Button>

          <Button>
            <Plus className="mr-2 size-4" />
            Nova transação
          </Button>
        </div>
      </PageHeader>

      <Card>
        <CardHeader>
          <CardTitle>Lançamentos financeiros</CardTitle>
        </CardHeader>

        <CardContent>
          <div className="flex h-48 items-center justify-center rounded-lg border border-dashed">
            <p className="text-sm text-muted-foreground">
              Nenhuma transação cadastrada ainda.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}