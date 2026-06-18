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
import { ChevronDown, ChevronRight, CornerDownRight, FolderTree } from "lucide-react"

import type { CategoryTreeNode } from "../category-types"
import { CategoryActions } from "./category-actions"
import { Button } from "@/components/ui/button"
import { useMemo, useState } from "react"

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

    const [expandedCategoryIds, setExpandedCategoryIds] = useState<Set<string>>(
        () => new Set(),
    )

    const expandableCategoryIds = useMemo(
        () => getExpandableCategoryIds(categories),
        [categories],
    )

    const hasExpandableCategories = expandableCategoryIds.length > 0

    function toggleCategory(categoryId: string) {
        setExpandedCategoryIds((current) => {
            const next = new Set(current)

            if (next.has(categoryId)) {
                next.delete(categoryId)
            } else {
                next.add(categoryId)
            }

            return next
        })
    }

    function expandAll() {
        setExpandedCategoryIds(new Set(expandableCategoryIds))
    }

    function collapseAll() {
        setExpandedCategoryIds(new Set())
    }

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

                    <div className="flex flex-wrap items-center gap-2">
                        {hasExpandableCategories && (
                            <>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={expandAll}
                                >
                                    Expandir tudo
                                </Button>

                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={collapseAll}
                                >
                                    Recolher tudo
                                </Button>
                            </>
                        )}

                        <Badge variant="secondary">
                            {countCategories(categories)} categorias
                        </Badge>
                    </div>
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
                    <div className="max-h-[calc(100vh-320px)] overflow-auto rounded-xl border">
                        <Table>
                            <TableHeader className="sticky top-0 z-10 bg-background">
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
                                        expandedCategoryIds={expandedCategoryIds}
                                        onToggleCategory={toggleCategory}
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
    expandedCategoryIds: Set<string>
    onToggleCategory: (categoryId: string) => void
}

function CategoryTreeRows({
    category,
    level,
    expandedCategoryIds,
    onToggleCategory,
}: CategoryTreeRowsProps) {
    const isParent = level === 0
    const hasChildren = category.children.length > 0
    const isExpanded = expandedCategoryIds.has(category.id)

    return (
        <>
            <TableRow
                className={
                    hasChildren
                        ? isParent
                            ? "cursor-pointer bg-muted/30 hover:bg-muted/50"
                            : "cursor-pointer hover:bg-muted/40"
                        : isParent
                            ? "bg-muted/30"
                            : undefined
                }
                onClick={() => {
                    if (hasChildren) {
                        onToggleCategory(category.id)
                    }
                }}
            >
                <TableCell>
                    <div
                        className="flex items-center gap-3"
                        style={{ paddingLeft: `${level * 24}px` }}
                    >
                        {hasChildren ? (
                            <div className="flex size-7 shrink-0 items-center justify-center rounded-md">
                                {isExpanded ? (
                                    <ChevronDown className="size-4" />
                                ) : (
                                    <ChevronRight className="size-4" />
                                )}
                            </div>
                        ) : (
                            <div className="flex size-7 shrink-0 items-center justify-center">
                                {isParent ? (
                                    <FolderTree className="size-4 text-muted-foreground" />
                                ) : (
                                    <CornerDownRight className="size-4 text-muted-foreground" />
                                )}
                            </div>
                        )}

                        <div>
                            <p className={isParent ? "font-semibold" : "font-medium"}>
                                {category.name}
                            </p>

                            <p className="text-xs text-muted-foreground">
                                {hasChildren
                                    ? `${category.children.length} subcategoria(s)`
                                    : isParent
                                        ? "Categoria principal"
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

                <TableCell
                    onClick={(event) => event.stopPropagation()}
                    className="w-[50px]"
                >
                    <CategoryActions category={category} />
                </TableCell>
            </TableRow>

            {hasChildren &&
                isExpanded &&
                category.children.map((child) => (
                    <CategoryTreeRows
                        key={child.id}
                        category={child}
                        level={level + 1}
                        expandedCategoryIds={expandedCategoryIds}
                        onToggleCategory={onToggleCategory}
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

function getExpandableCategoryIds(categories: CategoryTreeNode[]): string[] {
    return categories.flatMap((category) => {
        const currentIds =
            category.children.length > 0 ? [category.id] : []

        return [
            ...currentIds,
            ...getExpandableCategoryIds(category.children),
        ]
    })
}