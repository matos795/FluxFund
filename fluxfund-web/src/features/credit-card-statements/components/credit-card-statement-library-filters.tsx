import {
    Search,
    X,
} from "lucide-react"

import {
    DateRangePresetFilter,
} from "@/components/filters/date-range-preset-filter"

import type {
    DateRangeValue,
} from "@/components/filters/date-range-presets"

import {
    EntityCombobox,
} from "@/components/form/entity-combobox"

import {
    Button,
} from "@/components/ui/button"

import {
    Card,
    CardContent,
} from "@/components/ui/card"

import {
    Input,
} from "@/components/ui/input"

import {
    Label,
} from "@/components/ui/label"

import {
    useAccounts,
} from "@/features/accounts/hooks/use-accounts"

type Props = {
    accountId: string
    period: DateRangeValue
    searchInput: string

    onAccountIdChange:
    (value: string) => void

    onPeriodChange:
    (value: DateRangeValue) => void

    onSearchInputChange:
    (value: string) => void

    onClear: () => void
}

export function CreditCardStatementLibraryFilters({
    accountId,
    period,
    searchInput,
    onAccountIdChange,
    onPeriodChange,
    onSearchInputChange,
    onClear,
}: Props) {
    const {
        data: accountsPage,
    } = useAccounts({
        page: 0,
        size: 100,
    })

    const accounts =
        accountsPage?.content.filter(
            (account) =>
                account.active &&
                account.type ===
                "CREDIT_CARD",
        ) ?? []

    return (
        <Card>
            <CardContent className="p-4">
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-[minmax(0,1.35fr)_minmax(220px,0.85fr)_minmax(240px,0.95fr)_auto] xl:items-end">
                    <div className="space-y-2">
                        <Label htmlFor="statement-document-search">
                            Buscar arquivo
                        </Label>

                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

                            <Input
                                id="statement-document-search"
                                value={searchInput}
                                placeholder="Nome do arquivo..."
                                className="pl-9"
                                onChange={(event) =>
                                    onSearchInputChange(
                                        event.target.value,
                                    )
                                }
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Cartão</Label>

                        <EntityCombobox
                            value={accountId}
                            options={accounts.map(
                                (account) => ({
                                    value: account.id,
                                    label: account.name,
                                    description:
                                        account.bankName ??
                                        undefined,
                                }),
                            )}
                            placeholder="Todos os cartões"
                            searchPlaceholder="Buscar cartão..."
                            emptyMessage="Nenhum cartão encontrado."
                            allowClear
                            clearLabel="Todos os cartões"
                            onChange={
                                onAccountIdChange
                            }
                        />
                    </div>

                    <DateRangePresetFilter
                        value={period}
                        onChange={onPeriodChange}
                        idPrefix="credit-card-library-period"
                        label="Vencimento"
                        includeAllPeriodOption
                        layout="compact"
                        showSummary={false}
                    />

                    <Button
                        type="button"
                        variant="outline"
                        className="w-full md:w-auto"
                        onClick={onClear}
                    >
                        <X className="mr-2 size-4" />
                        Limpar
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}