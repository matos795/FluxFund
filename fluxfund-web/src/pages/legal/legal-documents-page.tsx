import { FileText } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"

import { LegalDocumentsPanel } from "@/features/legal/components/legal-documents-panel"
import { useLegalDocuments } from "@/features/legal/hooks/use-legal-documents"

export function LegalDocumentsPage() {
    const documentsQuery =
        useLegalDocuments()

    if (documentsQuery.isPending) {
        return (
            <div className="flex min-h-80 items-center justify-center">
                <p className="text-sm text-muted-foreground">
                    Carregando documentos...
                </p>
            </div>
        )
    }

    if (
        documentsQuery.isError ||
        !documentsQuery.data
    ) {
        return (
            <div className="mx-auto w-full max-w-lg">
                <Card>
                    <CardHeader>
                        <CardTitle>
                            Não foi possível carregar os documentos
                        </CardTitle>

                        <CardDescription>
                            Tente novamente para consultar os documentos legais do FluxFund.
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
            </div>
        )
    }

    const {
        terms,
        privacyNotice,
    } = documentsQuery.data

    return (
        <div className="space-y-6">
            <div className="flex items-start gap-4">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl border bg-background shadow-sm">
                    <FileText className="size-5" />
                </div>

                <div>
                    <h1 className="text-2xl font-semibold tracking-tight">
                        Documentos legais
                    </h1>

                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                        Consulte a versão vigente dos Termos de Uso
                        e do Aviso de Privacidade do FluxFund.
                    </p>
                </div>
            </div>

            <LegalDocumentsPanel
                terms={terms}
                privacyNotice={privacyNotice}
            />
        </div>
    )
}