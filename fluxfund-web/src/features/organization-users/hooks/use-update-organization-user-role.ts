import { useMutation, useQueryClient } from "@tanstack/react-query"

import { updateOrganizationUserRole } from "../organization-user-api"
import type { UpdateOrganizationUserRoleRequest } from "../organization-user-types"

type UpdateOrganizationUserRoleVariables = {
  userId: string
  data: UpdateOrganizationUserRoleRequest
}

export function useUpdateOrganizationUserRole() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ userId, data }: UpdateOrganizationUserRoleVariables) =>
      updateOrganizationUserRole(userId, data),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organization-users"] })
    },
  })
}