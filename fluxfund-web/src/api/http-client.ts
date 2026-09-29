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

    const errorName = error.response?.data?.error

    const requiresLegalAcceptance = status === 403 && errorName === "Legal Acceptance Required"

    const isLoginRequest = requestUrl === "/api/v1/auth/login"

    if (status === 401 && !isLoginRequest) {
      removeStoredSession()

      if (window.location.pathname !== "/login") {
        window.location.assign("/login")
      }
    }

    if (requiresLegalAcceptance && !requestUrl?.startsWith("/api/v1/legal/",) && window.location.pathname !== "/legal/acceptance") {
      window.location.assign("/legal/acceptance")
    }

    return Promise.reject(error)
  },
)