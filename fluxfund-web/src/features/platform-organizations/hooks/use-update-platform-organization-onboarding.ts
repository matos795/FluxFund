import {
  useMutation,
  useQueryClient,
} from "@tanstack/react-query"

import { updatePlatformOrganizationOnboarding } from "../platform-organization-onboarding-api"
import type { UpdatePlatformOrganizationOnboardingRequest } from "../platform-organization-onboarding-types"

type UpdatePlatformOrganizationOnboardingVariables = {
  organizationId: string
  data: UpdatePlatformOrganizationOnboardingRequest
}

export function useUpdatePlatformOrganizationOnboarding() {
  const queryClient =
    useQueryClient()

  return useMutation({
    mutationFn: ({
      organizationId,
      data,
    }: UpdatePlatformOrganizationOnboardingVariables) =>
      updatePlatformOrganizationOnboarding(
        organizationId,
        data,
      ),

    onSuccess: (
      response,
      variables,
    ) => {
      queryClient.setQueryData(
        [
          "platform-organization-onboarding",
          variables.organizationId,
        ],
        response,
      )
    },
  })
}