import {
  Building2,
  KeyRound,
  Landmark,
  Settings,
  ShieldCheck,
  UserRound,
  UsersRound,
} from "lucide-react"

import { PageHeader } from "@/components/layout/page-header"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { useAuth } from "@/features/auth/hooks/use-auth"
import { usePermissions } from "@/features/auth/hooks/use-permissions"
import { organizationRoleLabels } from "@/features/organization-users/organization-user-labels"
import { OrganizationProfileSettingsCard } from "@/features/organization-profile/components/organization-profile-settings-card"
import { FinancialSettingsCard } from "@/features/organization-settings/components/financial-settings-card"
import { OrganizationUsersSettingsCard } from "@/features/organization-users/components/organization-users-settings-card"
import { PasswordSettingsCard } from "@/features/profile/components/password-settings-card"
import { ProfileSettingsCard } from "@/features/profile/components/profile-settings-card"
import { cn } from "@/lib/utils"

type SettingsNavItem = {
  href: string
  label: string
  description: string
  icon: typeof Settings
  adminOnly?: boolean
}

const settingsNavItems: SettingsNavItem[] = [
  {
    href: "#profile",
    label: "Meu perfil",
    description: "Nome e e-mail da conta",
    icon: UserRound,
  },
  {
    href: "#security",
    label: "Senha",
    description: "Segurança do acesso",
    icon: KeyRound,
  },
  {
    href: "#organization",
    label: "Organização",
    description: "Nome e dados gerais",
    icon: Building2,
  },
  {
    href: "#financial",
    label: "Financeiro",
    description: "Fundos e regras padrão",
    icon: Landmark,
  },
  {
    href: "#users",
    label: "Usuários",
    description: "Papéis e acessos",
    icon: UsersRound,
    adminOnly: true,
  },
]

export function SettingsPage() {
  const { activeOrganization, session } = useAuth()
  const { canAdmin, role } = usePermissions()

  const visibleNavItems = settingsNavItems.filter(
    (item) => !item.adminOnly || canAdmin,
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Configurações"
        description="Gerencie sua conta, a organização ativa, permissões e regras financeiras do FluxFund."
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <SettingsSummaryCard
          icon={UserRound}
          label="Usuário logado"
          title={session?.user.name ?? "Usuário"}
          description={session?.user.email ?? "E-mail não informado"}
        />

        <SettingsSummaryCard
          icon={Building2}
          label="Organização atual"
          title={activeOrganization?.name ?? "Nenhuma organização"}
          description="Todas as configurações desta tela usam esta organização."
        />

        <SettingsSummaryCard
          icon={ShieldCheck}
          label="Seu papel"
          title={role ? organizationRoleLabels[role] : "Sem acesso"}
          description={
            canAdmin
              ? "Você pode gerenciar configurações e usuários."
              : "Algumas configurações ficam somente leitura."
          }
        />
      </div>

      {!canAdmin && (
        <p className="rounded-md border bg-muted p-3 text-sm text-muted-foreground">
          Você pode editar seu próprio perfil e senha. Configurações da organização ficam disponíveis somente para OWNER/ADMIN.
        </p>
      )}

      <div className="grid gap-6 xl:grid-cols-[300px_1fr]">
        <Card className="h-fit xl:sticky xl:top-24">
          <CardContent className="p-3">
            <nav className="space-y-1">
              {visibleNavItems.map((item) => {
                const Icon = item.icon

                return (
                  <a
                    key={item.href}
                    href={item.href}
                    className="group flex items-start gap-3 rounded-lg px-3 py-3 text-sm transition-colors hover:bg-muted"
                  >
                    <span className="rounded-lg bg-muted p-2 text-muted-foreground transition-colors group-hover:bg-background group-hover:text-foreground">
                      <Icon className="size-4" />
                    </span>

                    <span className="min-w-0">
                      <span className="block font-medium text-foreground">
                        {item.label}
                      </span>
                      <span className="mt-0.5 block text-xs text-muted-foreground">
                        {item.description}
                      </span>
                    </span>
                  </a>
                )
              })}
            </nav>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <section id="profile" className="scroll-mt-24">
            <ProfileSettingsCard />
          </section>

          <section id="security" className="scroll-mt-24">
            <PasswordSettingsCard />
          </section>

          <section id="organization" className="scroll-mt-24">
            <OrganizationProfileSettingsCard />
          </section>

          <section id="financial" className="scroll-mt-24">
            <FinancialSettingsCard />
          </section>

          {canAdmin && (
            <section id="users" className="scroll-mt-24">
              <OrganizationUsersSettingsCard />
            </section>
          )}
        </div>
      </div>
    </div>
  )
}

type SettingsSummaryCardProps = {
  icon: typeof Settings
  label: string
  title: string
  description: string
}

function SettingsSummaryCard({
  icon: Icon,
  label,
  title,
  description,
}: SettingsSummaryCardProps) {
  return (
    <Card className={cn("overflow-hidden")}> 
      <CardContent className="flex items-start gap-3 p-4">
        <div className="rounded-xl bg-primary/10 p-2 text-primary">
          <Icon className="size-5" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="mb-2">
            <Badge variant="outline">{label}</Badge>
          </div>
          <p className="truncate font-semibold">{title}</p>
          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
            {description}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}