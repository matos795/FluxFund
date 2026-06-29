import { useQuery } from "@tanstack/react-query"

import { downloadOrganizationLogo } from "../organization-profile-api"

export const organizationLogoQueryKey = [
  "organization-logo",
] as const

export function useOrganizationLogo(hasLogo: boolean) {
  return useQuery({
    queryKey: organizationLogoQueryKey,
    queryFn: async () => {
      const blob = await downloadOrganizationLogo()

      return readBlobAsDataUrl(blob)
    },
    enabled: hasLogo,
    staleTime: Infinity,
  })
}

function readBlobAsDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result)
        return
      }

      reject(new Error("Não foi possível carregar a logo."))
    }

    reader.onerror = () => {
      reject(new Error("Não foi possível carregar a logo."))
    }

    reader.readAsDataURL(blob)
  })
}