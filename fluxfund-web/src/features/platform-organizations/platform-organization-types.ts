import type { CreateOrganizationUserInvitationResponse } from "@/features/organization-user-invitations/organization-user-invitation-types"

export type PlatformOrganization = {
  id: string
  name: string
  active: boolean
  cnpj: string | null
  contactEmail: string | null
  totalUsers: number
  activeUsers: number
  pendingInvitations: number
  createdAt: string
}

export type CreatePlatformOrganizationRequest = {
  organizationName: string
  ownerName: string
  ownerEmail: string
}

export type CreatePlatformOrganizationResponse = {
  organization: PlatformOrganization
  ownerInvitation:
    CreateOrganizationUserInvitationResponse
}

export type GetPlatformOrganizationsParams = {
  page: number
  size: number
  query?: string
}