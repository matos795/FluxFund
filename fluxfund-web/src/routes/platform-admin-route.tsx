import {
  Navigate,
  Outlet,
} from "react-router-dom"

import { useAuth } from "@/features/auth/hooks/use-auth"

export function PlatformAdminRoute() {
  const { session } = useAuth()

  if (
    !session?.user.platformAdmin
  ) {
    const hasOrganizations =
      (
        session
          ?.user
          .organizations
          .length ?? 0
      ) > 0

    return (
      <Navigate
        to={
          hasOrganizations
            ? "/organizations"
            : "/no-organization"
        }
        replace
      />
    )
  }

  return <Outlet />
}