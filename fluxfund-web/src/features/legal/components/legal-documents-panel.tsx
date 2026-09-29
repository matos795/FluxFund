import type { ReactNode } from "react"
import ReactMarkdown from "react-markdown"
import {
    FileCheck2,
    FileText,
    ShieldCheck,
} from "lucide-react"

import { Card } from "@/components/ui/card"
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs"

import type {
    LegalDocument,
} from "@/features/legal/legal-types"

type LegalDocumentsPanelProps = {
    terms: LegalDocument
    privacyNotice: LegalDocument
    footer?: ReactNode
}

export function LegalDocumentsPanel({
    terms,
    privacyNotice,
    footer,
}: LegalDocumentsPanelProps) {
    return (
        <Card className="overflow-hidden border-border/70 shadow-sm">
            <Tabs
                defaultValue="terms"
                className="gap-0"
            >
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
                                Consulte as condições de uso do FluxFund
                                e como suas informações são tratadas.
                            </p>
                        </div>
                    </div>

                    <TabsList className="grid h-auto w-full grid-cols-1 gap-2 bg-transparent p-0 sm:grid-cols-2">
                        <LegalTab
                            value="terms"
                            icon={<FileText className="size-4" />}
                            title="Termos de Uso"
                            description="Regras para utilizar o FluxFund"
                        />

                        <LegalTab
                            value="privacy"
                            icon={<ShieldCheck className="size-4" />}
                            title="Aviso de Privacidade"
                            description="Como tratamos suas informações"
                        />
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
            {footer && (
                <div className="border-t bg-background px-5 py-6 sm:px-8">
                    {footer}
                </div>
            )}
        </Card>
    )
}

function LegalTab({
    value,
    icon,
    title,
    description,
}: {
    value: string
    icon: ReactNode
    title: string
    description: string
}) {
    return (
        <TabsTrigger
            value={value}
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
                {icon}
            </div>

            <div className="min-w-0">
                <p className="font-medium leading-none">
                    {title}
                </p>

                <p className="mt-1 text-xs font-normal text-current opacity-70">
                    {description}
                </p>
            </div>
        </TabsTrigger>
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
                    mx-auto max-w-3xl rounded-2xl
                    border border-neutral-200 bg-white
                    px-6 py-7
                    shadow-[0_8px_30px_rgba(0,0,0,0.07)]
                    sm:px-10 sm:py-9
                "
            >
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