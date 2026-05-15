import { PageHeader } from "@/components/layout/page-header"
import { PagePagination } from "@/components/pagination/page-pagination"
import { BeneficiariesTable } from "@/features/beneficiaries/components/beneficiaries-table"
import { BeneficiariesTableSkeleton } from "@/features/beneficiaries/components/beneficiaries-table-skeleton"
import { CreateBeneficiaryDialog } from "@/features/beneficiaries/components/create-beneficiary-dialog"
import { useBeneficiaries } from "@/features/beneficiaries/hooks/use-beneficiaries"
import { useState } from "react"

const PAGE_SIZE = 10

export function BeneficiariesPage() {

  const [page, setPage] = useState(0)

  const { data, isLoading, isError, isFetching } = useBeneficiaries({
    page,
    size: PAGE_SIZE,
  })

  const beneficiaries = data?.content ?? []

  return (
    <div>
      <PageHeader
        title="Favorecidos"
        description="Gerencie favorecidos, destinatários e responsáveis financeiros."
      >
        <CreateBeneficiaryDialog />
      </PageHeader>

      {isLoading && <BeneficiariesTableSkeleton />}

      {isFetching && !isLoading && (
        <p className="mb-3 text-xs text-muted-foreground">
          Atualizando dados...
        </p>
      )}

      {isError && (
        <p className="text-sm text-destructive">
          Não foi possível carregar os favorecidos.
        </p>
      )}

      {!isLoading && !isError && (
        <div className="space-y-4">
          <BeneficiariesTable beneficiaries={beneficiaries} />

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