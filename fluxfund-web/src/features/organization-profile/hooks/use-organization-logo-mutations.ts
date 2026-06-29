import { useMutation, useQueryClient } from "@tanstack/react-query"

import type { OrganizationProfile } from "../organization-profile-types"
import {
  deleteOrganizationLogo,
  uploadOrganizationLogo,
} from "../organization-profile-api"
import { organizationLogoQueryKey } from "./use-organization-logo"
import { organizationProfileQueryKey } from "./use-organization-profile"

export function useUploadOrganizationLogo() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: uploadOrganizationLogo,

    onSuccess: (organizationProfile) => {
      queryClient.setQueryData<OrganizationProfile>(
        organizationProfileQueryKey,
        organizationProfile,
      )

      queryClient.invalidateQueries({
        queryKey: organizationLogoQueryKey,
      })
    },
  })
}

export function useDeleteOrganizationLogo() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteOrganizationLogo,

    onSuccess: () => {
      queryClient.setQueryData<OrganizationProfile | undefined>(
        organizationProfileQueryKey,
        (currentProfile) => {
          if (!currentProfile) {
            return currentProfile
          }

          return {
            ...currentProfile,
            logo: null,
          }
        },
      )

      queryClient.removeQueries({
        queryKey: organizationLogoQueryKey,
      })
    },
  })
}