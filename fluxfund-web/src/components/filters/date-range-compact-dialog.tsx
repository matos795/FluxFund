import {
    CalendarRange,
} from "lucide-react"

import {
    useState,
} from "react"

import {
    AppDialogBody,
    AppDialogContent,
    AppDialogFooter,
    AppDialogHeader,
} from "@/components/layout/app-dialog"

import {
    Button,
} from "@/components/ui/button"

import {
    Dialog,
    DialogTrigger,
} from "@/components/ui/dialog"

import {
    Input,
} from "@/components/ui/input"

import {
    Label,
} from "@/components/ui/label"

import {
    formatDate,
} from "@/utils/formatters"

import {
    dateRangePresetLabels,
    getCurrentDateInputValue,
    getCurrentMonthInputValue,
    getDayRange,
    getMonthRange,
    resolveDateRangePreset,
    type DateRangePreset,
    type DateRangeValue,
} from "./date-range-presets"

import {
    MonthYearPicker,
} from "./month-year-picker"

type DateRangeCompactDialogProps = {
    value: DateRangeValue
    onChange: (
        value: DateRangeValue,
    ) => void
    idPrefix: string
    selectablePresets:
    DateRangePreset[]
}

const ADVANCED_PRESETS:
    DateRangePreset[] = [
        "specific-day",
        "specific-month",
        "custom",
    ]

export function DateRangeCompactDialog({
    value,
    onChange,
    idPrefix,
    selectablePresets,
}: DateRangeCompactDialogProps) {
    const [
        open,
        setOpen,
    ] = useState(false)

    const quickPresets =
        selectablePresets.filter(
            (preset) =>
                !ADVANCED_PRESETS.includes(
                    preset,
                ),
        )

    const advancedPresets =
        selectablePresets.filter(
            (preset) =>
                ADVANCED_PRESETS.includes(
                    preset,
                ),
        )

    const hasInvalidRange =
        Boolean(value.startDate) &&
        Boolean(value.endDate) &&
        value.startDate >
        value.endDate

    function handlePresetChange(
        preset: DateRangePreset,
    ) {
        if (preset === "all") {
            onChange({
                preset: "all",
                startDate: "",
                endDate: "",
            })

            setOpen(false)
            return
        }

        if (
            preset === "specific-day"
        ) {
            const dayValue =
                value.preset ===
                    "specific-day" &&
                    value.startDate
                    ? value.startDate
                    : getCurrentDateInputValue()

            onChange({
                preset: "specific-day",
                ...getDayRange(
                    dayValue,
                ),
            })

            return
        }

        if (
            preset ===
            "specific-month"
        ) {
            const monthValue =
                value.preset ===
                    "specific-month" &&
                    value.startDate
                    ? value.startDate.slice(
                        0,
                        7,
                    )
                    : getCurrentMonthInputValue()

            onChange({
                preset:
                    "specific-month",
                ...getMonthRange(
                    monthValue,
                ),
            })

            return
        }

        if (preset === "custom") {
            onChange({
                ...value,
                preset: "custom",
            })

            return
        }

        onChange({
            preset,
            ...resolveDateRangePreset(
                preset,
            ),
        })

        setOpen(false)
    }

    function handleCustomDateChange(
        field:
            | "startDate"
            | "endDate",
        nextValue: string,
    ) {
        onChange({
            ...value,
            preset: "custom",
            [field]: nextValue,
        })
    }

    return (
        <Dialog
            open={open}
            onOpenChange={setOpen}
        >
            <DialogTrigger asChild>
                <Button
                    type="button"
                    variant={
                        value.preset === "all"
                            ? "outline"
                            : "secondary"
                    }
                    className="h-9 w-full justify-start gap-2 px-3"
                >
                    <CalendarRange className="size-4 shrink-0" />

                    <span className="truncate">
                        {getPeriodLabel(
                            value,
                        )}
                    </span>
                </Button>
            </DialogTrigger>

            <AppDialogContent size="sm">
                <AppDialogHeader
                    icon={
                        <CalendarRange className="size-4 text-muted-foreground" />
                    }
                    title="Selecionar período"
                    description="Escolha um período rápido ou personalize as datas."
                />

                <AppDialogBody className="space-y-5">
                    {quickPresets.length >
                        0 && (
                            <section className="space-y-2">
                                <Label>
                                    Períodos rápidos
                                </Label>

                                <div className="grid grid-cols-2 gap-2">
                                    {quickPresets.map(
                                        (preset) => (
                                            <Button
                                                key={
                                                    preset
                                                }
                                                type="button"
                                                variant={
                                                    value.preset ===
                                                        preset
                                                        ? "secondary"
                                                        : "outline"
                                                }
                                                className="h-auto min-h-10 justify-start whitespace-normal px-3 py-2 text-left"
                                                onClick={() =>
                                                    handlePresetChange(
                                                        preset,
                                                    )
                                                }
                                            >
                                                {
                                                    dateRangePresetLabels[
                                                    preset
                                                    ]
                                                }
                                            </Button>
                                        ),
                                    )}
                                </div>
                            </section>
                        )}

                    {advancedPresets.length >
                        0 && (
                            <section className="space-y-2">
                                <Label>
                                    Personalizar
                                </Label>

                                <div className="grid grid-cols-3 gap-2">
                                    {advancedPresets.map(
                                        (preset) => (
                                            <Button
                                                key={
                                                    preset
                                                }
                                                type="button"
                                                variant={
                                                    value.preset ===
                                                        preset
                                                        ? "secondary"
                                                        : "outline"
                                                }
                                                className="h-auto min-h-10 whitespace-normal px-2 py-2"
                                                onClick={() =>
                                                    handlePresetChange(
                                                        preset,
                                                    )
                                                }
                                            >
                                                {
                                                    dateRangePresetLabels[
                                                    preset
                                                    ]
                                                }
                                            </Button>
                                        ),
                                    )}
                                </div>
                            </section>
                        )}

                    {value.preset ===
                        "specific-day" && (
                            <section className="space-y-2 rounded-xl border bg-muted/20 p-3">
                                <Label
                                    htmlFor={`${idPrefix}-dialog-day`}
                                >
                                    Dia
                                </Label>

                                <Input
                                    id={`${idPrefix}-dialog-day`}
                                    type="date"
                                    value={
                                        value.startDate
                                    }
                                    onChange={(
                                        event,
                                    ) => {
                                        onChange({
                                            preset:
                                                "specific-day",
                                            ...getDayRange(
                                                event.target
                                                    .value,
                                            ),
                                        })

                                        setOpen(false)
                                    }}
                                />
                            </section>
                        )}

                    {value.preset ===
                        "specific-month" && (
                            <section className="space-y-2 rounded-xl border bg-muted/20 p-3">
                                <Label>
                                    Mês e ano
                                </Label>

                                <MonthYearPicker
                                    value={
                                        value.startDate.slice(
                                            0,
                                            7,
                                        )
                                    }
                                    onChange={(
                                        monthValue,
                                    ) => {
                                        onChange({
                                            preset:
                                                "specific-month",
                                            ...getMonthRange(
                                                monthValue,
                                            ),
                                        })

                                        setOpen(false)
                                    }}
                                />
                            </section>
                        )}

                    {value.preset ===
                        "custom" && (
                            <section className="space-y-3 rounded-xl border bg-muted/20 p-3">
                                <div className="grid gap-3 sm:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label
                                            htmlFor={`${idPrefix}-dialog-start`}
                                        >
                                            Data inicial
                                        </Label>

                                        <Input
                                            id={`${idPrefix}-dialog-start`}
                                            type="date"
                                            value={
                                                value.startDate
                                            }
                                            onChange={(
                                                event,
                                            ) =>
                                                handleCustomDateChange(
                                                    "startDate",
                                                    event.target
                                                        .value,
                                                )
                                            }
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label
                                            htmlFor={`${idPrefix}-dialog-end`}
                                        >
                                            Data final
                                        </Label>

                                        <Input
                                            id={`${idPrefix}-dialog-end`}
                                            type="date"
                                            value={
                                                value.endDate
                                            }
                                            onChange={(
                                                event,
                                            ) =>
                                                handleCustomDateChange(
                                                    "endDate",
                                                    event.target
                                                        .value,
                                                )
                                            }
                                        />
                                    </div>
                                </div>

                                {hasInvalidRange && (
                                    <p className="text-sm text-destructive">
                                        A data final não pode
                                        ser anterior à data
                                        inicial.
                                    </p>
                                )}
                            </section>
                        )}

                    <p className="text-xs text-muted-foreground">
                        As alterações são
                        aplicadas automaticamente.
                    </p>
                </AppDialogBody>

                {value.preset ===
                    "custom" && (
                        <AppDialogFooter>
                            <Button
                                type="button"
                                onClick={() =>
                                    setOpen(false)
                                }
                                disabled={
                                    hasInvalidRange ||
                                    !value.startDate ||
                                    !value.endDate
                                }
                            >
                                Concluir
                            </Button>
                        </AppDialogFooter>
                    )}
            </AppDialogContent>
        </Dialog>
    )
}

function getPeriodLabel(
    value: DateRangeValue,
) {
    if (value.preset === "all") {
        return "Todo o período"
    }

    if (
        value.preset ===
        "specific-day" &&
        value.startDate
    ) {
        return formatDate(
            value.startDate,
        )
    }

    if (
        value.preset ===
        "specific-month" &&
        value.startDate
    ) {
        return formatMonthYear(
            value.startDate.slice(
                0,
                7,
            ),
        )
    }

    if (
        value.preset === "custom" &&
        value.startDate &&
        value.endDate
    ) {
        return `${formatDate(
            value.startDate,
        )} até ${formatDate(
            value.endDate,
        )}`
    }

    return dateRangePresetLabels[
        value.preset
    ]
}

function formatMonthYear(
    monthValue: string,
) {
    const [year, month] =
        monthValue
            .split("-")
            .map(Number)

    if (!year || !month) {
        return "Escolher mês"
    }

    const date =
        new Date(
            Date.UTC(
                year,
                month - 1,
                1,
            ),
        )

    const label =
        new Intl.DateTimeFormat(
            "pt-BR",
            {
                month: "long",
                year: "numeric",
                timeZone: "UTC",
            },
        ).format(date)

    return (
        label.charAt(0).toUpperCase() +
        label.slice(1)
    )
}