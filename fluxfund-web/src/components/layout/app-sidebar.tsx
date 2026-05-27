import {
  Banknote,
  ChartNoAxesCombined,
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

export function AppSidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-10 flex w-64 flex-col border-r bg-background">
      <div className="flex h-16 items-center border-b px-6">
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
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {navigationItems.map((item) => {
          const Icon = item.icon

          return (
            <NavLink
              key={item.href}
              to={item.href}
              end={item.href === "/"}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                  isActive && "bg-muted text-foreground"
                )
              }
            >
              <Icon className="size-4" />
              {item.label}
            </NavLink>
          )
        })}
      </nav>

      <div className="border-t p-4">
        <div className="rounded-lg bg-muted p-3">
          <p className="text-sm font-medium">Organização atual</p>
          <p className="mt-1 text-xs text-muted-foreground">
            FluxFund Demo
          </p>
        </div>
      </div>
    </aside>
  )
}