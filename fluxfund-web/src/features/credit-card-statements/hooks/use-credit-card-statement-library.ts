import {
    useQuery,
} from "@tanstack/react-query"

import {
    getCreditCardStatementLibrary,
} from "../credit-card-statement-api"

import type {
    GetCreditCardStatementLibraryParams,
} from "../credit-card-statement-types"

export function useCreditCardStatementLibrary(
    params:
        GetCreditCardStatementLibraryParams,
) {
    return useQuery({
        queryKey: [
            "credit-card-statement-document-library",
            params,
        ],

        queryFn: () =>
            getCreditCardStatementLibrary(
                params,
            ),
    })
}