import { useState } from "react"

import { PageHeader } from "@/components/layout/page-header"
import { PagePagination } from "@/components/pagination/page-pagination"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { SupportAgreementsTable } from "@/features/support-agreements/components/support-agreements-table"
import { useSupportAgreements } from "@/features/support-agreements/hooks/use-support-agreements"
import { CreateSupportAgreementDialog } from "@/features/support-agreements/components/create-support-agreement-dialog"
import { usePermissions } from "@/features/auth/hooks/use-permissions"
import type { SupportAgreementStatus } from "@/features/support-agreements/support-agreement-types"
import { Info } from "lucide-react"

export function SupportAgreementsPage() {

    const { canFinanceWrite } = usePermissions()

    const [page, setPage] = useState(0)

    const [status, setStatus] = useState<
        SupportAgreementStatus | undefined
    >("ACTIVE")

    const supportAgreementsQuery = useSupportAgreements({
        page,
        size: 10,
        status,
    })

    const supportAgreements = supportAgreementsQuery.data

    return (
        <div className="space-y-6">
            <PageHeader
                title="Sustento"
                description="Gerencie compromissos mensais de sustento vinculados a favorecidos e fundos."
            >
                {canFinanceWrite && <CreateSupportAgreementDialog />}
            </PageHeader>

            <div className="flex flex-wrap gap-2">
                <Button
                    variant={status === "ACTIVE" ? "default" : "outline"}
                    onClick={() => {
                        setStatus("ACTIVE")
                        setPage(0)
                    }}
                >
                    Vigentes
                </Button>

                <Button
                    variant={status === "SCHEDULED" ? "default" : "outline"}
                    onClick={() => {
                        setStatus("SCHEDULED")
                        setPage(0)
                    }}
                >
                    Agendados
                </Button>

                <Button
                    variant={status === "EXPIRED" ? "default" : "outline"}
                    onClick={() => {
                        setStatus("EXPIRED")
                        setPage(0)
                    }}
                >
                    Encerrados
                </Button>

                <Button
                    variant={status === "INACTIVE" ? "default" : "outline"}
                    onClick={() => {
                        setStatus("INACTIVE")
                        setPage(0)
                    }}
                >
                    Desativados
                </Button>

                <Button
                    variant={status === undefined ? "default" : "outline"}
                    onClick={() => {
                        setStatus(undefined)
                        setPage(0)
                    }}
                >
                    Todos
                </Button>
            </div>

            <div className="flex gap-3 rounded-lg border bg-muted/40 p-4 text-sm text-muted-foreground">
                <Info className="mt-0.5 size-4 shrink-0" />

                <p>
                    A vigência é automática: após a data final, o compromisso fica
                    encerrado e deixa de ser sugerido ou considerado em relatórios
                    futuros. “Desativado” significa que ele foi interrompido manualmente.
                </p>
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