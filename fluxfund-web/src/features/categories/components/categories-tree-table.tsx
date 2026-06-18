import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { CornerDownRight, FolderTree } from "lucide-react"

import type { CategoryTreeNode } from "../category-types"
import { CategoryActions } from "./category-actions"

type CategoriesTreeTableProps = {
  title: string
  description?: string
  categories: CategoryTreeNode[]
}

export function CategoriesTreeTable({
  title,
  description,
  categories,
}: CategoriesTreeTableProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle>{title}</CardTitle>

            {description && (
              <p className="mt-1 text-sm text-muted-foreground">
                {description}
              </p>
            )}
          </div>

          <Badge variant="secondary">
            {countCategories(categories)} categorias
          </Badge>
        </div>
      </CardHeader>

      <CardContent>
        {categories.length === 0 ? (
          <div className="flex h-48 items-center justify-center rounded-xl border border-dashed">
            <p className="text-sm text-muted-foreground">
              Nenhuma categoria cadastrada ainda.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead>Categoria</TableHead>
                  <TableHead>Documentação</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[50px]" />
                </TableRow>
              </TableHeader>

              <TableBody>
                {categories.map((category) => (
                  <CategoryTreeRows
                    key={category.id}
                    category={category}
                    level={0}
                  />
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

type CategoryTreeRowsProps = {
  category: CategoryTreeNode
  level: number
}

function CategoryTreeRows({ category, level }: CategoryTreeRowsProps) {
  const isParent = level === 0

  return (
    <>
      <TableRow className={isParent ? "bg-muted/30" : undefined}>
        <TableCell>
          <div
            className="flex items-center gap-3"
            style={{ paddingLeft: `${level * 24}px` }}
          >
            {isParent ? (
              <FolderTree className="size-4 text-muted-foreground" />
            ) : (
              <CornerDownRight className="size-4 text-muted-foreground" />
            )}

            <div>
              <p className={isParent ? "font-semibold" : "font-medium"}>
                {category.name}
              </p>

              <p className="text-xs text-muted-foreground">
                {isParent
                  ? `${category.children.length} subcategoria(s)`
                  : "Subcategoria"}
              </p>
            </div>
          </div>
        </TableCell>

        <TableCell>
          <DocumentationBadges category={category} />
        </TableCell>

        <TableCell>
          {category.active ? (
            <Badge>Ativa</Badge>
          ) : (
            <Badge variant="secondary">Inativa</Badge>
          )}
        </TableCell>

        <TableCell>
          <CategoryActions category={category} />
        </TableCell>
      </TableRow>

      {category.children.map((child) => (
        <CategoryTreeRows
          key={child.id}
          category={child}
          level={level + 1}
        />
      ))}
    </>
  )
}

type DocumentationBadgesProps = {
  category: CategoryTreeNode
}

function DocumentationBadges({ category }: DocumentationBadgesProps) {
  if (!category.requiresFiscalDocument && !category.requiresPaymentProof) {
    return (
      <Badge variant="outline" className="text-muted-foreground">
        Sem exigências
      </Badge>
    )
  }

  return (
    <div className="flex flex-wrap gap-1">
      {category.requiresFiscalDocument && (
        <Badge variant="secondary">Fiscal</Badge>
      )}

      {category.requiresPaymentProof && (
        <Badge variant="outline">Comprovante</Badge>
      )}
    </div>
  )
}

function countCategories(categories: CategoryTreeNode[]): number {
  return categories.reduce((total, category) => {
    return total + 1 + countCategories(category.children)
  }, 0)
}