import type { CategoryResultGroup } from "../reports-types"
import { formatCurrency } from "@/utils/formatters"

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
  return (
    <section className="rounded-xl border bg-card">
      <header className="flex items-center justify-between border-b px-5 py-4">
        <h2 className="text-base font-semibold">{title}</h2>
        <strong className="text-base">{formatCurrency(total)}</strong>
      </header>

      <div className="divide-y">
        {groups.length === 0 ? (
          <div className="px-5 py-6 text-sm text-muted-foreground">
            Nenhum valor encontrado.
          </div>
        ) : (
          groups.map((group) => (
            <div key={group.groupId} className="px-5 py-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-medium">{group.groupName}</p>
                  <p className="text-xs text-muted-foreground">
                    {group.transactionCount} transações
                  </p>
                </div>

                <strong>{formatCurrency(group.total)}</strong>
              </div>

              <div className="mt-3 space-y-2">
                {group.children.map((child) => (
                  <div
                    key={child.categoryId}
                    className="flex items-center justify-between gap-4 border-l pl-4 text-sm"
                  >
                    <span className="text-muted-foreground">
                      {child.categoryName}
                    </span>

                    <span>{formatCurrency(child.total)}</span>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  )
}