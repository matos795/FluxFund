import { useMutation, useQueryClient } from "@tanstack/react-query"

import { useAuth } from "@/features/auth/hooks/use-auth"
import { updateProfile } from "../profile-api"
import type { UpdateProfileRequest } from "../profile-types"

export function useUpdateProfile() {
  const queryClient = useQueryClient()
  const { refreshUser } = useAuth()

  return useMutation({
    mutationFn: (data: UpdateProfileRequest) => updateProfile(data),

    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] })
      await refreshUser()
    },
  })
}
