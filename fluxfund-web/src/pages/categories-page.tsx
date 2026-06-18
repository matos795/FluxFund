import { useState } from "react"

import { PageHeader } from "@/components/layout/page-header"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { usePermissions } from "@/features/auth/hooks/use-permissions"
import { CategoriesTableSkeleton } from "@/features/categories/components/categories-table-skeleton"
import { CreateCategoryDialog } from "@/features/categories/components/create-category-dialog"
import { useCategoryTree } from "@/features/categories/hooks/use-category-tree"
import type { CategoryType } from "@/features/categories/category-types"
import { CategoriesTreeTable } from "@/features/categories/components/categories-tree-table"

export function CategoriesPage() {
  const { canFinanceWrite } = usePermissions()

  const [selectedType, setSelectedType] = useState<CategoryType>("EXPENSE")

  const {
    data: categories = [],
    isLoading,
    isError,
    isFetching,
  } = useCategoryTree({
    type: selectedType,
    includeInactive: true,
  })

  return (
    <div className="space-y-6">
      <PageHeader
        title="Categorias"
        description="Organize receitas e despesas em um plano de contas hierárquico."
      >
        {canFinanceWrite && <CreateCategoryDialog />}
      </PageHeader>

      <Tabs
        value={selectedType}
        onValueChange={(value) => setSelectedType(value as CategoryType)}
        className="space-y-4"
      >
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="EXPENSE">Despesas</TabsTrigger>
          <TabsTrigger value="INCOME">Receitas</TabsTrigger>
        </TabsList>

        {isLoading && <CategoriesTableSkeleton />}

        {isFetching && !isLoading && (
          <p className="text-xs text-muted-foreground">
            Atualizando categorias...
          </p>
        )}

        {isError && (
          <p className="text-sm text-destructive">
            Não foi possível carregar as categorias.
          </p>
        )}

        {!isLoading && !isError && (
          <>
            <TabsContent value="EXPENSE" className="mt-0">
              <CategoriesTreeTable
                title="Categorias de despesa"
                description="Plano de contas usado para classificar saídas, pagamentos, tarifas e repasses."
                categories={categories}
              />
            </TabsContent>

            <TabsContent value="INCOME" className="mt-0">
              <CategoriesTreeTable
                title="Categorias de receita"
                description="Plano de contas usado para classificar entradas, ofertas, recebimentos e créditos."
                categories={categories}
              />
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  )
}