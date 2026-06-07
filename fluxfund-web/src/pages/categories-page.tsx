import { PageHeader } from "@/components/layout/page-header"
import { PagePagination } from "@/components/pagination/page-pagination"
import { usePermissions } from "@/features/auth/hooks/use-permissions"
import { CategoriesTable } from "@/features/categories/components/categories-table"
import { CategoriesTableSkeleton } from "@/features/categories/components/categories-table-skeleton"
import { CreateCategoryDialog } from "@/features/categories/components/create-category-dialog"
import { useCategories } from "@/features/categories/hooks/use-categories"
import { useState } from "react"

const PAGE_SIZE = 10

export function CategoriesPage() {

  const { canFinanceWrite } = usePermissions()

  const [page, setPage] = useState(0)

  const { data, isLoading, isError, isFetching } = useCategories({
    page,
    size: PAGE_SIZE,
  })

  const categories = data?.content ?? []

  return (
    <div>
      <PageHeader
        title="Categorias"
        description="Organize receitas e despesas em um plano de contas hierárquico."
      >
        {canFinanceWrite && <CreateCategoryDialog />}
      </PageHeader>

      {isLoading && <CategoriesTableSkeleton />}

      {isFetching && !isLoading && (
        <p className="mb-3 text-xs text-muted-foreground">
          Atualizando dados...
        </p>
      )}

      {isError && (
        <p className="text-sm text-destructive">
          Não foi possível carregar as categorias.
        </p>
      )}

      {!isLoading && !isError && (
        <div className="space-y-4">
          <CategoriesTable categories={categories} />

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
        </div>
      )}
    </div>
  )
}