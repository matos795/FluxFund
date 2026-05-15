import { useQuery } from "@tanstack/react-query"
import { getBeneficiaries } from "../beneficiary-api"

type UseBeneficiariesParams = {
  page: number
  size: number
}

export function useBeneficiaries({ page, size }: UseBeneficiariesParams) {
  return useQuery({
    queryKey: ["beneficiaries", { page, size }],
    queryFn: () =>
      getBeneficiaries({
        page,
        size,
      }),
  })
}