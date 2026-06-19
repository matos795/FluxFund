import { httpClient } from "@/api/http-client"
import type { PageResponse } from "@/types/page-response"
import type { AuditAction, AuditEntityType, AuditLog } from "./audit-log-types"

type GetAuditLogsParams = {
  page: number
  size: number
  actorUserId?: string
  entityType?: AuditEntityType
  entityId?: string
  action?: AuditAction
  startDate?: string
  endDate?: string
}

export async function getAuditLogs(params: GetAuditLogsParams) {
  const response = await httpClient.get<PageResponse<AuditLog>>(
    "/api/v1/audit-logs",
    {
      params: {
        ...params,
        sort: "createdAt,desc",
      },
    },
  )

  return response.data
}