import axios from "axios"

import {
  getStoredSession,
  removeStoredSession,
} from "@/features/auth/auth-storage"

export const httpClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080",
})

httpClient.interceptors.request.use((config) => {
  const session = getStoredSession()

  if (session?.accessToken) {
    config.headers.Authorization = `Bearer ${session.accessToken}`
  }

  if (session?.activeOrganizationId) {
    config.headers["X-Organization-Id"] = session.activeOrganizationId
  }

  return config
})

httpClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status
    const requestUrl = error.config?.url

    const isLoginRequest = requestUrl === "/api/v1/auth/login"

    if (status === 401 && !isLoginRequest) {
      removeStoredSession()

      if (window.location.pathname !== "/login") {
        window.location.assign("/login")
      }
    }

    return Promise.reject(error)
  },
)