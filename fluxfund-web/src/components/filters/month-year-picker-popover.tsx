import {
    CalendarDays,
    ChevronDown,
} from "lucide-react"

import {
    useState,
} from "react"

import {
    Button,
} from "@/components/ui/button"

import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

import {
    cn,
} from "@/lib/utils"

import {
    MonthYearPicker,
} from "./month-year-picker"

type MonthYearPickerPopoverProps = {
    value?: string | null
    onChange: (value: string) => void
    placeholder?: string
    disabled?: boolean
    className?: string
}

export function MonthYearPickerPopover({
    value,
    onChange,
    placeholder = "Selecionar mês",
    disabled = false,
    className,
}: MonthYearPickerPopoverProps) {
    const [
        open,
        setOpen,
    ] = useState(false)

    const resolvedValue =
        value ?? ""

    function handleChange(
        monthValue: string,
    ) {
        onChange(monthValue)
        setOpen(false)
    }

    return (
        <Popover
            open={open}
            onOpenChange={setOpen}
        >
            <PopoverTrigger asChild>
                <Button
                    type="button"
                    variant="outline"
                    disabled={disabled}
                    className={cn(
                        "w-full justify-between font-normal",
                        !resolvedValue &&
                        "text-muted-foreground",
                        className,
                    )}
                >
                    <span className="flex min-w-0 items-center gap-2">
                        <CalendarDays className="size-4 shrink-0" />

                        <span className="truncate">
                            {resolvedValue
                                ? formatMonthYear(
                                    resolvedValue,
                                )
                                : placeholder}
                        </span>
                    </span>

                    <ChevronDown className="size-4 shrink-0 opacity-60" />
                </Button>
            </PopoverTrigger>

            <PopoverContent
                align="start"
                className="w-[320px] p-2"
            >
                <MonthYearPicker
                    value={resolvedValue}
                    onChange={handleChange}
                />
            </PopoverContent>
        </Popover>
    )
}

function formatMonthYear(
    value: string,
) {
    const [year, month] =
        value
            .split("-")
            .map(Number)

    if (!year || !month) {
        return value
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