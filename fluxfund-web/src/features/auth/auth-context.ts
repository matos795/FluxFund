import { createContext } from "react"

import type { UserOrganization, AuthSession, LoginRequest } from "./auth-types"

export type AuthContextValue = {
  session: AuthSession | null
  isAuthenticated: boolean
  activeOrganization: UserOrganization | null
  login: (data: LoginRequest) => Promise<AuthSession>
  logout: () => void
  setActiveOrganization: (organizationId: string) => void
}

export const AuthContext = createContext<AuthContextValue | undefined>(
  undefined,
)
