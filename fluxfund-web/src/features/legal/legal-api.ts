import { httpClient } from "@/api/http-client"

import type {
    AcceptLegalDocumentsRequest,
    LegalAcceptanceStatus,
    LegalDocumentsResponse,
} from "./legal-types"

export async function getLegalStatus() {
    const response =
        await httpClient.get<LegalAcceptanceStatus>(
            "/api/v1/legal/status",
        )

    return response.data
}

export async function getLegalDocuments() {
    const response =
        await httpClient.get<LegalDocumentsResponse>(
            "/api/v1/legal/documents",
        )

    return response.data
}

export async function acceptLegalDocuments(
    data: AcceptLegalDocumentsRequest,
) {
    const response =
        await httpClient.post<LegalAcceptanceStatus>(
            "/api/v1/legal/acceptance",
            data,
        )

    return response.data
}