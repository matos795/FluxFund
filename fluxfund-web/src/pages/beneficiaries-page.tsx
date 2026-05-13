import { Plus } from "lucide-react"

import { PageHeader } from "@/components/layout/page-header"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export function BeneficiariesPage() {
  return (
    <div>
      <PageHeader
        title="Favorecidos"
        description="Cadastre missionários, fornecedores, funcionários e responsáveis por projetos."
      >
        <Button>
          <Plus className="mr-2 size-4" />
          Novo favorecido
        </Button>
      </PageHeader>

      <Card>
        <CardHeader>
          <CardTitle>Favorecidos cadastrados</CardTitle>
        </CardHeader>

        <CardContent>
          <div className="flex h-48 items-center justify-center rounded-lg border border-dashed">
            <p className="text-sm text-muted-foreground">
              Nenhum favorecido cadastrado ainda.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}