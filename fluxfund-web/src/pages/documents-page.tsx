import {
    Archive,
    FileArchive,
    FileText,
    Landmark,
    Paperclip,
    ReceiptText,
} from "lucide-react"

import {
    PageHeader,
} from "@/components/layout/page-header"

import {
    Badge,
} from "@/components/ui/badge"

import {
    Card,
    CardContent,
} from "@/components/ui/card"

import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs"

import {
    BankStatementLibrarySection,
} from "@/features/bank-statement-documents/components/bank-statement-library-section"

export function DocumentsPage() {
    return (
        <div className="space-y-6">
            <PageHeader
                title="Biblioteca de documentos"
                description="Centralize e consulte os documentos financeiros da organização."
            />

            <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-primary/5 via-background to-background">
                <CardContent className="flex items-center gap-4 p-5">
                    <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                        <FileArchive className="size-5" />
                    </div>

                    <div>
                        <p className="font-semibold">
                            Documentos financeiros em um só lugar
                        </p>

                        <p className="mt-1 text-sm text-muted-foreground">
                            A biblioteca começa pelos extratos bancários e será ampliada gradualmente para anexos, recibos e documentos de fechamento.
                        </p>
                    </div>
                </CardContent>
            </Card>

            <Tabs
                defaultValue="bank-statements"
                className="space-y-5"
            >
                <TabsList className="grid w-full grid-cols-2 items-stretch gap-1 rounded-xl bg-muted p-1 group-data-horizontal/tabs:h-auto lg:grid-cols-4">
                    <DocumentTab
                        value="bank-statements"
                        icon={Landmark}
                        label="Extratos"
                    />

                    <DocumentTab
                        value="attachments"
                        icon={Paperclip}
                        label="Anexos"
                    />

                    <DocumentTab
                        value="receipts"
                        icon={ReceiptText}
                        label="Recibos"
                    />

                    <DocumentTab
                        value="dossiers"
                        icon={Archive}
                        label="Dossiês"
                    />
                </TabsList>

                <TabsContent
                    value="bank-statements"
                    className="mt-0"
                >
                    <BankStatementLibrarySection />
                </TabsContent>

                <TabsContent
                    value="attachments"
                    className="mt-0"
                >
                    <ComingSoon
                        icon={Paperclip}
                        title="Anexos de transações"
                        description="Aqui será possível consultar comprovantes, notas fiscais e outros arquivos vinculados às movimentações."
                    />
                </TabsContent>

                <TabsContent
                    value="receipts"
                    className="mt-0"
                >
                    <ComingSoon
                        icon={ReceiptText}
                        title="Recibos"
                        description="A biblioteca poderá reunir os recibos emitidos e facilitar sua consulta."
                    />
                </TabsContent>

                <TabsContent
                    value="dossiers"
                    className="mt-0"
                >
                    <ComingSoon
                        icon={Archive}
                        title="Dossiês de fechamento"
                        description="Fechamentos gerados poderão futuramente ser arquivados nesta área."
                    />
                </TabsContent>
            </Tabs>
        </div>
    )
}

type DocumentTabProps = {
    value: string
    label: string
    icon: typeof FileText
}

function DocumentTab({
    value,
    label,
    icon: Icon,
}: DocumentTabProps) {
    return (
        <TabsTrigger
            value={value}
            className="h-auto min-h-10 gap-2 rounded-lg px-3 py-2 after:hidden data-active:bg-background data-active:text-foreground data-active:shadow-sm"
        >
            <Icon className="size-4" />
            {label}
        </TabsTrigger>
    )
}

function ComingSoon({
    icon: Icon,
    title,
    description,
}: {
    icon: typeof FileText
    title: string
    description: string
}) {
    return (
        <Card>
            <CardContent className="flex flex-col items-center justify-center gap-4 p-12 text-center">
                <div className="flex size-14 items-center justify-center rounded-2xl bg-muted">
                    <Icon className="size-6 text-muted-foreground" />
                </div>

                <div>
                    <div className="flex items-center justify-center gap-2">
                        <p className="font-semibold">
                            {title}
                        </p>

                        <Badge variant="secondary">
                            Em breve
                        </Badge>
                    </div>

                    <p className="mt-2 max-w-xl text-sm text-muted-foreground">
                        {description}
                    </p>
                </div>
            </CardContent>
        </Card>
    )
}
