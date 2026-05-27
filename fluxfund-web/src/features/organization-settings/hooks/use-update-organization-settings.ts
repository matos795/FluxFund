import { useMutation, useQueryClient } from "@tanstack/react-query"

import { updateOrganizationSettings } from "../organization-settings-api"
import type { UpdateOrganizationSettingsRequest } from "../organization-settings-types"

export function useUpdateOrganizationSettings() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: UpdateOrganizationSettingsRequest) =>
      updateOrganizationSettings(data),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["organization-settings"],
      })

      queryClient.invalidateQueries({
        queryKey: ["financial-transactions"],
      })

      queryClient.invalidateQueries({
        queryKey: ["funds"],
      })

      queryClient.invalidateQueries({
        queryKey: ["dashboard-summary"],
      })
    },
  })
}