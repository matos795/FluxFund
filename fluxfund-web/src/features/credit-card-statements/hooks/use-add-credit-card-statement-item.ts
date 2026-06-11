import { useMutation, useQueryClient } from "@tanstack/react-query"

import { addCreditCardStatementItem } from "../credit-card-statement-api"
import type { CreateCreditCardItemRequest } from "../credit-card-statement-types"
import { invalidateFinancialData } from "@/features/financial-transactions/hooks/invalidate-financial-data"

type AddCreditCardStatementItemMutationData = {
  statementId: string
  data: CreateCreditCardItemRequest
}

export function useAddCreditCardStatementItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ statementId, data }: AddCreditCardStatementItemMutationData) =>
      addCreditCardStatementItem(statementId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["credit-card-statements"] })
      invalidateFinancialData(queryClient)
    },
  })
}
