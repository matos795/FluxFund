import { useMutation, useQueryClient } from "@tanstack/react-query"

import { useAuth } from "@/features/auth/hooks/use-auth"
import { updateOrganizationProfile } from "../organization-profile-api"
import type { UpdateOrganizationProfileRequest } from "../organization-profile-types"

export function useUpdateOrganizationProfile() {
  const queryClient = useQueryClient()
  const { refreshUser } = useAuth()

  return useMutation({
    mutationFn: (data: UpdateOrganizationProfileRequest) =>
      updateOrganizationProfile(data),

    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ["organization-profile"] })
      await refreshUser()
    },
  })
}
