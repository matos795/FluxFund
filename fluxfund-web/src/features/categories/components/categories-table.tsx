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
import { CornerDownRight, FileCheck2, FolderTree, ReceiptText } from "lucide-react"

import type { Category } from "../category-types"
import { CategoryActions } from "./category-actions"

type CategoriesTableProps = {
  categories: Category[]
  title?: string
  description?: string
}

type CategoryGroup = {
  parent: Category
  children: Category[]
}

const categoryCollator = new Intl.Collator("pt-BR", {
  sensitivity: "base",
})

export function CategoriesTable({
  categories,
  title = "Categorias cadastradas",
  description,
}: CategoriesTableProps) {
  const groups = buildCategoryGroups(categories)

  return (
    <Card>
      <CardHeader className="space-y-1">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>{title}</CardTitle>

            {description && (
              <p className="mt-1 text-sm text-muted-foreground">
                {description}
              </p>
            )}
          </div>

          <Badge variant="secondary" className="w-fit">
            {categories.length} categorias
          </Badge>
        </div>
      </CardHeader>

      <CardContent>
        {categories.length === 0 ? (
          <div className="flex h-48 items-center justify-center rounded-xl border border-dashed">
            <div className="text-center">
              <p className="text-sm font-medium">Nenhuma categoria encontrada</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Cadastre uma categoria para começar a organizar o plano de contas.
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40">
                    <TableHead className="min-w-[280px]">Categoria</TableHead>
                    <TableHead className="min-w-[180px]">Estrutura</TableHead>
                    <TableHead className="min-w-[220px]">Documentação</TableHead>
                    <TableHead className="min-w-[120px]">Status</TableHead>
                    <TableHead className="w-[50px]" />
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {groups.map((group) => (
                    <CategoryGroupRows key={group.parent.id} group={group} />
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

type CategoryGroupRowsProps = {
  group: CategoryGroup
}

function CategoryGroupRows({ group }: CategoryGroupRowsProps) {
  return (
    <>
      <TableRow className="bg-muted/30 hover:bg-muted/30">
        <TableCell>
          <div className="flex items-center gap-3">
            <div className="flex size-8 items-center justify-center rounded-lg bg-background">
              <FolderTree className="size-4 text-muted-foreground" />
            </div>

            <div>
              <p className="font-semibold">{group.parent.name}</p>
              <p className="text-xs text-muted-foreground">
                Categoria principal
              </p>
            </div>
          </div>
        </TableCell>

        <TableCell>
          <Badge variant="outline">
            {formatChildrenCount(group.children.length)}
          </Badge>
        </TableCell>

        <TableCell>
          <DocumentationBadges category={group.parent} />
        </TableCell>

        <TableCell>
          <StatusBadge category={group.parent} />
        </TableCell>

        <TableCell>
          <CategoryActions category={group.parent} />
        </TableCell>
      </TableRow>

      {group.children.map((child) => (
        <TableRow key={child.id}>
          <TableCell>
            <div className="flex items-center gap-3 pl-6">
              <CornerDownRight className="size-4 text-muted-foreground" />

              <div>
                <p className="font-medium">{child.name}</p>
                <p className="text-xs text-muted-foreground">
                  Filha de {group.parent.name}
                </p>
              </div>
            </div>
          </TableCell>

          <TableCell>
            <Badge variant="secondary">Subcategoria</Badge>
          </TableCell>

          <TableCell>
            <DocumentationBadges category={child} />
          </TableCell>

          <TableCell>
            <StatusBadge category={child} />
          </TableCell>

          <TableCell>
            <CategoryActions category={child} />
          </TableCell>
        </TableRow>
      ))}
    </>
  )
}

type CategoryBadgeProps = {
  category: Category
}

function DocumentationBadges({ category }: CategoryBadgeProps) {
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
        <Badge variant="secondary" className="gap-1">
          <FileCheck2 className="size-3" />
          Fiscal
        </Badge>
      )}

      {category.requiresPaymentProof && (
        <Badge variant="outline" className="gap-1">
          <ReceiptText className="size-3" />
          Comprovante
        </Badge>
      )}
    </div>
  )
}

function StatusBadge({ category }: CategoryBadgeProps) {
  return category.active ? (
    <Badge>Ativa</Badge>
  ) : (
    <Badge variant="secondary">Inativa</Badge>
  )
}

function buildCategoryGroups(categories: Category[]): CategoryGroup[] {
  const sortedCategories = [...categories].sort((a, b) =>
    categoryCollator.compare(a.name, b.name),
  )

  const parentCategories = sortedCategories.filter((category) => !category.parent)
  const parentIds = new Set(parentCategories.map((category) => category.id))

  const childrenByParentId = new Map<string, Category[]>()
  const categoriesWithoutKnownParent: Category[] = []

  for (const category of sortedCategories) {
    const parentId = category.parent?.id

    if (!parentId) {
      continue
    }

    if (!parentIds.has(parentId)) {
      categoriesWithoutKnownParent.push(category)
      continue
    }

    const currentChildren = childrenByParentId.get(parentId) ?? []

    childrenByParentId.set(parentId, [...currentChildren, category])
  }

  const groups = parentCategories.map((parent) => ({
    parent,
    children: childrenByParentId.get(parent.id) ?? [],
  }))

  const fallbackGroups = categoriesWithoutKnownParent.map((category) => ({
    parent: category,
    children: [],
  }))

  return [...groups, ...fallbackGroups].sort((a, b) =>
    categoryCollator.compare(a.parent.name, b.parent.name),
  )
}

function formatChildrenCount(count: number) {
  if (count === 0) {
    return "Sem subcategorias"
  }

  if (count === 1) {
    return "1 subcategoria"
  }

  return `${count} subcategorias`
}