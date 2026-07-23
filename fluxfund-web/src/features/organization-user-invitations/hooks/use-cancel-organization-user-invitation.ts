import { useMutation, useQueryClient } from "@tanstack/react-query"

import { cancelOrganizationUserInvitation } from "../organization-user-invitation-api"

export function useCancelOrganizationUserInvitation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (invitationId: string) =>
      cancelOrganizationUserInvitation(invitationId),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["organization-user-invitations"],
      })
    },
  })
}