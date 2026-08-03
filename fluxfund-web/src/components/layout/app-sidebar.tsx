import {
  Banknote,
  Building2,
  CalendarClock,
  ChartNoAxesCombined,
  ChevronsUpDown,
  CreditCard,
  FolderTree,
  HandCoins,
  LayoutDashboard,
  ReceiptText,
  Settings,
  Tags,
  Users,
} from "lucide-react"

import { NavLink, useLocation, useNavigate } from "react-router-dom"

import { cn } from "@/lib/utils"
import { useAuth } from "@/features/auth/hooks/use-auth"
import { UserOrganizationLogo } from "@/features/auth/components/user-organization-logo"

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
    label: "Contatos financeiros",
    href: "/financial-parties",
    icon: Users,
  },
  {
    label:
      "Compromissos",
    href:
      "/financial-commitments",
    icon:
      CalendarClock,
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

  const navigate = useNavigate()

  const location =
    useLocation()

  const {
    activeOrganization,
  } = useAuth()

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

            const commitmentsSectionActive =
              item.href ===
              "/financial-commitments" &&
              (
                location.pathname.startsWith(
                  "/financial-commitments",
                ) ||
                location.pathname.startsWith(
                  "/support-agreements",
                )
              )

            return (
              <NavLink
                key={item.href}
                to={item.href}
                title={!expanded ? item.label : undefined}
                className={({ isActive }) => {
                  const active =
                    isActive ||
                    commitmentsSectionActive

                  return cn(
                    "flex items-center rounded-lg px-3 py-2 text-sm transition-colors",
                    expanded
                      ? "gap-3"
                      : "justify-center",

                    active
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )
                }}
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

        <div className="shrink-0 border-t p-3">
          {expanded ? (
            <button
              type="button"
              onClick={() =>
                navigate("/organizations")
              }
              className="flex w-full items-center gap-3 rounded-xl bg-muted p-3 text-left transition-colors hover:bg-muted/70"
            >
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-background text-primary shadow-sm">
                {activeOrganization ? (
                  <UserOrganizationLogo
                    organizationId={activeOrganization.id}
                    organizationName={activeOrganization.name}
                    hasLogo={activeOrganization.hasLogo}
                    className="size-10 rounded-xl text-sm"
                  />
                ) : (
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-background text-primary shadow-sm">
                    <Building2 className="size-4" />
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground">
                  Organização atual
                </p>

                <p className="truncate text-sm font-semibold">
                  {activeOrganization?.name ??
                    "Selecionar organização"}
                </p>

                {activeOrganization && (
                  <p className="truncate text-xs text-muted-foreground">
                    {
                      organizationRoleLabels[
                      activeOrganization.role
                      ]
                    }
                  </p>
                )}
              </div>

              <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" />
            </button>
          ) : (
            <button
              type="button"
              title="Trocar organização"
              onClick={() =>
                navigate("/organizations")
              }
              className="mx-auto flex size-10 items-center justify-center rounded-xl bg-muted text-sm font-semibold transition-colors hover:bg-muted/70"
            >
              {activeOrganization ? (
                <UserOrganizationLogo
                  organizationId={activeOrganization.id}
                  organizationName={activeOrganization.name}
                  hasLogo={activeOrganization.hasLogo}
                  className="size-10 rounded-xl text-sm"
                />
              ) : (
                "O"
              )}
            </button>
          )}
        </div>
      </aside>
    </div >
  )
}