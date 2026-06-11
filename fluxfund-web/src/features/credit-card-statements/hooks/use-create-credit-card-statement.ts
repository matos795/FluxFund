import { useMutation, useQueryClient } from "@tanstack/react-query"

import { createCreditCardStatement } from "../credit-card-statement-api"
import type { CreateCreditCardStatementRequest } from "../credit-card-statement-types"

export function useCreateCreditCardStatement() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateCreditCardStatementRequest) =>
      createCreditCardStatement(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["credit-card-statements"] })
    },
  })
}
