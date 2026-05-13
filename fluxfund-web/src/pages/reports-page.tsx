import { PageHeader } from "@/components/layout/page-header"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export function ReportsPage() {
  return (
    <div>
      <PageHeader
        title="Relatórios"
        description="Acompanhe saldos, destinações, repasses e prestação de contas."
      />

      <Card>
        <CardHeader>
          <CardTitle>Relatórios disponíveis</CardTitle>
        </CardHeader>

        <CardContent>
          <div className="flex h-48 items-center justify-center rounded-lg border border-dashed">
            <p className="text-sm text-muted-foreground">
              Os relatórios serão criados após a integração com os dados financeiros.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}