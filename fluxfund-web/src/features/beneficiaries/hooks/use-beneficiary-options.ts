import { useQuery } from "@tanstack/react-query"

import { getBeneficiaryOptions } from "../beneficiary-api"

export function useBeneficiaryOptions() {
  return useQuery({
    queryKey: ["beneficiary-options"],
    queryFn: getBeneficiaryOptions,
  })
}