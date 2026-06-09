import { useState } from "react"
import { Outlet } from "react-router-dom"

import { AppHeader } from "@/components/layout/app-header"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { cn } from "@/lib/utils"

export function AppLayout() {
  const [sidebarExpanded, setSidebarExpanded] = useState(false)

  return (
    <div className="min-h-screen bg-muted/40">
      <AppSidebar
        expanded={sidebarExpanded}
        onExpandedChange={setSidebarExpanded}
      />

      <div className="pl-16">
        <div
          className={cn(
            "sticky top-0 z-20 transition-all duration-300",
            sidebarExpanded ? "ml-48" : "ml-0",
          )}
        >
          <AppHeader />
        </div>

        <main
          className={cn(
            "min-w-0 flex-1 transition-all duration-300",
            sidebarExpanded ? "ml-48" : "ml-0",
          )}
        >
          <div className="mx-auto w-full max-w-[1600px] p-4 md:p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}