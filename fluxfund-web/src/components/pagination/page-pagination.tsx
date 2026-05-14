import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "../ui/button"


type PagePaginationProps = {
    page: number
    totalPages: number
    totalElements: number
    size: number
    isFirst: boolean
    isLast: boolean
    onPageChange: (page: number) => void
}

export function PagePagination({
    page,
    totalPages,
    totalElements,
    size,
    isFirst,
    isLast,
    onPageChange,
}: PagePaginationProps) {

    const currentPage = page + 1

    const startItem = totalElements === 0 ? 0 : page * size + 1
    const endItem = Math.min((page + 1) * size, totalElements)

    return (
        <div className="flex items-center justify-between gap-4 border-t px-2 pt-4">
            <p className="text-sm text-muted-foreground">
                Mostrando{" "}
                <span className="font-medium text-foreground">{startItem}</span>
                {" "}a{" "}
                <span className="font-medium text-foreground">{endItem}</span>
                {" "}de{" "}
                <span className="font-medium text-foreground">{totalElements}</span>
                {" "}registro(s)
            </p>

            <div className="flex items-center gap-3">
                <p className="text-sm text-muted-foreground">
                    Página{" "}
                    <span className="font-medium text-foreground">{currentPage}</span>
                    {" "}de{" "}
                    <span className="font-medium text-foreground">
                        {totalPages || 1}
                    </span>
                </p>

                <div className="flex items-center gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={isFirst}
                        onClick={() => onPageChange(page - 1)}
                    >
                        <ChevronLeft className="mr-1 size-4" />
                        Anterior
                    </Button>

                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={isLast}
                        onClick={() => onPageChange(page + 1)}
                    >
                        Próxima
                        <ChevronRight className="ml-1 size-4" />
                    </Button>
                </div>
            </div>
        </div>
    )
}