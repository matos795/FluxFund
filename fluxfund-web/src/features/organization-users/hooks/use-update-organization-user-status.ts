import { useMutation, useQueryClient } from "@tanstack/react-query"

import { updateOrganizationUserStatus } from "../organization-user-api"
import type { UpdateOrganizationUserStatusRequest } from "../organization-user-types"

type UpdateOrganizationUserStatusVariables = {
  userId: string
  data: UpdateOrganizationUserStatusRequest
}

export function useUpdateOrganizationUserStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ userId, data }: UpdateOrganizationUserStatusVariables) =>
      updateOrganizationUserStatus(userId, data),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organization-users"] })
    },
  })
}