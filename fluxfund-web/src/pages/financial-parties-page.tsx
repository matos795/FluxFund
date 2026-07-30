import { useState } from "react"

import { PageHeader } from "@/components/layout/page-header"
import { PagePagination } from "@/components/pagination/page-pagination"

import { FinancialPartyFilters } from "@/features/financial-parties/components/financial-party-filters"

import { FinancialPartiesTable } from "@/features/financial-parties/components/financial-parties-table"

import { FinancialPartiesTableSkeleton } from "@/features/financial-parties/components/financial-parties-table-skeleton"

import { useFinancialParties } from "@/features/financial-parties/hooks/use-financial-parties"

import type {
  FinancialPartyClassification,
  FinancialPartyRole,
  FinancialPartyType,
} from "@/features/financial-parties/financial-party-types"

const PAGE_SIZE = 10

export function FinancialPartiesPage() {
  const [page, setPage] =
    useState(0)

  const [search, setSearch] =
    useState("")

  const [
    partyType,
    setPartyType,
  ] = useState<
    FinancialPartyType | ""
  >("")

  const [
    classification,
    setClassification,
  ] = useState<
    FinancialPartyClassification | ""
  >("")

  const [
    role,
    setRole,
  ] = useState<
    FinancialPartyRole | ""
  >("")

  const [active, setActive] =
    useState(true)

  const financialPartiesQuery =
    useFinancialParties({
      page,
      size: PAGE_SIZE,

      search:
        search.trim() || undefined,

      partyType:
        partyType || undefined,

      classification:
        classification || undefined,

      role:
        role || undefined,

      active,
    })

  const financialParties =
    financialPartiesQuery.data
      ?.content ?? []

  function handleSearchChange(
    value: string,
  ) {
    setSearch(value)
    setPage(0)
  }

  function handlePartyTypeChange(
    value:
      | FinancialPartyType
      | "",
  ) {
    setPartyType(value)
    setPage(0)
  }

  function handleClassificationChange(
    value:
      | FinancialPartyClassification
      | "",
  ) {
    setClassification(value)
    setPage(0)
  }

  function handleRoleChange(
    value:
      | FinancialPartyRole
      | "",
  ) {
    setRole(value)
    setPage(0)
  }

  function handleActiveChange(
    value: boolean,
  ) {
    setActive(value)
    setPage(0)
  }

  function handleClearFilters() {
    setSearch("")
    setPartyType("")
    setClassification("")
    setRole("")
    setActive(true)
    setPage(0)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Contatos financeiros"
        description="Gerencie pessoas e empresas que trazem receitas, recebem pagamentos ou mantêm compromissos com a organização."
      />

      <FinancialPartyFilters
        search={search}
        partyType={partyType}
        classification={
          classification
        }
        role={role}
        active={active}
        onSearchChange={
          handleSearchChange
        }
        onPartyTypeChange={
          handlePartyTypeChange
        }
        onClassificationChange={
          handleClassificationChange
        }
        onRoleChange={
          handleRoleChange
        }
        onActiveChange={
          handleActiveChange
        }
        onClear={
          handleClearFilters
        }
      />

      {financialPartiesQuery.isLoading && (
        <FinancialPartiesTableSkeleton />
      )}

      {financialPartiesQuery.isFetching &&
        !financialPartiesQuery.isLoading && (
          <p className="text-xs text-muted-foreground">
            Atualizando contatos...
          </p>
        )}

      {financialPartiesQuery.isError && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          Não foi possível carregar os contatos financeiros.
        </div>
      )}

      {!financialPartiesQuery.isLoading &&
        !financialPartiesQuery.isError && (
          <div className="space-y-4">
            <FinancialPartiesTable
              financialParties={
                financialParties
              }
            />

            {financialPartiesQuery.data && (
              <PagePagination
                page={
                  financialPartiesQuery
                    .data.number
                }
                totalPages={
                  financialPartiesQuery
                    .data.totalPages
                }
                totalElements={
                  financialPartiesQuery
                    .data.totalElements
                }
                size={
                  financialPartiesQuery
                    .data.size
                }
                isFirst={
                  financialPartiesQuery
                    .data.first
                }
                isLast={
                  financialPartiesQuery
                    .data.last
                }
                onPageChange={
                  setPage
                }
              />
            )}
          </div>
        )}
    </div>
  )
}