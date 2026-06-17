import { createContext } from "react"
import type {
  AuthSession,
  LoginRequest,
  UserOrganization,
} from "./auth-types"

type AuthContextValue = {
  session: AuthSession | null
  isAuthenticated: boolean
  isLoadingSession: boolean
  activeOrganization: UserOrganization | null
  login: (data: LoginRequest) => Promise<AuthSession>
  logout: () => void
  setActiveOrganization: (organizationId: string) => void
  refreshUser: () => Promise<AuthSession | null>
}

export const AuthContext = createContext<AuthContextValue | undefined>(
  undefined,
)

export type { AuthContextValue }
