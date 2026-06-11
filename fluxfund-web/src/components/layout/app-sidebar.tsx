import {
  Banknote,
  ChartNoAxesCombined,
  CreditCard,
  FolderTree,
  HandCoins,
  HandHeart,
  LayoutDashboard,
  ReceiptText,
  Settings,
  Tags,
  Users,
} from "lucide-react"

import { NavLink } from "react-router-dom"

import { cn } from "@/lib/utils"
import { useAuth } from "@/features/auth/hooks/use-auth"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"

const organizationRoleLabels = {
  OWNER: "Proprietário",
  ADMIN: "Administrador",
  FINANCE: "Financeiro",
  VIEWER: "Visualização",
}

const navigationItems = [
  {
    label: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    label: "Contas",
    href: "/accounts",
    icon: Banknote,
  },
  {
    label: "Categorias",
    href: "/categories",
    icon: Tags,
  },
  {
    label: "Fundos",
    href: "/funds",
    icon: FolderTree,
  },
  {
    label: "Favorecidos",
    href: "/beneficiaries",
    icon: Users,
  },
  {
    label: "Compromissos",
    href: "/support-agreements",
    icon: HandHeart,
  },
  {
    label: "Transações",
    href: "/transactions",
    icon: ReceiptText,
  },
  {
    label: "Cartões",
    href: "/credit-card-statements",
    icon: CreditCard,
  },
  {
    label: "Relatórios",
    href: "/reports",
    icon: ChartNoAxesCombined,
  },
  {
    label: "Configurações",
    href: "/settings",
    icon: Settings,
  },
]

type AppSidebarProps = {
  expanded: boolean
  onExpandedChange: (expanded: boolean) => void
}

export function AppSidebar({
  expanded,
  onExpandedChange,
}: AppSidebarProps) {

  const {
    session,
    activeOrganization,
    setActiveOrganization,
  } = useAuth()

  const canSwitchOrganization =
    (session?.user.organizations.length ?? 0) > 1

  return (
    <div className="w-16 shrink-0">
      <aside
        onMouseEnter={() => onExpandedChange(true)}
        onMouseLeave={() => onExpandedChange(false)}
        className={cn(
          "fixed left-0 top-0 z-30 flex h-screen flex-col border-r bg-background shadow-sm transition-all duration-300",
          expanded ? "w-64" : "w-16",
        )}
      >
        <div
          className={cn(
            "flex h-16 shrink-0 items-center border-b px-3",
            expanded ? "justify-between" : "justify-center",
          )}
        >
          {expanded ? (
            <div className="flex items-center gap-2">
              <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <HandCoins className="size-5" />
              </div>

              <div>
                <strong className="block leading-none">FluxFund</strong>
                <span className="text-xs text-muted-foreground">
                  Gestão financeira
                </span>
              </div>
            </div>
          ) : (
            <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <HandCoins className="size-5" />
            </div>
          )}
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {navigationItems.map((item) => {
            const Icon = item.icon

            return (
              <NavLink
                key={item.href}
                to={item.href}
                title={!expanded ? item.label : undefined}
                className={({ isActive }) =>
                  cn(
                    "flex items-center rounded-lg px-3 py-2 text-sm transition-colors",
                    expanded ? "gap-3" : "justify-center",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )
                }
              >
                <Icon className="size-4 shrink-0" />

                {expanded && (
                  <span className="truncate">
                    {item.label}
                  </span>
                )}
              </NavLink>
            )
          })}
        </nav>

        <div className="shrink-0 border-t p-4">
          {expanded ? (
            <div className="space-y-2 rounded-lg bg-muted p-3">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Organização atual
              </p>

              {canSwitchOrganization ? (
                <Select
                  value={activeOrganization?.id}
                  onValueChange={setActiveOrganization}
                >
                  <SelectTrigger className="h-9 bg-background">
                    <SelectValue placeholder="Selecione uma organização" />
                  </SelectTrigger>

                  <SelectContent>
                    {session?.user.organizations.map((organization) => (
                      <SelectItem key={organization.id} value={organization.id}>
                        {organization.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-sm font-medium">
                  {activeOrganization?.name ?? "Nenhuma organização"}
                </p>
              )}

              {activeOrganization && (
                <p className="text-xs text-muted-foreground">
                  {organizationRoleLabels[activeOrganization.role]}
                </p>
              )}
            </div>
          ) : (
            <div
              title={activeOrganization?.name}
              className="mx-auto flex size-9 items-center justify-center rounded-full bg-muted text-xs font-semibold"
            >
              {activeOrganization?.name?.charAt(0) ?? "O"}
            </div>
          )}
        </div>
      </aside>
    </div>
  )
}