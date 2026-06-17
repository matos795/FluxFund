import type { OrganizationRole } from "@/features/auth/auth-types"

export type OrganizationUser = {
  userId: string
  name: string
  email: string
  role: OrganizationRole
  active: boolean
  createdAt: string
  updatedAt: string | null
}

export type CreateOrganizationUserRequest = {
  name: string
  email: string
  temporaryPassword: string
  role: OrganizationRole
}

export type UpdateOrganizationUserRoleRequest = {
  role: OrganizationRole
}

export type UpdateOrganizationUserStatusRequest = {
  active: boolean
}