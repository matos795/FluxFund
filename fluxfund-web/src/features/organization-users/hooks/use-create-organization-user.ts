import { useMutation, useQueryClient } from "@tanstack/react-query"

import { createOrganizationUser } from "../organization-user-api"
import type { CreateOrganizationUserRequest } from "../organization-user-types"

export function useCreateOrganizationUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateOrganizationUserRequest) =>
      createOrganizationUser(data),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organization-users"] })
    },
  })
}