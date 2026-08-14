import {
    httpClient,
} from "@/api/http-client"

import type {
    PageResponse,
} from "@/types/page-response"
import type { BankStatementDocument, GetBankStatementDocumentsLibraryParams } from "./bank-statement-document-types"

export async function getBankStatementDocumentsLibrary({
    page = 0,
    size = 12,
    accountId,
    periodStartDate,
    periodEndDate,
    filename,
}: GetBankStatementDocumentsLibraryParams) {
    const response =
        await httpClient.get<
            PageResponse<BankStatementDocument>
        >(
            "/api/v1/bank-statement-documents/library",
            {
                params: {
                    page,
                    size,
                    accountId,
                    periodStartDate,
                    periodEndDate,
                    filename,
                },
            },
        )

    return response.data
}

export async function uploadBankStatementDocument({
    accountId,
    periodStartDate,
    periodEndDate,
    file,
}: {
    accountId: string
    periodStartDate: string
    periodEndDate: string
    file: File
}) {

    const formData =
        new FormData()

    formData.append(
        "accountId",
        accountId,
    )

    formData.append(
        "periodStartDate",
        periodStartDate,
    )

    formData.append(
        "periodEndDate",
        periodEndDate,
    )

    formData.append(
        "file",
        file,
    )

    const response =
        await httpClient.post<
            BankStatementDocument
        >(
            "/api/v1/bank-statement-documents",
            formData,
        )

    return response.data
}

export async function deleteBankStatementDocument(
    documentId:
        string,
) {

    await httpClient.delete(
        `/api/v1/bank-statement-documents/${documentId}`,
    )
}

export async function downloadBankStatementDocument(
    documentId:
        string,
) {

    const response =
        await httpClient.get<Blob>(
            `/api/v1/bank-statement-documents/${documentId}/download`,
            {
                responseType:
                    "blob",
            },
        )

    return response.data
}