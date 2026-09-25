import {
    ArrowRight,
    CheckCircle2,
    Clock3,
    FileText,
    ShieldCheck,
} from "lucide-react"
import { useNavigate } from "react-router-dom"

import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { useLegalStatus } from "@/features/legal/hooks/use-legal-status"

export function LegalDocumentsSettingsCard() {
    const navigate = useNavigate()

    const statusQuery =
        useLegalStatus()

    const status =
        statusQuery.data

    const acceptedAtLabel =
        status?.acceptedAt
            ? formatAcceptedAt(
                status.acceptedAt,
            )
            : null

    return (
        <Card>
            <CardHeader>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex items-start gap-3">
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted">
                            <FileText className="size-5" />
                        </div>

                        <div>
                            <CardTitle>
                                Documentos legais
                            </CardTitle>

                            <CardDescription className="mt-1">
                                Consulte os documentos que regem seu uso do FluxFund.
                            </CardDescription>
                        </div>
                    </div>

                    {!statusQuery.isPending &&
                        !statusQuery.isError &&
                        status &&
                        !status.acceptanceRequired &&
                        acceptedAtLabel && (
                            <div className="flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700">
                                <CheckCircle2 className="size-3.5" />

                                Documentos confirmados
                            </div>
                        )}
                </div>
            </CardHeader>

            <CardContent>
                <div className="mb-5 grid gap-3 sm:grid-cols-2">
                    <div className="flex items-center gap-3 rounded-xl border p-4">
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                            <FileText className="size-4" />
                        </div>

                        <div className="min-w-0">
                            <p className="text-sm font-medium">
                                Termos de Uso
                            </p>

                            <p className="mt-0.5 text-xs text-muted-foreground">
                                {status
                                    ? `Versão ${status.termsVersion}`
                                    : "Condições de uso da plataforma"}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 rounded-xl border p-4">
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                            <ShieldCheck className="size-4" />
                        </div>

                        <div className="min-w-0">
                            <p className="text-sm font-medium">
                                Aviso de Privacidade
                            </p>

                            <p className="mt-0.5 text-xs text-muted-foreground">
                                {status
                                    ? `Versão ${status.privacyNoticeVersion}`
                                    : "Como tratamos informações"}
                            </p>
                        </div>
                    </div>
                </div>

                {statusQuery.isPending && (
                    <div className="mb-5 rounded-xl border bg-muted/30 p-4 text-sm text-muted-foreground">
                        Carregando registro dos documentos...
                    </div>
                )}

                {statusQuery.isError && (
                    <div className="mb-5 rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
                        Não foi possível consultar o registro dos documentos.
                    </div>
                )}

                {status &&
                    !statusQuery.isError && (
                        <div className="mb-5 rounded-xl border bg-muted/30 p-4">
                            {status.acceptanceRequired ? (
                                <div>
                                    <p className="text-sm font-medium">
                                        Aceite pendente
                                    </p>

                                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                                        Os documentos vigentes ainda não foram confirmados por este usuário.
                                    </p>
                                </div>
                            ) : (
                                <div className="flex items-start gap-3">
                                    <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-background">
                                        <Clock3 className="size-4" />
                                    </div>

                                    <div>
                                        <p className="text-sm font-medium">
                                            Registro do seu aceite
                                        </p>

                                        <p className="mt-1 text-xs leading-5 text-muted-foreground">
                                            Termos de Uso aceitos e ciência do Aviso de Privacidade registrada
                                            {acceptedAtLabel
                                                ? ` em ${acceptedAtLabel}.`
                                                : "."}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                <Button
                    variant="outline"
                    className="w-full justify-between"
                    onClick={() =>
                        navigate(
                            "/settings/legal",
                        )
                    }
                >
                    Consultar documentos

                    <ArrowRight className="size-4" />
                </Button>
            </CardContent>
        </Card>
    )
}

function formatAcceptedAt(
    acceptedAt: string,
) {
    return new Intl.DateTimeFormat(
        "pt-BR",
        {
            dateStyle: "short",
            timeStyle: "short",
        },
    ).format(
        new Date(acceptedAt),
    )
}