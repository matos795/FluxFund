import type {
  QueryClient,
} from "@tanstack/react-query"

export async function invalidateFinancialCommitments(
  queryClient:
    QueryClient,
) {
  await Promise.all([
    queryClient.invalidateQueries({
      queryKey: [
        "financial-commitments",
      ],
    }),

    /*
     * Um PAYABLE + SUPPORT criado pela
     * API nova também pertence à tela
     * antiga de sustento.
     */
    queryClient.invalidateQueries({
      queryKey: [
        "support-agreements",
      ],
    }),

    queryClient.invalidateQueries({
      queryKey: [
        "support-agreement-suggestions",
      ],
    }),
  ])
}