import {
  useMutation,
  useQueryClient,
} from "@tanstack/react-query"

import { updatePlatformOrganizationStatus } from "../platform-organization-api"
import type { UpdatePlatformOrganizationStatusRequest } from "../platform-organization-types"

type UpdatePlatformOrganizationStatusVariables = {
  organizationId: string
  data: UpdatePlatformOrganizationStatusRequest
}

export function useUpdatePlatformOrganizationStatus() {
  const queryClient =
    useQueryClient()

  return useMutation({
    mutationFn: ({
      organizationId,
      data,
    }: UpdatePlatformOrganizationStatusVariables) =>
      updatePlatformOrganizationStatus(
        organizationId,
        data,
      ),

    onSuccess: (
      _response,
      variables,
    ) => {
      queryClient.invalidateQueries({
        queryKey: [
          "platform-organizations",
        ],
      })

      queryClient.invalidateQueries({
        queryKey: [
          "platform-organization",
          variables.organizationId,
        ],
      })
    },
  })
}