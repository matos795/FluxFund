import { httpClient } from "@/api/http-client"

export async function getUserOrganizationLogo(
  organizationId: string,
) {
  const response = await httpClient.get<Blob>(
    `/api/v1/user-organizations/${organizationId}/logo`,
    {
      responseType: "blob",
    },
  )

  return response.data
}