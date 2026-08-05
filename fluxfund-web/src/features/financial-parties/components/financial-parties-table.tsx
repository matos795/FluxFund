import { Badge } from "@/components/ui/badge"

import {
    Card,
    CardContent,
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

import {
    financialPartyClassificationLabels,
    financialPartyRoleLabels,
    financialPartyTypeLabels,
    formatFinancialPartyDocument,
} from "../financial-party-labels"

import type {
    FinancialParty,
} from "../financial-party-types"
import { FinancialPartyActions } from "./financial-party-actions"
import { Link } from "react-router-dom"

type FinancialPartiesTableProps = {
    financialParties: FinancialParty[]
}

export function FinancialPartiesTable({
    financialParties,
}: FinancialPartiesTableProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>
                    Contatos cadastrados
                </CardTitle>
            </CardHeader>

            <CardContent>
                {financialParties.length === 0 ? (
                    <div className="flex h-48 items-center justify-center rounded-lg border border-dashed">
                        <p className="text-sm text-muted-foreground">
                            Nenhum contato encontrado com os filtros selecionados.
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>
                                        Contato
                                    </TableHead>

                                    <TableHead>
                                        Natureza
                                    </TableHead>

                                    <TableHead>
                                        Classificação
                                    </TableHead>

                                    <TableHead>
                                        Papéis
                                    </TableHead>

                                    <TableHead>
                                        Telefone e e-mail
                                    </TableHead>

                                    <TableHead>
                                        Documento
                                    </TableHead>

                                    <TableHead>
                                        Status
                                    </TableHead>

                                    <TableHead className="w-12">
                                        <span className="sr-only">
                                            Ações
                                        </span>
                                    </TableHead>
                                </TableRow>
                            </TableHeader>

                            <TableBody>
                                {financialParties.map(
                                    (financialParty) => (
                                        <TableRow
                                            key={financialParty.id}
                                        >
                                            <TableCell>
                                                <div className="min-w-48">
                                                    <Link
                                                        to={`/financial-parties/${financialParty.id}`}
                                                        className="font-medium hover:underline"
                                                    >
                                                        {financialParty.name}
                                                    </Link>

                                                    {financialParty.legalName &&
                                                        financialParty.legalName !==
                                                        financialParty.name && (
                                                            <p className="mt-0.5 text-xs text-muted-foreground">
                                                                {
                                                                    financialParty.legalName
                                                                }
                                                            </p>
                                                        )}

                                                    {financialParty.contactPerson && (
                                                        <p className="mt-0.5 text-xs text-muted-foreground">
                                                            Contato:{" "}
                                                            {
                                                                financialParty.contactPerson
                                                            }
                                                        </p>
                                                    )}
                                                </div>
                                            </TableCell>

                                            <TableCell>
                                                <Badge variant="outline">
                                                    {
                                                        financialPartyTypeLabels[
                                                        financialParty.partyType
                                                        ]
                                                    }
                                                </Badge>
                                            </TableCell>

                                            <TableCell>
                                                {
                                                    financialPartyClassificationLabels[
                                                    financialParty.type
                                                    ]
                                                }
                                            </TableCell>

                                            <TableCell>
                                                <div className="flex min-w-52 flex-wrap gap-1">
                                                    {[
                                                        ...financialParty.roles,
                                                    ]
                                                        .sort()
                                                        .map((role) => (
                                                            <Badge
                                                                key={role}
                                                                variant="secondary"
                                                            >
                                                                {
                                                                    financialPartyRoleLabels[
                                                                    role
                                                                    ]
                                                                }
                                                            </Badge>
                                                        ))}
                                                </div>
                                            </TableCell>

                                            <TableCell>
                                                <div className="min-w-48 space-y-1 text-sm">
                                                    <p>
                                                        {financialParty.phone ??
                                                            "-"}
                                                    </p>

                                                    <p className="text-xs text-muted-foreground">
                                                        {financialParty.email ??
                                                            "Sem e-mail"}
                                                    </p>
                                                </div>
                                            </TableCell>

                                            <TableCell>
                                                {formatFinancialPartyDocument(
                                                    financialParty.document,
                                                    financialParty.partyType,
                                                )}
                                            </TableCell>

                                            <TableCell>
                                                {financialParty.active ? (
                                                    <Badge>
                                                        Ativo
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="secondary">
                                                        Inativo
                                                    </Badge>
                                                )}
                                            </TableCell>

                                            <TableCell className="text-right">
                                                <FinancialPartyActions
                                                    financialParty={financialParty}
                                                />
                                            </TableCell>
                                        </TableRow>
                                    ),
                                )}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}