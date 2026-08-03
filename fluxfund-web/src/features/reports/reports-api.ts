import { httpClient } from "@/api/http-client"
import type { AccountabilityByAccountReport, AccountabilityReport, AccountCashFlowReport, CategoryResultReport, FinancialCommitmentMonthlyReport, FundReport, GetFinancialCommitmentMonthlyReportParams, PendingItemsReport } from "./reports-types"

type GetCategoryResultReportParams = {
  startDate?: string
  endDate?: string
}

type GetFundReportParams = {
  startDate?: string
  endDate?: string
}

type GetAccountabilityReportParams = {
  startDate?: string
  endDate?: string
}

type GetAccountCashFlowReportParams = {
  startDate?: string
  endDate?: string
}

export const reportsApi = {

  async getCategoryResult(params: GetCategoryResultReportParams) {
    const response = await httpClient.get<CategoryResultReport>(
      "/api/v1/reports/category-result",
      {
        params,
      },
    )

    return response.data
  },

  async getFunds(params: GetFundReportParams) {
    const response = await httpClient.get<FundReport>(
      "/api/v1/reports/funds",
      {
        params,
      },
    )

    return response.data
  },

  async getAccountability(params: GetAccountabilityReportParams) {
    const response = await httpClient.get<AccountabilityReport>(
      "/api/v1/reports/accountability",
      {
        params,
      },
    )

    return response.data
  },

  async getAccountabilityByAccount(params: GetAccountabilityReportParams) {
    const response = await httpClient.get<AccountabilityByAccountReport>(
      "/api/v1/reports/accountability/by-account",
      {
        params,
      },
    )

    return response.data
  },

  async exportAccountabilityExcel(params: GetAccountabilityReportParams) {
    const response = await httpClient.get<Blob>(
      "/api/v1/reports/accountability/export.xlsx",
      {
        params,
        responseType: "blob",
      },
    )

    return response.data
  },

  async exportAccountabilityPdf(params: GetAccountabilityReportParams) {
    const response = await httpClient.get<Blob>(
      "/api/v1/reports/accountability/export.pdf",
      {
        params,
        responseType: "blob",
      },
    )

    return response.data
  },

  async exportSettledExpensePdf(
    params: GetCategoryResultReportParams,
  ) {
    const response = await httpClient.get<Blob>(
      "/api/v1/reports/settled-expenses/export.pdf",
      {
        params,
        responseType: "blob",
      },
    )

    return response.data
  },

  async exportSettledIncomePdf(
    params: GetCategoryResultReportParams,
  ) {
    const response = await httpClient.get<Blob>(
      "/api/v1/reports/settled-incomes/export.pdf",
      {
        params,
        responseType: "blob",
      },
    )

    return response.data
  },

  async exportFundMovementPdf(params: {
    startDate?: string
    endDate?: string
  }) {
    const response = await httpClient.get<Blob>(
      "/api/v1/reports/fund-movement/export.pdf",
      {
        params,
        responseType: "blob",
      },
    )

    return response.data
  },

  async exportAccountMovementPdf(params: {
    accountId: string
    startDate?: string
    endDate?: string
  }) {
    const response = await httpClient.get<Blob>(
      "/api/v1/reports/account-movement/export.pdf",
      {
        params,
        responseType: "blob",
      },
    )

    return response.data
  },

  async exportCreditCardStatementPdf(statementId: string) {
    const response = await httpClient.get<Blob>(
      `/api/v1/reports/credit-card-statements/${statementId}/export.pdf`,
      {
        responseType: "blob",
      },
    )

    return response.data
  },

  async getPendingItems({ limit = 10 }: { limit?: number } = {}) {
    const response = await httpClient.get<PendingItemsReport>(
      "/api/v1/reports/pending-items",
      {
        params: {
          limit,
        },
      },
    )

    return response.data
  },

  async getAccountCashFlow(params: GetAccountCashFlowReportParams) {
    const response = await httpClient.get<AccountCashFlowReport>(
      "/api/v1/reports/account-cash-flow",
      {
        params,
      },
    )

    return response.data
  },

  async getFinancialCommitmentMonthly({
    referenceMonth,
    direction,
    partyId,
    designatedRecipientId,
    fundId,
  }: GetFinancialCommitmentMonthlyReportParams) {
    const response =
      await httpClient.get<
        FinancialCommitmentMonthlyReport
      >(
        "/api/v1/reports/financial-commitments/monthly",
        {
          params: {
            referenceMonth:
              `${referenceMonth}-01`,

            direction,

            partyId:
              partyId ||
              undefined,

            designatedRecipientId:
              designatedRecipientId ||
              undefined,

            fundId:
              fundId ||
              undefined,
          },
        },
      )

    return response.data
  },
}