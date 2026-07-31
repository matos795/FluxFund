import {
  useMutation,
  useQueryClient,
} from "@tanstack/react-query"

import {
  createFinancialParty,
} from "../financial-party-api"

import type {
  CreateFinancialPartyRequest,
  FinancialPartyOption,
} from "../financial-party-types"

export function useCreateFinancialParty() {
  const queryClient =
    useQueryClient()

  return useMutation({
    mutationFn: (
      data:
        CreateFinancialPartyRequest,
    ) =>
      createFinancialParty(data),

    onSuccess: (
      financialParty,
    ) => {
      const option:
        FinancialPartyOption = {
        id:
          financialParty.id,

        label:
          financialParty.name,

        partyType:
          financialParty.partyType,

        classification:
          financialParty.type,

        roles:
          financialParty.roles,

        document:
          financialParty.document,
      }

      const optionCacheKeys = [
        "ALL",
        ...financialParty.roles,
      ]

      for (
        const roleKey
        of optionCacheKeys
      ) {
        queryClient.setQueryData<
          FinancialPartyOption[]
        >(
          [
            "financial-party-options",
            roleKey,
          ],

          (
            currentOptions = [],
          ) => {
            const optionsWithoutDuplicate =
              currentOptions.filter(
                (currentOption) =>
                  currentOption.id !==
                  option.id,
              )

            return [
              ...optionsWithoutDuplicate,
              option,
            ].sort(
              (
                firstOption,
                secondOption,
              ) =>
                firstOption.label
                  .localeCompare(
                    secondOption.label,
                    "pt-BR",
                  ),
            )
          },
        )
      }

      queryClient.invalidateQueries({
        queryKey:
          ["financial-parties"],
      })

      queryClient.invalidateQueries({
        queryKey:
          ["beneficiaries"],
      })

      queryClient.invalidateQueries({
        queryKey:
          ["beneficiary-options"],
      })

      queryClient.invalidateQueries({
        queryKey:
          ["financial-party-options"],
      })
    },
  })
}