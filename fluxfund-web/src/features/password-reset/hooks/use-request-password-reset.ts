import { useMutation } from "@tanstack/react-query"

import { requestPasswordReset } from "../password-reset-api"

export function useRequestPasswordReset() {
  return useMutation({
    mutationFn: requestPasswordReset,
  })
}