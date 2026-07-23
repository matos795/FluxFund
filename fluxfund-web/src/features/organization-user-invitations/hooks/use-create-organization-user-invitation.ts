import { useMutation, useQueryClient } from "@tanstack/react-query"

import { createOrganizationUserInvitation } from "../organization-user-invitation-api"
import type { CreateOrganizationUserInvitationRequest } from "../organization-user-invitation-types"

export function useCreateOrganizationUserInvitation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (
      data: CreateOrganizationUserInvitationRequest,
    ) => createOrganizationUserInvitation(data),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["organization-user-invitations"],
      })
    },
  })
}