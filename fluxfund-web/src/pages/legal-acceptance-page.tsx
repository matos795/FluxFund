import { useState } from "react"
import {
    Navigate,
    useNavigate,
} from "react-router-dom"

import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { useAuth } from "@/features/auth/hooks/use-auth"
import { useAcceptLegalDocuments } from "@/features/legal/hooks/use-accept-legal-documents"
import { useLegalDocuments } from "@/features/legal/hooks/use-legal-documents"
import { useLegalStatus } from "@/features/legal/hooks/use-legal-status"
import { ArrowRight, CheckCircle2, LockKeyhole, LogOut, ShieldCheck } from "lucide-react"
import { LegalDocumentsPanel } from "@/features/legal/components/legal-documents-panel"

export function LegalAcceptancePage() {
    const navigate = useNavigate()

    const {
        session,
        logout,
    } = useAuth()

    const statusQuery =
        useLegalStatus()

    const enforcementEnabled =
        statusQuery.data?.enforcementEnabled === true

    const documentsQuery =
        useLegalDocuments(
            enforcementEnabled,
        )

    const acceptMutation =
        useAcceptLegalDocuments()

    const [
        termsAccepted,
        setTermsAccepted,
    ] = useState(false)

    const [
        privacyAcknowledged,
        setPrivacyAcknowledged,
    ] = useState(false)

    if (statusQuery.isPending) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-muted/40">
                <p className="text-sm text-muted-foreground">
                    Verificando os termos de acesso...
                </p>
            </main>
        )
    }

    if (
        statusQuery.isError ||
        !statusQuery.data
    ) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
                <Card className="w-full max-w-md">
                    <CardHeader>
                        <CardTitle>
                            Não foi possível verificar seu acesso
                        </CardTitle>

                        <CardDescription>
                            Tente novamente antes de continuar.
                        </CardDescription>
                    </CardHeader>

                    <CardContent>
                        <Button
                            className="w-full"
                            onClick={() =>
                                statusQuery.refetch()
                            }
                        >
                            Tentar novamente
                        </Button>
                    </CardContent>
                </Card>
            </main>
        )
    }

    if (
        !statusQuery.data
            .enforcementEnabled
    ) {
        return (
            <Navigate
                to={resolveNextPath(session)}
                replace
            />
        )
    }

    if (
        !statusQuery.data
            .acceptanceRequired
    ) {
        return (
            <Navigate
                to={resolveNextPath(session)}
                replace
            />
        )
    }

    if (documentsQuery.isPending) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-muted/40">
                <p className="text-sm text-muted-foreground">
                    Carregando documentos...
                </p>
            </main>
        )
    }

    if (
        documentsQuery.isError ||
        !documentsQuery.data
    ) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
                <Card className="w-full max-w-md">
                    <CardHeader>
                        <CardTitle>
                            Não foi possível carregar os documentos
                        </CardTitle>

                        <CardDescription>
                            Tente novamente antes de continuar.
                        </CardDescription>
                    </CardHeader>

                    <CardContent>
                        <Button
                            className="w-full"
                            onClick={() =>
                                documentsQuery.refetch()
                            }
                        >
                            Tentar novamente
                        </Button>
                    </CardContent>
                </Card>
            </main>
        )
    }

    if (
        statusQuery.data &&
        !statusQuery.data
            .acceptanceRequired
    ) {
        return (
            <Navigate
                to={resolveNextPath(session)}
                replace
            />
        )
    }

    const {
        terms,
        privacyNotice,
    } = documentsQuery.data

    async function handleAccept() {
        await acceptMutation.mutateAsync({
            termsAccepted,
            privacyNoticeAcknowledged:
                privacyAcknowledged,
        })

        navigate(
            resolveNextPath(session),
            {
                replace: true,
            },
        )
    }

    function handleLogout() {
        logout()

        navigate(
            "/login",
            {
                replace: true,
            },
        )
    }

    const canAccept =
        termsAccepted &&
        privacyAcknowledged &&
        !acceptMutation.isPending

    return (
        <main className="min-h-screen bg-[#fafafa]">
            <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 sm:py-10">

                {/* Topo */}
                <header className="mb-12 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="flex size-9 items-center justify-center rounded-xl bg-foreground text-sm font-semibold text-background">
                            F
                        </div>

                        <div>
                            <p className="font-semibold leading-none">
                                FluxFund
                            </p>

                            <p className="mt-1 text-xs text-muted-foreground">
                                Gestão financeira
                            </p>
                        </div>
                    </div>

                    <div className="hidden items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 sm:inline-flex">
                        <CheckCircle2 className="size-3.5" />
                        Última etapa antes de entrar
                    </div>

                    <Button
                        variant="outline"
                        size="sm"
                        className="
        gap-2 rounded-full bg-background shadow-sm
        hover:border-destructive/30
        hover:bg-destructive/5
        hover:text-destructive
    "
                        onClick={handleLogout}
                    >
                        <LogOut className="size-4" />
                        Sair
                    </Button>
                </header>

                {/* Hero */}
                <section className="mx-auto mb-10 max-w-3xl text-center">

                    <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                        Antes de continuar no FluxFund
                    </h1>

                    <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-muted-foreground">
                        Reserve um momento para conhecer os documentos que
                        orientam o uso da plataforma e explicam como tratamos
                        suas informações.
                    </p>
                </section>

                {/* Documento */}
                <LegalDocumentsPanel
                    terms={terms}
                    privacyNotice={privacyNotice}
                    footer={
                        <div className="mx-auto max-w-3xl">

                            <div className="mb-5 flex items-start gap-3">
                                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                                    <LockKeyhole className="size-4" />
                                </div>

                                <div>
                                    <h2 className="font-semibold">
                                        Tudo certo?
                                    </h2>

                                    <p className="mt-1 text-sm text-muted-foreground">
                                        Confirme a leitura dos documentos para acessar sua conta.
                                    </p>
                                </div>
                            </div>

                            <div className="grid gap-3 sm:grid-cols-2">

                                <label
                                    htmlFor="termsAccepted"
                                    className="
                        flex cursor-pointer items-start gap-3
                        rounded-xl border p-4
                        transition-all
                        hover:border-foreground/20
                        hover:bg-muted/30
                    "
                                >
                                    <Checkbox
                                        id="termsAccepted"
                                        checked={termsAccepted}
                                        onCheckedChange={(checked) =>
                                            setTermsAccepted(
                                                checked === true,
                                            )
                                        }
                                    />

                                    <div>
                                        <p className="text-sm font-medium">
                                            Li e aceito os Termos de Uso
                                        </p>

                                        <p className="mt-1 text-xs text-muted-foreground">
                                            Versão {terms.version}
                                        </p>
                                    </div>
                                </label>

                                <label
                                    htmlFor="privacyAcknowledged"
                                    className="
                        flex cursor-pointer items-start gap-3
                        rounded-xl border p-4
                        transition-all
                        hover:border-foreground/20
                        hover:bg-muted/30
                    "
                                >
                                    <Checkbox
                                        id="privacyAcknowledged"
                                        checked={privacyAcknowledged}
                                        onCheckedChange={(checked) =>
                                            setPrivacyAcknowledged(
                                                checked === true,
                                            )
                                        }
                                    />

                                    <div>
                                        <p className="text-sm font-medium">
                                            Li e estou ciente do Aviso de Privacidade
                                        </p>

                                        <p className="mt-1 text-xs text-muted-foreground">
                                            Versão {privacyNotice.version}
                                        </p>
                                    </div>
                                </label>

                            </div>

                            {acceptMutation.isError && (
                                <p className="mt-4 text-sm text-destructive">
                                    Não foi possível registrar seu aceite.
                                    Tente novamente.
                                </p>
                            )}

                            <div className="mt-6 flex flex-col gap-4 border-t pt-5 sm:flex-row sm:items-center sm:justify-between">

                                <div className="flex items-start gap-2">
                                    <ShieldCheck className="mt-0.5 size-4 shrink-0 text-muted-foreground" />

                                    <p className="max-w-md text-xs leading-5 text-muted-foreground">
                                        Seu aceite ficará vinculado às versões
                                        apresentadas nesta tela.
                                    </p>
                                </div>

                                <Button
                                    size="lg"
                                    className="gap-2 sm:min-w-52"
                                    disabled={!canAccept}
                                    onClick={handleAccept}
                                >
                                    {acceptMutation.isPending ? (
                                        "Registrando..."
                                    ) : (
                                        <>
                                            Aceitar e continuar
                                            <ArrowRight className="size-4" />
                                        </>
                                    )}
                                </Button>

                            </div>

                        </div>
                    }
                />
            </div>
        </main>
    )
}

function resolveNextPath(
    session: ReturnType<typeof useAuth>["session"],
) {
    if (
        session?.user.platformAdmin &&
        session.user.organizations.length === 0
    ) {
        return "/platform/organizations"
    }

    if (
        (session?.user.organizations.length ?? 0) > 0
    ) {
        return "/organizations"
    }

    return "/no-organization"
}