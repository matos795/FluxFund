import {
    useQuery,
} from "@tanstack/react-query"

import {
    getFinancialPartyOverview,
} from "../financial-party-api"

export function useFinancialPartyOverview(
    partyId:
        string | undefined,
) {
    return useQuery({
        queryKey: [
            "financial-parties-360",
            partyId,
        ],

        queryFn: () =>
            getFinancialPartyOverview(
                partyId!,
            ),

        enabled:
            Boolean(
                partyId,
            ),
    })
}