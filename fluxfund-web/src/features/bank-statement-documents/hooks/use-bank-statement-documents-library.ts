import {
    useQuery,
} from "@tanstack/react-query"

import {
    getBankStatementDocumentsLibrary,
} from "../bank-statement-document-api"

import type {
    GetBankStatementDocumentsLibraryParams,
} from "../bank-statement-document-types"

export function useBankStatementDocumentsLibrary(
    params:
        GetBankStatementDocumentsLibraryParams,
) {

    return useQuery({
        queryKey: [
            "bank-statement-documents-library",
            params,
        ],

        queryFn: () =>
            getBankStatementDocumentsLibrary(
                params,
            ),
    })
}