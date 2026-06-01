import { Bell, LogOut, Search } from "lucide-react"
import { useNavigate } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/features/auth/hooks/use-auth"

export function AppHeader() {
  const navigate = useNavigate()
  const { session, logout } = useAuth()

  function handleLogout() {
    logout()
    navigate("/login", { replace: true })
  }

  const initials =
    session?.user.name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() ?? "U"

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-background px-6">
      <div>
        <p className="text-sm text-muted-foreground">Bem-vindo,</p>
        <h1 className="text-lg font-semibold">
          {session?.user.name ?? "Usuário"}
        </h1>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Buscar..." className="w-72 pl-9" />
        </div>

        <Button variant="outline" size="icon">
          <Bell className="size-4" />
        </Button>

        <div className="flex size-9 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
          {initials}
        </div>

        <Button
          variant="ghost"
          size="icon"
          title="Sair"
          onClick={handleLogout}
        >
          <LogOut className="size-4" />
        </Button>
      </div>
    </header>
  )
}