import { Plus } from "lucide-react"

import { PageHeader } from "@/components/layout/page-header"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export function CategoriesPage() {
  return (
    <div>
      <PageHeader
        title="Categorias"
        description="Organize receitas e despesas em um plano de contas hierárquico."
      >
        <Button>
          <Plus className="mr-2 size-4" />
          Nova categoria
        </Button>
      </PageHeader>

      <Card>
        <CardHeader>
          <CardTitle>Plano de categorias</CardTitle>
        </CardHeader>

        <CardContent>
          <div className="flex h-48 items-center justify-center rounded-lg border border-dashed">
            <p className="text-sm text-muted-foreground">
              Nenhuma categoria cadastrada ainda.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}