import type { OrganizationRole } from "@/features/auth/auth-types"

export type OrganizationUserInvitationStatus =
  | "PENDING"
  | "EXPIRED"
  | "ACCEPTED"
  | "CANCELED"

export type OrganizationUserInvitation = {
  id: string
  name: string
  email: string
  role: OrganizationRole
  status: OrganizationUserInvitationStatus
  expiresAt: string
  createdAt: string
}

export type CreateOrganizationUserInvitationRequest = {
  name: string
  email: string
  role: Exclude<OrganizationRole, "OWNER">
}

export type CreateOrganizationUserInvitationResponse = {
  invitation: OrganizationUserInvitation
  invitationUrl: string
  emailSent: boolean
}

export type OrganizationUserInvitationDetails = {
  organizationName: string
  invitedName: string
  email: string
  role: OrganizationRole
  expiresAt: string
  requiresPassword: boolean
}

export type AcceptOrganizationUserInvitationRequest = {
  name?: string | null
  password?: string | null
}

export type AcceptOrganizationUserInvitationResponse = {
  organizationId: string
  organizationName: string
  email: string
  message: string
}