import { useMutation } from "@tanstack/react-query"

import { resetPassword } from "../password-reset-api"

export function useResetPassword() {
  return useMutation({
    mutationFn: resetPassword,
  })
}