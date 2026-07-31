import {
  useState,
} from "react"

import {
  Info,
} from "lucide-react"

import {
  PageHeader,
} from "@/components/layout/page-header"

import {
  PagePagination,
} from "@/components/pagination/page-pagination"

import {
  usePermissions,
} from "@/features/auth/hooks/use-permissions"

import {
  CreateFinancialCommitmentDialog,
} from "@/features/financial-commitments/components/create-financial-commitment-dialog"

import {
  FinancialCommitmentFilters,
} from "@/features/financial-commitments/components/financial-commitment-filters"

import {
  FinancialCommitmentsTable,
} from "@/features/financial-commitments/components/financial-commitments-table"

import {
  getCommitmentTypesByDirection,
} from "@/features/financial-commitments/financial-commitment-labels"

import {
  useFinancialCommitments,
} from "@/features/financial-commitments/hooks/use-financial-commitments"

import type {
  FinancialCommitmentDirection,
  FinancialCommitmentRecurrence,
  FinancialCommitmentStatus,
  FinancialCommitmentType,
} from "@/features/financial-commitments/financial-commitment-types"

const PAGE_SIZE = 10

export function FinancialCommitmentsPage() {
  const {
    canFinanceWrite,
  } = usePermissions()

  const [page, setPage] =
    useState(0)

  const [search, setSearch] =
    useState("")

  const [
    direction,
    setDirection,
  ] = useState<
    | FinancialCommitmentDirection
    | ""
  >("")

  const [
    commitmentType,
    setCommitmentType,
  ] = useState<
    | FinancialCommitmentType
    | ""
  >("")

  const [
    recurrence,
    setRecurrence,
  ] = useState<
    | FinancialCommitmentRecurrence
    | ""
  >("")

  const [
    status,
    setStatus,
  ] = useState<
    | FinancialCommitmentStatus
    | ""
  >("ACTIVE")

  const [
    designatedRecipientId,
    setDesignatedRecipientId,
  ] = useState("")

  const query =
    useFinancialCommitments({
      page,
      size: PAGE_SIZE,

      search:
        search.trim() ||
        undefined,

      direction:
        direction ||
        undefined,

      commitmentType:
        commitmentType ||
        undefined,

      recurrence:
        recurrence ||
        undefined,

      status:
        status ||
        undefined,

      designatedRecipientId:
        designatedRecipientId ||
        undefined,
    })

  function handleSearchChange(
    value: string,
  ) {
    setSearch(value)
    setPage(0)
  }

  function handleDirectionChange(
    value:
      | FinancialCommitmentDirection
      | "",
  ) {
    setDirection(value)

    /*
     * Compromissos a pagar não possuem
     * destinatário adicional.
     */
    if (value === "PAYABLE") {
      setDesignatedRecipientId("")
    }

    /*
     * Remove um tipo incompatível com a
     * nova direção.
     */
    if (
      value &&
      commitmentType &&
      !getCommitmentTypesByDirection(
        value,
      ).includes(
        commitmentType,
      )
    ) {
      setCommitmentType("")
    }

    setPage(0)
  }

  function handleCommitmentTypeChange(
    value:
      | FinancialCommitmentType
      | "",
  ) {
    setCommitmentType(value)
    setPage(0)
  }

  function handleRecurrenceChange(
    value:
      | FinancialCommitmentRecurrence
      | "",
  ) {
    setRecurrence(value)
    setPage(0)
  }

  function handleStatusChange(
    value:
      | FinancialCommitmentStatus
      | "",
  ) {
    setStatus(value)
    setPage(0)
  }

  function handleDesignatedRecipientChange(
    value: string,
  ) {
    setDesignatedRecipientId(
      value,
    )

    setPage(0)
  }

  function handleClearFilters() {
    setSearch("")
    setDirection("")
    setCommitmentType("")
    setRecurrence("")
    setStatus("ACTIVE")
    setDesignatedRecipientId("")
    setPage(0)
  }

  const commitments =
    query.data?.content ?? []

  return (
    <div className="space-y-6">
      <PageHeader
        title="Compromissos financeiros"
        description="Gerencie valores previstos a receber e a pagar, incluindo contribuições destinadas a favorecidos."
      >
        {canFinanceWrite && (
          <CreateFinancialCommitmentDialog />
        )}
      </PageHeader>

      <div className="flex gap-3 rounded-xl border bg-muted/30 p-4 text-sm">
        <Info className="mt-0.5 size-4 shrink-0 text-muted-foreground" />

        <div className="space-y-1">
          <p className="font-medium">
            Um contato pode possuir vários compromissos.
          </p>

          <p className="text-muted-foreground">
            O mesmo doador pode contribuir para pessoas, fundos ou finalidades diferentes. O sistema bloqueia apenas compromissos equivalentes que se sobreponham no mesmo período.
          </p>
        </div>
      </div>

      <FinancialCommitmentFilters
        search={
          search
        }
        direction={
          direction
        }
        commitmentType={
          commitmentType
        }
        recurrence={
          recurrence
        }
        status={
          status
        }
        designatedRecipientId={
          designatedRecipientId
        }
        onSearchChange={
          handleSearchChange
        }
        onDirectionChange={
          handleDirectionChange
        }
        onCommitmentTypeChange={
          handleCommitmentTypeChange
        }
        onRecurrenceChange={
          handleRecurrenceChange
        }
        onStatusChange={
          handleStatusChange
        }
        onDesignatedRecipientIdChange={
          handleDesignatedRecipientChange
        }
        onClear={
          handleClearFilters
        }
      />

      {query.isFetching &&
        !query.isLoading && (
          <p className="text-xs text-muted-foreground">
            Atualizando compromissos...
          </p>
        )}

      {query.isError ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          Não foi possível carregar os compromissos financeiros.
        </div>
      ) : (
        <div className="space-y-4">
          <FinancialCommitmentsTable
            commitments={
              commitments
            }
            isLoading={
              query.isLoading
            }
          />

          {query.data && (
            <PagePagination
              page={
                query.data.number
              }
              totalPages={
                query.data
                  .totalPages
              }
              totalElements={
                query.data
                  .totalElements
              }
              size={
                query.data.size
              }
              isFirst={
                query.data.first
              }
              isLast={
                query.data.last
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