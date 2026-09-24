import {
    ArrowRight,
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

export function LegalDocumentsSettingsCard() {
    const navigate = useNavigate()

    return (
        <Card>
            <CardHeader>
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
            </CardHeader>

            <CardContent>
                <div className="mb-5 grid gap-3 sm:grid-cols-2">
                    <div className="flex items-center gap-3 rounded-xl border p-4">
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                            <FileText className="size-4" />
                        </div>

                        <div>
                            <p className="text-sm font-medium">
                                Termos de Uso
                            </p>

                            <p className="mt-0.5 text-xs text-muted-foreground">
                                Condições de uso da plataforma
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 rounded-xl border p-4">
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                            <ShieldCheck className="size-4" />
                        </div>

                        <div>
                            <p className="text-sm font-medium">
                                Aviso de Privacidade
                            </p>

                            <p className="mt-0.5 text-xs text-muted-foreground">
                                Como tratamos informações
                            </p>
                        </div>
                    </div>
                </div>

                <Button
                    variant="outline"
                    className="w-full justify-between"
                    onClick={() =>
                        navigate("/settings/legal")
                    }
                >
                    Consultar documentos

                    <ArrowRight className="size-4" />
                </Button>
            </CardContent>
        </Card>
    )
}