import { useMutation, useQueryClient } from "@tanstack/react-query"

import { useAuth } from "@/features/auth/hooks/use-auth"

import { updateOrganizationProfile } from "../organization-profile-api"
import type {
  OrganizationProfile,
  UpdateOrganizationProfileRequest,
} from "../organization-profile-types"
import { organizationProfileQueryKey } from "./use-organization-profile"

export function useUpdateOrganizationProfile() {
  const queryClient = useQueryClient()
  const { refreshUser } = useAuth()

  return useMutation({
    mutationFn: (data: UpdateOrganizationProfileRequest) =>
      updateOrganizationProfile(data),

    onSuccess: async (organizationProfile) => {
      queryClient.setQueryData<OrganizationProfile>(
        organizationProfileQueryKey,
        organizationProfile,
      )

      await refreshUser()
    },
  })
}