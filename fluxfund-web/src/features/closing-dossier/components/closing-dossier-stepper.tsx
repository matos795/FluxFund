import {
    Check,
    FileCheck2,
    Files,
    Settings2,
    TriangleAlert,
} from "lucide-react"

import {
    cn,
} from "@/lib/utils"

export type ClosingDossierStep =
    | "configuration"
    | "documents"
    | "issues"
    | "review"

type ClosingDossierStepperProps = {
    activeStep: ClosingDossierStep
    onStepChange?: (
        step: ClosingDossierStep,
    ) => void
}

const steps = [
    {
        value: "configuration",
        number: 1,
        label: "Configuração",
        description:
            "Período, contas e conteúdo",
        icon: Settings2,
    },
    {
        value: "documents",
        number: 2,
        label: "Documentos",
        description:
            "Extratos, faturas e arquivos",
        icon: Files,
    },
    {
        value: "issues",
        number: 3,
        label: "Pendências",
        description:
            "Conferência documental",
        icon: TriangleAlert,
    },
    {
        value: "review",
        number: 4,
        label: "Revisão e PDF",
        description:
            "Resumo final e exportação",
        icon: FileCheck2,
    },
] satisfies {
    value: ClosingDossierStep
    number: number
    label: string
    description: string
    icon: typeof Settings2
}[]

export function ClosingDossierStepper({
    activeStep,
    onStepChange,
}: ClosingDossierStepperProps) {
    const activeIndex =
        steps.findIndex(
            (step) =>
                step.value === activeStep,
        )

    return (
        <div className="rounded-2xl border bg-card p-4 shadow-sm">
            <div className="grid gap-3 md:grid-cols-4">
                {steps.map(
                    (step, index) => {
                        const Icon =
                            step.icon

                        const completed =
                            index < activeIndex

                        const active =
                            step.value ===
                            activeStep

                        const canNavigate =
                            index <= activeIndex &&
                            !active &&
                            Boolean(onStepChange)

                        return (
                            <div
                                key={step.value}
                                className={cn(
                                    "relative flex items-start gap-3 rounded-xl border p-3 transition-colors",
                                    active &&
                                    "border-primary bg-primary/5",
                                    completed &&
                                    "border-primary/30 bg-primary/[0.03]",
                                    !active &&
                                    !completed &&
                                    "bg-muted/20 text-muted-foreground",
                                )}
                            >
                                <button
                                    key={step.value}
                                    type="button"
                                    disabled={!canNavigate}
                                    onClick={() => {
                                        if (canNavigate) {
                                            onStepChange?.(
                                                step.value,
                                            )
                                        }
                                    }}
                                    className={cn(
                                        "relative flex w-full items-start gap-3 rounded-xl border p-3 text-left transition-colors",
                                        active &&
                                        "border-primary bg-primary/5",
                                        completed &&
                                        "border-primary/30 bg-primary/[0.03]",
                                        !active &&
                                        !completed &&
                                        "bg-muted/20 text-muted-foreground",
                                        canNavigate &&
                                        "cursor-pointer hover:border-primary/50 hover:bg-primary/[0.04]",
                                        !canNavigate &&
                                        "cursor-default",
                                    )}
                                >
                                    {completed ? (
                                        <Check className="size-4" />
                                    ) : (
                                        <Icon className="size-4" />
                                    )}
                                </button>

                                <div className="min-w-0">
                                    <p
                                        className={cn(
                                            "text-sm font-semibold",
                                            active &&
                                            "text-foreground",
                                        )}
                                    >
                                        {step.number}.{" "}
                                        {step.label}
                                    </p>

                                    <p className="mt-0.5 text-xs text-muted-foreground">
                                        {
                                            step.description
                                        }
                                    </p>
                                </div>

                                {
                                    index <
                                    steps.length -
                                    1 && (
                                        <div className="absolute -right-2 top-1/2 hidden h-px w-4 bg-border md:block" />
                                    )
                                }
                            </div>
                        )
                    },
                )}
            </div>
        </div >
    )
}