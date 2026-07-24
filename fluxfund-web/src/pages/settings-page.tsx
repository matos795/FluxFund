import {
  Building2,
  Landmark,
  Settings,
  ShieldCheck,
  UserRound,
  UsersRound,
} from "lucide-react"

import { PageHeader } from "@/components/layout/page-header"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
} from "@/components/ui/card"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { useAuth } from "@/features/auth/hooks/use-auth"
import { usePermissions } from "@/features/auth/hooks/use-permissions"
import { organizationRoleLabels } from "@/features/organization-users/organization-user-labels"
import { OrganizationProfileSettingsCard } from "@/features/organization-profile/components/organization-profile-settings-card"
import { FinancialSettingsCard } from "@/features/organization-settings/components/financial-settings-card"
import { OrganizationUsersSettingsCard } from "@/features/organization-users/components/organization-users-settings-card"
import { PasswordSettingsCard } from "@/features/profile/components/password-settings-card"
import { ProfileSettingsCard } from "@/features/profile/components/profile-settings-card"
import { cn } from "@/lib/utils"

export function SettingsPage() {
  const {
    activeOrganization,
    session,
  } = useAuth()

  const {
    canAdmin,
    role,
  } = usePermissions()

  return (
    <div className="space-y-6">
      <PageHeader
        title="Configurações"
        description="Gerencie sua conta e as configurações da organização atual."
      />

      <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-primary/5 via-background to-background">
        <CardContent className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Building2 className="size-5" />
            </div>

            <div className="min-w-0">
              <p className="text-sm text-muted-foreground">
                Configurando
              </p>

              <p className="truncate text-lg font-semibold">
                {activeOrganization?.name ??
                  "Nenhuma organização"}
              </p>

              <p className="mt-1 text-sm text-muted-foreground">
                As alterações organizacionais serão
                aplicadas somente a este ambiente.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">
              <UserRound className="mr-1 size-3" />

              {session?.user.name ??
                "Usuário"}
            </Badge>

            <Badge variant="secondary">
              <ShieldCheck className="mr-1 size-3" />

              {role
                ? organizationRoleLabels[role]
                : "Sem acesso"}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {!canAdmin && (
        <div className="rounded-xl border bg-muted/40 p-4 text-sm text-muted-foreground">
          Você pode editar seu perfil e senha.
          Algumas configurações da organização ficam
          disponíveis somente para proprietários e
          administradores.
        </div>
      )}

      <Tabs
        defaultValue="account"
        className="space-y-4"
      >
        <TabsList
          className={cn(
            "sticky top-20 z-20 grid w-full gap-2 rounded-xl border bg-background/95 p-2 shadow-sm backdrop-blur group-data-horizontal/tabs:h-auto",
            canAdmin
              ? "grid-cols-2 lg:grid-cols-4"
              : "grid-cols-1 sm:grid-cols-3",
          )}
        >
          <SettingsTabTrigger
            value="account"
            icon={UserRound}
            title="Minha conta"
            description="Perfil e senha"
          />

          <SettingsTabTrigger
            value="organization"
            icon={Building2}
            title="Organização"
            description="Dados institucionais"
          />

          <SettingsTabTrigger
            value="financial"
            icon={Landmark}
            title="Financeiro"
            description="Regras e padrões"
          />

          {canAdmin && (
            <SettingsTabTrigger
              value="users"
              icon={UsersRound}
              title="Usuários"
              description="Convites e acessos"
            />
          )}
        </TabsList>

        <TabsContent
          value="account"
          className="mt-0"
        >
          <div className="grid gap-6 xl:grid-cols-2">
            <ProfileSettingsCard />

            <PasswordSettingsCard />
          </div>
        </TabsContent>

        <TabsContent
          value="organization"
          className="mt-0"
        >
          <OrganizationProfileSettingsCard />
        </TabsContent>

        <TabsContent
          value="financial"
          className="mt-0"
        >
          <FinancialSettingsCard />
        </TabsContent>

        {canAdmin && (
          <TabsContent
            value="users"
            className="mt-0"
          >
            <OrganizationUsersSettingsCard />
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}

type SettingsTabTriggerProps = {
  value: string
  icon: typeof Settings
  title: string
  description: string
}

function SettingsTabTrigger({
  value,
  icon: Icon,
  title,
  description,
}: SettingsTabTriggerProps) {
  return (
    <TabsTrigger
      value={value}
      className="h-full min-h-16 min-w-0 justify-start gap-3 px-3 py-3 text-left"
    >
      <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
        <Icon className="size-4" />
      </span>

      <span className="min-w-0">
        <span className="block truncate font-medium">
          {title}
        </span>

        <span className="hidden truncate text-xs font-normal text-muted-foreground sm:block">
          {description}
        </span>
      </span>
    </TabsTrigger>
  )
}