import { useQuery } from "@tanstack/react-query"
import { getAuditLogs } from "../audit-log-api"
import type { AuditAction, AuditEntityType } from "../audit-log-types"

type UseAuditLogsParams = {
  page: number
  size: number
  actorUserId?: string
  entityType?: AuditEntityType
  entityId?: string
  action?: AuditAction
  startDate?: string
  endDate?: string
}

export function useAuditLogs(params: UseAuditLogsParams) {
  return useQuery({
    queryKey: ["audit-logs", params],
    queryFn: () => getAuditLogs(params),
  })
}