import {
  useMemo,
  useState,
  type ReactNode,
} from "react"

import { queryClient } from "@/app/query-client"

import { login as loginRequest } from "./auth-api"
import {
  getStoredSession,
  removeStoredSession,
  storeSession,
} from "./auth-storage"
import type {
  AuthSession,
  LoginRequest,
} from "./auth-types"
import { AuthContext, type AuthContextValue } from "./auth-context"

type AuthProviderProps = {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [session, setSession] = useState<AuthSession | null>(() =>
    getStoredSession(),
  )

  const activeOrganization =
    session?.user.organizations.find(
      (organization) => organization.id === session.activeOrganizationId,
    ) ?? null

  async function login(data: LoginRequest) {
    const response = await loginRequest(data)

    const nextSession: AuthSession = {
      accessToken: response.accessToken,
      user: response.user,
      activeOrganizationId: response.user.organizations[0]?.id ?? null,
    }

    storeSession(nextSession)
    setSession(nextSession)
    queryClient.clear()

    return nextSession
  }

  function logout() {
    removeStoredSession()
    setSession(null)
    queryClient.clear()
  }

  function setActiveOrganization(organizationId: string) {
    if (!session) {
      return
    }

    const organizationExists = session.user.organizations.some(
      (organization) => organization.id === organizationId,
    )

    if (!organizationExists) {
      return
    }

    const nextSession: AuthSession = {
      ...session,
      activeOrganizationId: organizationId,
    }

    storeSession(nextSession)
    setSession(nextSession)
    queryClient.clear()
  }

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      isAuthenticated: Boolean(session?.accessToken),
      activeOrganization,
      login,
      logout,
      setActiveOrganization,
    }),
    [session, activeOrganization],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
