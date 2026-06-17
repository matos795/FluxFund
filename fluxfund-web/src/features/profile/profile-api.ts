import { httpClient } from "@/api/http-client"

import type {
  ChangePasswordRequest,
  Profile,
  UpdateProfileRequest,
} from "./profile-types"

export async function getProfile() {
  const response = await httpClient.get<Profile>("/api/v1/profile")

  return response.data
}

export async function updateProfile(data: UpdateProfileRequest) {
  const response = await httpClient.put<Profile>("/api/v1/profile", data)

  return response.data
}

export async function changePassword(data: ChangePasswordRequest) {
  await httpClient.put("/api/v1/profile/password", data)
}
