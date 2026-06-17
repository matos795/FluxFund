import { useMutation } from "@tanstack/react-query"

import { changePassword } from "../profile-api"
import type { ChangePasswordRequest } from "../profile-types"

export function useChangePassword() {
  return useMutation({
    mutationFn: (data: ChangePasswordRequest) => changePassword(data),
  })
}
