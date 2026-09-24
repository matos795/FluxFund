import { useState, type ReactNode } from "react"
import ReactMarkdown from "react-markdown"
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
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs"
import { useAuth } from "@/features/auth/hooks/use-auth"
import { useAcceptLegalDocuments } from "@/features/legal/hooks/use-accept-legal-documents"
import { useLegalDocuments } from "@/features/legal/hooks/use-legal-documents"
import { useLegalStatus } from "@/features/legal/hooks/use-legal-status"
import { ArrowRight, CheckCircle2, FileCheck2, FileText, LockKeyhole, LogOut, ShieldCheck } from "lucide-react"

export function LegalAcceptancePage() {
    const navigate = useNavigate()

    const {
        session,
        logout,
    } = useAuth()

    const statusQuery =
        useLegalStatus()

    const documentsQuery =
        useLegalDocuments()

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

    if (
        statusQuery.isPending ||
        documentsQuery.isPending
    ) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-muted/40">
                <p className="text-sm text-muted-foreground">
                    Carregando documentos...
                </p>
            </main>
        )
    }

    if (
        statusQuery.isError ||
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
                            onClick={() => {
                                statusQuery.refetch()
                                documentsQuery.refetch()
                            }}
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
                <Card className="overflow-hidden border-border/70 shadow-sm">
                    <Tabs
                        defaultValue="terms"
                        className="gap-0"
                    >
                        {/* Cabeçalho */}
                        <div className="bg-muted/20 px-5 pt-5 sm:px-6">
                            <div className="mb-5 flex items-start gap-4">
                                <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl border bg-background shadow-sm">
                                    <FileCheck2 className="size-5" />
                                </div>

                                <div>
                                    <h2 className="text-base font-semibold">
                                        Conheça os documentos
                                    </h2>

                                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                                        Eles explicam as condições de uso do FluxFund e como
                                        tratamos suas informações dentro da plataforma.
                                    </p>
                                </div>
                            </div>

                            <TabsList className="grid h-auto w-full grid-cols-1 gap-2 bg-transparent p-0 sm:grid-cols-2">
                                <TabsTrigger
                                    value="terms"
                                    className="
            group h-auto justify-start gap-3 rounded-xl border bg-background
            px-4 py-3 text-left shadow-none transition-all
            hover:border-foreground/20 hover:bg-muted/50
            data-[state=active]:border-foreground
            data-[state=active]:bg-foreground
            data-[state=active]:text-background
            data-[state=active]:shadow-sm
            data-[state=active]:hover:bg-foreground
        "
                                >
                                    <div
                                        className="
                flex size-9 shrink-0 items-center justify-center rounded-lg
                bg-muted text-foreground transition-colors
                group-data-[state=active]:bg-white/10
                group-data-[state=active]:text-white
            "
                                    >
                                        <FileText className="size-4" />
                                    </div>

                                    <div className="min-w-0">
                                        <p className="font-medium leading-none">
                                            Termos de Uso
                                        </p>

                                        <p className="mt-1 text-xs font-normal text-current opacity-70">
                                            Regras para utilizar o FluxFund
                                        </p>
                                    </div>
                                </TabsTrigger>

                                <TabsTrigger
                                    value="privacy"
                                    className="
            group h-auto justify-start gap-3 rounded-xl border bg-background
            px-4 py-3 text-left shadow-none transition-all
            hover:border-foreground/20 hover:bg-muted/50
            data-[state=active]:border-foreground
            data-[state=active]:bg-foreground
            data-[state=active]:text-background
            data-[state=active]:shadow-sm
            data-[state=active]:hover:bg-foreground
        "
                                >
                                    <div
                                        className="
                flex size-9 shrink-0 items-center justify-center rounded-lg
                bg-muted text-foreground transition-colors
                group-data-[state=active]:bg-white/10
                group-data-[state=active]:text-white
            "
                                    >
                                        <ShieldCheck className="size-4" />
                                    </div>

                                    <div className="min-w-0">
                                        <p className="font-medium leading-none">
                                            Aviso de Privacidade
                                        </p>

                                        <p className="mt-1 text-xs font-normal text-current opacity-70">
                                            Como tratamos suas informações
                                        </p>
                                    </div>
                                </TabsTrigger>
                            </TabsList>
                            <div className="mt-5 border-t border-border/60" />
                        </div>

                        <TabsContent
                            value="terms"
                            className="m-0"
                        >
                            <DocumentViewer
                                version={terms.version}
                                icon={<FileText className="size-4" />}
                                content={terms.content}
                            />
                        </TabsContent>

                        <TabsContent
                            value="privacy"
                            className="m-0"
                        >
                            <DocumentViewer
                                version={privacyNotice.version}
                                icon={<ShieldCheck className="size-4" />}
                                content={privacyNotice.content}
                            />
                        </TabsContent>
                    </Tabs>

                    {/* Confirmação */}
                    <div className="border-t bg-background px-5 py-6 sm:px-8">
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
                                        checked={
                                            privacyAcknowledged
                                        }
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
                    </div>
                    
                </Card>
            </div>
        </main>
    )
}

function DocumentViewer({
    version,
    icon,
    content,
}: {
    version: string
    icon: ReactNode
    content: string
}) {
    return (
        <div
            className="
                max-h-[62vh] overflow-y-auto
                bg-[radial-gradient(circle_at_1px_1px,rgba(0,0,0,0.055)_1px,transparent_0)]
                [background-size:18px_18px]
                px-4 py-7
                sm:px-8 sm:py-10
            "
        >
            <article
                className="
                    mx-auto max-w-3xl
                    rounded-2xl border border-neutral-200
                    bg-white
                    px-6 py-7
                    shadow-[0_8px_30px_rgba(0,0,0,0.07)]
                    sm:px-10 sm:py-9
                "
            >
                {/* Meta do documento */}
                <div className="mb-8 flex items-center justify-between gap-4 border-b pb-5">
                    <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                        <div className="flex size-8 items-center justify-center rounded-lg bg-muted text-foreground">
                            {icon}
                        </div>

                        Documento vigente
                    </div>

                    <span className="rounded-full border bg-muted/30 px-3 py-1 text-xs text-muted-foreground">
                        Versão {version}
                    </span>
                </div>

                <ReactMarkdown
                    components={{
                        h1: ({ children }) => (
                            <h1 className="mb-3 text-2xl font-semibold tracking-tight text-neutral-950 sm:text-3xl">
                                {children}
                            </h1>
                        ),

                        h2: ({ children }) => (
                            <h2 className="mb-3 mt-9 text-lg font-semibold tracking-tight text-neutral-950">
                                {children}
                            </h2>
                        ),

                        h3: ({ children }) => (
                            <h3 className="mb-2 mt-7 font-semibold text-neutral-950">
                                {children}
                            </h3>
                        ),

                        p: ({ children }) => (
                            <p className="mb-4 text-sm leading-7 text-neutral-700">
                                {children}
                            </p>
                        ),

                        ul: ({ children }) => (
                            <ul className="mb-4 list-disc space-y-2 pl-5 text-sm leading-7 text-neutral-700">
                                {children}
                            </ul>
                        ),

                        ol: ({ children }) => (
                            <ol className="mb-4 list-decimal space-y-2 pl-5 text-sm leading-7 text-neutral-700">
                                {children}
                            </ol>
                        ),

                        strong: ({ children }) => (
                            <strong className="font-semibold text-neutral-950">
                                {children}
                            </strong>
                        ),

                        a: ({ children, href }) => (
                            <a
                                href={href}
                                target="_blank"
                                rel="noreferrer"
                                className="font-medium text-blue-700 underline underline-offset-4"
                            >
                                {children}
                            </a>
                        ),

                        hr: () => (
                            <hr className="my-8 border-neutral-200" />
                        ),
                    }}
                >
                    {content}
                </ReactMarkdown>
            </article>
        </div>
    )
}

function resolveNextPath(
    session: ReturnType<
        typeof useAuth
    >["session"],
) {
    if (
        session?.user.platformAdmin &&
        session.user.organizations
            .length === 0
    ) {
        return "/platform/organizations"
    }

    if (
        (session?.user.organizations
            .length ?? 0) > 0
    ) {
        return "/organizations"
    }

    return "/no-organization"
}