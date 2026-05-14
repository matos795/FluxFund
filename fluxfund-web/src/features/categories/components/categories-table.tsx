import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Category } from "../category-types"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { categoryTypeLabels } from "../category-labels"
import { Badge } from "@/components/ui/badge"
import { CategoryActions } from "./category-actions"


type CategoriesTableProps = {
    categories: Category[]
}

export function CategoriesTable({ categories }: CategoriesTableProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Categorias cadastradas</CardTitle>
            </CardHeader>

            <CardContent>
                {categories.length === 0 ? (
                    <div className="flex h-48 items-center justify-center rounded-lg border border-dashed">
                        <p className="text-sm text-muted-foreground">
                            Nenhuma categoria cadastrada ainda.
                        </p>
                    </div>
                ) : (
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nome</TableHead>
                                    <TableHead>Tipo</TableHead>
                                    <TableHead>Filiação</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="w-[50px]" />
                                </TableRow>
                            </TableHeader>

                            <TableBody>
                                {categories.map((category) => (

                                    <TableRow key={category.id}>
                                        <TableCell className="font-medium">
                                            {category.name}
                                        </TableCell>
                                        <TableCell>
                                            {categoryTypeLabels[category.type]}
                                        </TableCell>
                                        <TableCell>
                                            {category.parent?.name ?? "-"}
                                        </TableCell>
                                        <TableCell>
                                            {category.active ? (
                                                <Badge>Ativa</Badge>
                                            ) : (
                                                <Badge variant="secondary">Inativa</Badge>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <CategoryActions category={category} categories={categories} />
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )
                }
            </CardContent>
        </Card>
    )
}