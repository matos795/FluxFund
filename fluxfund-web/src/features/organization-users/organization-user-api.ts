import { httpClient } from "@/api/http-client"
import type {
  CreateOrganizationUserRequest,
  OrganizationUser,
  UpdateOrganizationUserRoleRequest,
  UpdateOrganizationUserStatusRequest,
} from "./organization-user-types"

export async function getOrganizationUsers() {
  const response = await httpClient.get<OrganizationUser[]>(
    "/api/v1/organization-users",
  )

  return response.data
}

export async function createOrganizationUser(
  data: CreateOrganizationUserRequest,
) {
  const response = await httpClient.post<OrganizationUser>(
    "/api/v1/organization-users",
    data,
  )

  return response.data
}

export async function updateOrganizationUserRole(
  userId: string,
  data: UpdateOrganizationUserRoleRequest,
) {
  const response = await httpClient.patch<OrganizationUser>(
    `/api/v1/organization-users/${userId}/role`,
    data,
  )

  return response.data
}

export async function updateOrganizationUserStatus(
  userId: string,
  data: UpdateOrganizationUserStatusRequest,
) {
  const response = await httpClient.patch<OrganizationUser>(
    `/api/v1/organization-users/${userId}/status`,
    data,
  )

  return response.data
}