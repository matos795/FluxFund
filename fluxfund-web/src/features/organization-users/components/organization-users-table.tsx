import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatDate } from "@/utils/formatters"
import { organizationRoleLabels } from "../organization-user-labels"
import type { OrganizationUser } from "../organization-user-types"
import { OrganizationUserActions } from "./organization-user-actions"
import { useAuth } from "@/features/auth"

type OrganizationUsersTableProps = {
  users: OrganizationUser[]
}

export function OrganizationUsersTable({
  users,
}: OrganizationUsersTableProps) {
  const { session } = useAuth()

  return (
    <Card>
      <CardHeader>
        <CardTitle>Usuários da organização</CardTitle>
        <CardDescription>
          Gerencie quem pode acessar esta organização e quais permissões cada
          pessoa possui.
        </CardDescription>
      </CardHeader>

      <CardContent>
        {users.length === 0 ? (
          <div className="flex h-40 items-center justify-center rounded-lg border border-dashed">
            <p className="text-sm text-muted-foreground">
              Nenhum usuário vinculado à organização.
            </p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Papel</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Criado em</TableHead>
                  <TableHead className="w-[60px]" />
                </TableRow>
              </TableHeader>

              <TableBody>
                {users.map((user) => {
                  const isCurrentUser =
                    session?.user.id === user.userId

                  return (
                    <TableRow
                      key={user.userId}
                      className={
                        user.active
                          ? undefined
                          : "bg-muted/20"
                      }
                    >
                      <TableCell>
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">
                              {user.name}
                            </span>

                            {isCurrentUser && (
                              <Badge
                                variant="outline"
                                className="px-1.5 py-0 text-[10px]"
                              >
                                Você
                              </Badge>
                            )}
                          </div>

                          <span className="text-xs text-muted-foreground">
                            {user.email}
                          </span>
                        </div>
                      </TableCell>

                      <TableCell>
                        {organizationRoleLabels[user.role]}
                      </TableCell>

                      <TableCell>
                        {user.active ? (
                          <Badge>Ativo</Badge>
                        ) : (
                          <Badge variant="secondary">Inativo</Badge>
                        )}
                      </TableCell>

                      <TableCell>{formatDate(user.createdAt.slice(0, 10))}</TableCell>

                      <TableCell>
                        <OrganizationUserActions organizationUser={user} />
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}