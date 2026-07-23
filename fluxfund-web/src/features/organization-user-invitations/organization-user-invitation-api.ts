import { httpClient } from "@/api/http-client"

import type {
  AcceptOrganizationUserInvitationRequest,
  AcceptOrganizationUserInvitationResponse,
  CreateOrganizationUserInvitationRequest,
  CreateOrganizationUserInvitationResponse,
  OrganizationUserInvitation,
  OrganizationUserInvitationDetails,
} from "./organization-user-invitation-types"

export async function getOrganizationUserInvitations() {
  const response = await httpClient.get<
    OrganizationUserInvitation[]
  >("/api/v1/organization-user-invitations")

  return response.data
}

export async function createOrganizationUserInvitation(
  data: CreateOrganizationUserInvitationRequest,
) {
  const response =
    await httpClient.post<CreateOrganizationUserInvitationResponse>(
      "/api/v1/organization-user-invitations",
      data,
    )

  return response.data
}

export async function cancelOrganizationUserInvitation(
  invitationId: string,
) {
  await httpClient.delete(
    `/api/v1/organization-user-invitations/${invitationId}`,
  )
}

export async function getPublicOrganizationUserInvitation(
  token: string,
) {
  const encodedToken = encodeURIComponent(token)

  const response =
    await httpClient.get<OrganizationUserInvitationDetails>(
      `/api/v1/public/organization-user-invitations/${encodedToken}`,
    )

  return response.data
}

export async function acceptOrganizationUserInvitation(
  token: string,
  data: AcceptOrganizationUserInvitationRequest,
) {
  const encodedToken = encodeURIComponent(token)

  const response =
    await httpClient.post<AcceptOrganizationUserInvitationResponse>(
      `/api/v1/public/organization-user-invitations/${encodedToken}/accept`,
      data,
    )

  return response.data
}