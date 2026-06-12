import { httpClient } from "@/api/http-client"
import type { PageResponse } from "@/types/page-response"
import type {
  CreateCreditCardItemRequest,
  CreateCreditCardStatementRequest,
  CreditCardStatement,
  CreditCardStatementImportResponse,
  CreditCardStatementStatus,
  PayCreditCardStatementRequest,
} from "./credit-card-statement-types"
import type { FinancialTransaction } from "../financial-transactions/financial-transaction-types"

type GetCreditCardStatementsParams = {
  page?: number
  size?: number
  creditCardAccountId?: string
  status?: CreditCardStatementStatus
}

export async function getCreditCardStatements({
  page = 0,
  size = 10,
  creditCardAccountId,
  status,
}: GetCreditCardStatementsParams = {}) {
  const response = await httpClient.get<PageResponse<CreditCardStatement>>(
    "/api/v1/credit-card-statements",
    {
      params: {
        page,
        size,
        creditCardAccountId: creditCardAccountId || undefined,
        status: status || undefined,
      },
    },
  )

  return response.data
}

export async function createCreditCardStatement(
  data: CreateCreditCardStatementRequest,
) {
  const response = await httpClient.post<CreditCardStatement>(
    "/api/v1/credit-card-statements",
    data,
  )

  return response.data
}

export async function addCreditCardStatementItem(
  statementId: string,
  data: CreateCreditCardItemRequest,
) {
  const response = await httpClient.post<FinancialTransaction>(
    `/api/v1/credit-card-statements/${statementId}/items`,
    data,
  )

  return response.data
}

export async function payCreditCardStatement(
  statementId: string,
  data: PayCreditCardStatementRequest,
) {
  const response = await httpClient.post<CreditCardStatement>(
    `/api/v1/credit-card-statements/${statementId}/pay`,
    data,
  )

  return response.data
}

export async function cancelCreditCardStatement(statementId: string) {
  await httpClient.delete(`/api/v1/credit-card-statements/${statementId}`)
}

export async function importCreditCardStatementOfx({
  statementId,
  file,
}: {
  statementId: string
  file: File
}) {
  const formData = new FormData()
  formData.append("file", file)

  const response = await httpClient.post<CreditCardStatementImportResponse>(
    `/api/v1/credit-card-statements/${statementId}/import/ofx`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    },
  )

  return response.data
}