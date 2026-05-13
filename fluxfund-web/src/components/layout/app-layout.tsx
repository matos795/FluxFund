import { Outlet } from "react-router-dom"

import { AppHeader } from "@/components/layout/app-header.tsx"
import { AppSidebar } from "@/components/layout/app-sidebar.tsx"

export function AppLayout() {
  return (
    <div className="min-h-screen bg-muted/40">
      <AppSidebar />

      <div className="flex min-h-screen flex-col pl-64">
        <AppHeader />

        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}