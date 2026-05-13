import { Plus } from "lucide-react"

import { PageHeader } from "@/components/layout/page-header"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export function FundsPage() {
  return (
    <div>
      <PageHeader
        title="Fundos"
        description="Controle destinações internas, projetos e centros de responsabilidade."
      >
        <Button>
          <Plus className="mr-2 size-4" />
          Novo fundo
        </Button>
      </PageHeader>

      <Card>
        <CardHeader>
          <CardTitle>Fundos cadastrados</CardTitle>
        </CardHeader>

        <CardContent>
          <div className="flex h-48 items-center justify-center rounded-lg border border-dashed">
            <p className="text-sm text-muted-foreground">
              Nenhum fundo cadastrado ainda.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}