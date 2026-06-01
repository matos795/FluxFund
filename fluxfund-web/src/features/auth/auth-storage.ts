import type { AuthSession } from "./auth-types"

const AUTH_SESSION_KEY = "fluxfund.auth.session"

export function getStoredSession(): AuthSession | null {
  const rawSession = sessionStorage.getItem(AUTH_SESSION_KEY)

  if (!rawSession) {
    return null
  }

  try {
    return JSON.parse(rawSession) as AuthSession
  } catch {
    sessionStorage.removeItem(AUTH_SESSION_KEY)
    return null
  }
}

export function storeSession(session: AuthSession) {
  sessionStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session))
}

export function removeStoredSession() {
  sessionStorage.removeItem(AUTH_SESSION_KEY)
}