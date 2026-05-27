import { useState } from "react"

import { PageHeader } from "@/components/layout/page-header"
import { PagePagination } from "@/components/pagination/page-pagination"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { SupportAgreementsTable } from "@/features/support-agreements/components/support-agreements-table"
import { useSupportAgreements } from "@/features/support-agreements/hooks/use-support-agreements"
import { CreateSupportAgreementDialog } from "@/features/support-agreements/components/create-support-agreement-dialog"

export function SupportAgreementsPage() {
    const [page, setPage] = useState(0)
    const [active, setActive] = useState<boolean | undefined>(true)

    const supportAgreementsQuery = useSupportAgreements({
        page,
        size: 10,
        active,
    })

    const supportAgreements = supportAgreementsQuery.data

    return (
        <div className="space-y-6">
            <PageHeader
                title="Compromissos"
                description="Gerencie compromissos fixos de sustento vinculados a favorecidos e fundos."
            >
            <CreateSupportAgreementDialog />
            </PageHeader>

            <div className="flex flex-wrap gap-2">
                <Button
                    variant={active === true ? "default" : "outline"}
                    onClick={() => {
                        setActive(true)
                        setPage(0)
                    }}
                >
                    Ativos
                </Button>

                <Button
                    variant={active === false ? "default" : "outline"}
                    onClick={() => {
                        setActive(false)
                        setPage(0)
                    }}
                >
                    Inativos
                </Button>

                <Button
                    variant={active === undefined ? "default" : "outline"}
                    onClick={() => {
                        setActive(undefined)
                        setPage(0)
                    }}
                >
                    Todos
                </Button>
            </div>

            <Card>
                <CardContent className="p-0">
                    <SupportAgreementsTable
                        agreements={supportAgreements?.content ?? []}
                        isLoading={supportAgreementsQuery.isLoading}
                    />
                </CardContent>
            </Card>

            {supportAgreements && (
                <PagePagination
                    page={supportAgreements.number}
                    totalPages={supportAgreements.totalPages}
                    totalElements={supportAgreements.totalElements}
                    onPageChange={setPage}
                    size={supportAgreements.size}
                    isFirst={supportAgreements.first}
                    isLast={supportAgreements.last}
                />
            )}
        </div>
    )
}