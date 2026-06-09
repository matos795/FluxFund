import axios from "axios"

type ApiErrorResponse = {
  message?: string
  error?: string
  detail?: string
  title?: string
  errors?: string[] | Record<string, string>
}

export function getApiErrorMessage(
  error: unknown,
  fallback = "Ocorreu um erro inesperado.",
) {
  if (axios.isAxiosError(error)) {
    const responseData = error.response?.data

    if (typeof responseData === "string") {
      return responseData.trim().length > 0 ? responseData : fallback
    }

    const data = responseData as ApiErrorResponse | undefined

    if (Array.isArray(data?.errors) && data.errors.length > 0) {
      return data.errors.join(", ")
    }

    if (data?.errors && typeof data.errors === "object") {
      return Object.values(data.errors).join(", ")
    }

    return (
      data?.message ||
      data?.detail ||
      data?.error ||
      data?.title ||
      fallback
    )
  }

  if (error instanceof Error) {
    return error.message || fallback
  }

  return fallback
}