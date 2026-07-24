export type OrganizationRole = "OWNER" | "ADMIN" | "FINANCE" | "VIEWER"

export type UserOrganization = {
  id: string
  name: string
  role: OrganizationRole
  hasLogo: boolean
}

export type AuthenticatedUser = {
  id: string
  name: string
  email: string
  organizations: UserOrganization[]
}

export type LoginRequest = {
  email: string
  password: string
}

export type LoginResponse = {
  accessToken: string
  tokenType: string
  expiresInSeconds: number
  user: AuthenticatedUser
}

export type AuthSession = {
  accessToken: string
  user: AuthenticatedUser
  activeOrganizationId: string | null
}