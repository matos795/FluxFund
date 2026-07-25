import {
  useMutation,
  useQueryClient,
} from "@tanstack/react-query"

import { createPlatformOrganization } from "../platform-organization-api"
import type { CreatePlatformOrganizationRequest } from "../platform-organization-types"

export function useCreatePlatformOrganization() {
  const queryClient =
    useQueryClient()

  return useMutation({
    mutationFn: (
      data: CreatePlatformOrganizationRequest,
    ) =>
      createPlatformOrganization(data),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [
          "platform-organizations",
        ],
      })
    },
  })
}