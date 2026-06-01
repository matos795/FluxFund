import { httpClient } from "@/api/http-client"

import type {
  AuthenticatedUser,
  LoginRequest,
  LoginResponse,
} from "./auth-types"

export async function login(data: LoginRequest) {
  const response = await httpClient.post<LoginResponse>(
    "/api/v1/auth/login",
    data,
  )

  return response.data
}

export async function getAuthenticatedUser() {
  const response = await httpClient.get<AuthenticatedUser>("/api/v1/auth/me")

  return response.data
}