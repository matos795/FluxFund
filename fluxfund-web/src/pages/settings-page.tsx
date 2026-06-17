import { PageHeader } from "@/components/layout/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { usePermissions } from "@/features/auth/hooks/use-permissions"
import { FinancialSettingsCard } from "@/features/organization-settings/components/financial-settings-card"
import { OrganizationUsersSettingsCard } from "@/features/organization-users/components/organization-users-settings-card"

export function SettingsPage() {

  const { canAdmin } = usePermissions()

  return (
    <div className="space-y-6">
      <PageHeader
        title="Configurações"
        description="Gerencie preferências da organização atual e regras padrão do sistema."
      />

      {!canAdmin && (
        <p className="rounded-md border bg-muted p-3 text-sm text-muted-foreground">
          Você possui acesso somente para visualizar estas configurações.
        </p>
      )}

      <div className="grid gap-6 xl:grid-cols-[260px_1fr]">
        <Card className="h-fit">
          <CardContent className="p-3">
            <nav className="space-y-1">
              <a
                href="#financial"
                className="block rounded-lg bg-muted px-3 py-2 text-sm font-medium"
              >
                Financeiro
              </a>

              <a
                href="#users"
                className="block rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                Usuários e permissões
              </a>

              <span className="block rounded-lg px-3 py-2 text-sm text-muted-foreground">
                Organização em breve
              </span>

              <span className="block rounded-lg px-3 py-2 text-sm text-muted-foreground">
                Segurança em breve
              </span>

              <span className="block rounded-lg px-3 py-2 text-sm text-muted-foreground">
                Anexos e armazenamento em breve
              </span>
            </nav>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <div id="financial">
            <FinancialSettingsCard />
          </div>

          {canAdmin && (
            <div id="users">
              <OrganizationUsersSettingsCard />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}