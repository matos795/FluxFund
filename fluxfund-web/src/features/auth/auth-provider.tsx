import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"

import { queryClient } from "@/app/query-client"

import {
  getAuthenticatedUser,
  login as loginRequest,
} from "./auth-api"
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

  const [isLoadingSession, setIsLoadingSession] = useState(() =>
    Boolean(getStoredSession()?.accessToken),
  )

  const activeOrganization =
    session?.user.organizations.find(
      (organization) => organization.id === session.activeOrganizationId,
    ) ?? null

  useEffect(() => {
    const storedSession = getStoredSession()

    if (!storedSession?.accessToken) {
      return
    }

    type StoredSessionType = NonNullable<ReturnType<typeof getStoredSession>>

    let active = true

    async function validateStoredSession(
      storedSession: StoredSessionType,
    ) {
      try {
        const user = await getAuthenticatedUser()

        if (!active) {
          return
        }

        const activeOrganizationStillExists = user.organizations.some(
          (organization) =>
            organization.id === storedSession.activeOrganizationId,
        )

        const nextSession: AuthSession = {
          accessToken: storedSession.accessToken,
          user,
          activeOrganizationId:
            activeOrganizationStillExists
              ? storedSession.activeOrganizationId
              : null,
        }

        storeSession(nextSession)
        setSession(nextSession)
      } catch {
        if (!active) {
          return
        }

        removeStoredSession()
        setSession(null)
        queryClient.clear()
      } finally {
        if (active) {
          setIsLoadingSession(false)
        }
      }
    }

    validateStoredSession(storedSession)

    return () => {
      active = false
    }
  }, [])

  const login = useCallback(async (data: LoginRequest) => {
    const response = await loginRequest(data)

    const nextSession: AuthSession = {
      accessToken: response.accessToken,
      user: response.user,
      activeOrganizationId: null,
    }

    storeSession(nextSession)
    setSession(nextSession)
    queryClient.clear()

    return nextSession
  }, [])

  const logout = useCallback(() => {
    removeStoredSession()
    setSession(null)
    queryClient.clear()
  }, [])


  const refreshUser = useCallback(async () => {
    if (!session?.accessToken) {
      return null
    }

    const user = await getAuthenticatedUser()

    const activeOrganizationStillExists = user.organizations.some(
      (organization) => organization.id === session.activeOrganizationId,
    )

    const nextSession: AuthSession = {
      accessToken: session.accessToken,
      user,
      activeOrganizationId:
        activeOrganizationStillExists
          ? session.activeOrganizationId
          : null,
    }

    storeSession(nextSession)
    setSession(nextSession)

    return nextSession
  }, [session])

  const setActiveOrganization = useCallback(
  async (organizationId: string) => {
    if (!session) {
      return
    }

    const organizationExists =
      session.user.organizations.some(
        (organization) =>
          organization.id === organizationId,
      )

    if (!organizationExists) {
      return
    }

    /*
     * Cancela chamadas que ainda possam estar usando
     * a organização anterior.
     */
    await queryClient.cancelQueries()

    const nextSession: AuthSession = {
      ...session,
      activeOrganizationId: organizationId,
    }

    /*
     * O interceptor HTTP lê a sessão armazenada.
     * Por isso, salvamos antes de abrir a nova tela.
     */
    storeSession(nextSession)
    setSession(nextSession)

    /*
     * As query keys atuais não possuem organizationId.
     * Limpamos todo o cache para impedir que dados
     * da organização anterior sejam reaproveitados.
     */
    queryClient.clear()
  },
  [session],
)

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      isAuthenticated: Boolean(session?.accessToken),
      isLoadingSession,
      activeOrganization,
      login,
      logout,
      setActiveOrganization,
      refreshUser,
    }),
    [session, isLoadingSession, activeOrganization, login, logout, setActiveOrganization, refreshUser],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
