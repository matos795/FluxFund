/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from "react"
import type { CategoryResultGroup } from "../reports-types"
import { formatCurrency } from "@/utils/formatters"
import { ChevronDown, ChevronRight } from "lucide-react"

type CategoryResultStatementProps = {
  title: string
  total: number
  groups: CategoryResultGroup[]
}

export function CategoryResultStatement({
  title,
  total,
  groups,
}: CategoryResultStatementProps) {

  const [expandedGroups, setExpandedGroups] = useState<string[]>(() =>
    groups.map((group) => group.groupId),
  )

  useEffect(() => {
    setExpandedGroups(groups.map((group) => group.groupId))
  }, [groups])

  function toggleGroup(groupId: string) {
    setExpandedGroups((currentGroups) => {
      if (currentGroups.includes(groupId)) {
        return currentGroups.filter((currentGroupId) => currentGroupId !== groupId)
      }

      return [...currentGroups, groupId]
    })
  }

  function expandAllGroups() {
    setExpandedGroups(groups.map((group) => group.groupId))
  }

  function collapseAllGroups() {
    setExpandedGroups([])
  }

  return (
    <section className="rounded-xl border bg-card">
      <header className="flex flex-col gap-3 border-b px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold">{title}</h2>
          <p className="text-xs text-muted-foreground">
            {groups.length} grupos encontrados
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={expandAllGroups}
            className="rounded-md border px-3 py-1.5 text-xs font-medium transition hover:bg-muted"
          >
            Expandir tudo
          </button>

          <button
            type="button"
            onClick={collapseAllGroups}
            className="rounded-md border px-3 py-1.5 text-xs font-medium transition hover:bg-muted"
          >
            Recolher tudo
          </button>

          <strong className="ml-0 text-base sm:ml-2">
            {formatCurrency(total)}
          </strong>
        </div>
      </header>

      <div className="divide-y">
        {groups.length === 0 ? (
          <div className="px-5 py-6 text-sm text-muted-foreground">
            Nenhum valor encontrado.
          </div>
        ) : (
          groups.map((group) => (
            <div key={group.groupId} className="px-5 py-4">
              <button
                type="button"
                onClick={() => toggleGroup(group.groupId)}
                className="flex w-full items-center justify-between gap-4 text-left"
              >
                <div className="flex items-center gap-3">
                  {expandedGroups.includes(group.groupId) ? (
                    <ChevronDown className="size-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="size-4 text-muted-foreground" />
                  )}

                  <div>
                    <p className="font-medium">{group.groupName}</p>
                    <p className="text-xs text-muted-foreground">
                      {group.transactionCount} transações
                    </p>
                  </div>
                </div>

                <strong>{formatCurrency(group.total)}</strong>
              </button>

              {expandedGroups.includes(group.groupId) && (
                <div className="mt-3 space-y-2">
                  {group.children.map((child) => (
                    <div
                      key={child.categoryId}
                      className="flex items-center justify-between gap-4 border-l pl-7 text-sm"
                    >
                      <span className="text-muted-foreground">
                        {child.categoryName}
                      </span>

                      <span>{formatCurrency(child.total)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </section>
  )
}