import {
  CalendarClock,
  HandHeart,
  History,
} from "lucide-react"

import {
  Link,
  useLocation,
} from "react-router-dom"

import {
  cn,
} from "@/lib/utils"

const items = [
  {
    href:
      "/financial-commitments",

    label:
      "A receber e a pagar",

    description:
      "Doações, clientes, fornecedores, salários e serviços.",

    icon:
      CalendarClock,

    exact:
      true,
  },

  {
    href:
      "/support-agreements",

    label:
      "Sustento",

    description:
      "Compromissos missionários e valores de repasse.",

    icon:
      HandHeart,

    exact:
      true,
  },

  {
    href:
      "/financial-commitments/reconciliation",

    label:
      "Reconciliação",

    description:
      "Associe movimentações antigas aos compromissos corretos.",

    icon:
      History,

    exact:
      false,
  },
]

export function CommitmentsWorkspaceNav() {
  const location =
    useLocation()

  return (
    <div className="grid gap-3 md:grid-cols-3">
      {items.map((item) => {
        const Icon =
          item.icon

        const active =
          item.exact
            ? location.pathname ===
              item.href
            : location.pathname.startsWith(
                item.href,
              )

        return (
          <Link
            key={item.href}
            to={item.href}
            className={cn(
              "group flex min-w-0 gap-3 rounded-xl border p-4 transition-all",
              "hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-sm",

              active
                ? "border-primary bg-primary/5 shadow-sm"
                : "bg-card",
            )}
          >
            <div
              className={cn(
                "flex size-10 shrink-0 items-center justify-center rounded-xl",

                active
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground group-hover:text-foreground",
              )}
            >
              <Icon className="size-5" />
            </div>

            <div className="min-w-0">
              <p className="font-medium">
                {item.label}
              </p>

              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                {
                  item.description
                }
              </p>
            </div>
          </Link>
        )
      })}
    </div>
  )
}