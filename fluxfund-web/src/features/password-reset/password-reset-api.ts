import { httpClient } from "@/api/http-client"

import type {
  RequestPasswordResetRequest,
  ResetPasswordRequest,
} from "./password-reset-types"

export async function requestPasswordReset(
  data: RequestPasswordResetRequest,
) {
  await httpClient.post(
    "/api/v1/public/password-reset/request",
    data,
  )
}

export async function resetPassword(
  data: ResetPasswordRequest,
) {
  await httpClient.post(
    "/api/v1/public/password-reset/confirm",
    data,
  )
}