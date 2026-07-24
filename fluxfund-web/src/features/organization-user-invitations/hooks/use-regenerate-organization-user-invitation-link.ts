import {
  useMutation,
  useQueryClient,
} from "@tanstack/react-query"

import { regenerateOrganizationUserInvitationLink } from "../organization-user-invitation-api"

export function useRegenerateOrganizationUserInvitationLink() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (invitationId: string) =>
      regenerateOrganizationUserInvitationLink(
        invitationId,
      ),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [
          "organization-user-invitations",
        ],
      })
    },
  })
}