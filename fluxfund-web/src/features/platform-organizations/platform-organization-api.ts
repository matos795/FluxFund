import { httpClient } from "@/api/http-client"
import type { PageResponse } from "@/types/page-response"

import type {
    CreatePlatformOrganizationRequest,
    CreatePlatformOrganizationResponse,
    GetPlatformOrganizationsParams,
    PlatformOrganization,
    PlatformOrganizationDetails,
    UpdatePlatformOrganizationStatusRequest,
} from "./platform-organization-types"

export async function getPlatformOrganizations(
    params: GetPlatformOrganizationsParams,
) {
    const response = await httpClient.get<
        PageResponse<PlatformOrganization>
    >(
        "/api/v1/platform/organizations",
        {
            params: {
                page: params.page,
                size: params.size,

                query:
                    params.query?.trim() ||
                    undefined,
            },
        },
    )

    return response.data
}

export async function createPlatformOrganization(
    data: CreatePlatformOrganizationRequest,
) {
    const response = await httpClient.post<
        CreatePlatformOrganizationResponse
    >(
        "/api/v1/platform/organizations",
        data,
    )

    return response.data
}

export async function getPlatformOrganizationDetails(
    organizationId: string,
) {
    const response =
        await httpClient.get<PlatformOrganizationDetails>(
            `/api/v1/platform/organizations/${organizationId}`,
        )

    return response.data
}

export async function updatePlatformOrganizationStatus(
    organizationId: string,
    data: UpdatePlatformOrganizationStatusRequest,
) {
    const response =
        await httpClient.patch<PlatformOrganization>(
            `/api/v1/platform/organizations/${organizationId}/status`,
            data,
        )

    return response.data
}