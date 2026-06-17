import { useMemo, useState } from "react"

import { PageHeader } from "@/components/layout/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { usePermissions } from "@/features/auth/hooks/use-permissions"
import { CategoriesTable } from "@/features/categories/components/categories-table"
import { CategoriesTableSkeleton } from "@/features/categories/components/categories-table-skeleton"
import { CreateCategoryDialog } from "@/features/categories/components/create-category-dialog"
import { useCategories } from "@/features/categories/hooks/use-categories"
import type { CategoryType } from "@/features/categories/category-types"

const CATEGORY_LIST_SIZE = 500

export function CategoriesPage() {
  const { canFinanceWrite } = usePermissions()

  const [selectedType, setSelectedType] = useState<CategoryType>("EXPENSE")

  const { data, isLoading, isError, isFetching } = useCategories({
    page: 0,
    size: CATEGORY_LIST_SIZE,
  })

  const categories = useMemo(() => data?.content ?? [], [data?.content])

  const expenseCategories = useMemo(
    () => categories.filter((category) => category.type === "EXPENSE"),
    [categories],
  )

  const incomeCategories = useMemo(
    () => categories.filter((category) => category.type === "INCOME"),
    [categories],
  )

  const activeCategoriesCount = useMemo(
    () => categories.filter((category) => category.active).length,
    [categories],
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Categorias"
        description="Organize receitas e despesas em um plano de contas hierárquico."
      >
        {canFinanceWrite && <CreateCategoryDialog />}
      </PageHeader>

      {isLoading && <CategoriesTableSkeleton />}

      {isFetching && !isLoading && (
        <p className="text-xs text-muted-foreground">
          Atualizando dados...
        </p>
      )}

      {isError && (
        <p className="text-sm text-destructive">
          Não foi possível carregar as categorias.
        </p>
      )}

      {!isLoading && !isError && (
        <>
          <div className="grid gap-3 md:grid-cols-3">
            <SummaryCard
              label="Total de categorias"
              value={categories.length}
              description="Receitas e despesas cadastradas"
            />

            <SummaryCard
              label="Categorias ativas"
              value={activeCategoriesCount}
              description="Disponíveis para uso nas transações"
            />

            <SummaryCard
              label="Categorias inativas"
              value={categories.length - activeCategoriesCount}
              description="Mantidas apenas para histórico"
            />
          </div>

          <Tabs
            value={selectedType}
            onValueChange={(value) => setSelectedType(value as CategoryType)}
            className="space-y-4"
          >
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="EXPENSE" className="gap-2">
                Despesas
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                  {expenseCategories.length}
                </span>
              </TabsTrigger>

              <TabsTrigger value="INCOME" className="gap-2">
                Receitas
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                  {incomeCategories.length}
                </span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="EXPENSE" className="mt-0">
              <CategoriesTable
                title="Categorias de despesa"
                description="Categorias usadas para classificar saídas, pagamentos, tarifas e repasses."
                categories={expenseCategories}
              />
            </TabsContent>

            <TabsContent value="INCOME" className="mt-0">
              <CategoriesTable
                title="Categorias de receita"
                description="Categorias usadas para classificar entradas, recebimentos, ofertas e outros créditos."
                categories={incomeCategories}
              />
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  )
}

type SummaryCardProps = {
  label: string
  value: number
  description: string
}

function SummaryCard({ label, value, description }: SummaryCardProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-sm text-muted-foreground">{label}</p>
        <strong className="mt-1 block text-2xl">{value}</strong>
        <p className="mt-1 text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  )
}