import { Building2, Info, Landmark, Save } from "lucide-react"
import { useMemo, useState } from "react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"

import { useOrganizationSettings } from "../hooks/use-organization-settings"
import { useUpdateOrganizationSettings } from "../hooks/use-update-organization-settings"
import { usePermissions } from "@/features/auth/hooks/use-permissions"
import { useFundOptions } from "@/features/funds/hooks/use-fund-options"
import { FundComboboxWithCreate } from "@/features/funds/components/fund-combobox-with-create"
import { Switch } from "@/components/ui/switch"
import { getApiErrorMessage } from "@/utils/api-error"

export function FinancialSettingsCard() {

  const { canAdmin } = usePermissions()

  const [defaultFundId, setDefaultFundId] = useState<string | undefined>()
  const [allowNegativeFunds, setAllowNegativeFunds] = useState<boolean | undefined>()
  const [
    requireFiscalDocumentForExpenses,
    setRequireFiscalDocumentForExpenses,
  ] = useState<boolean | undefined>()

  const [
    requireProofForIncomes,
    setRequireProofForIncomes,
  ] = useState<boolean | undefined>()
  const [
    suggestDefaultFundReallocation,
    setSuggestDefaultFundReallocation,
  ] = useState<boolean | undefined>()

  const [
    autoFillClassificationSuggestions,
    setAutoFillClassificationSuggestions,
  ] = useState<boolean | undefined>()

  const settingsQuery = useOrganizationSettings()
  const updateSettingsMutation = useUpdateOrganizationSettings()

  const fundsQuery = useFundOptions()
  const funds = useMemo(() => fundsQuery.data ?? [], [fundsQuery.data])

  const settings = settingsQuery.data

  const effectiveDefaultFundId = defaultFundId ?? settings?.defaultFund?.id ?? ""

  const effectiveAllowNegativeFunds = allowNegativeFunds ?? settings?.allowNegativeFunds ?? true

  const effectiveSuggestDefaultFundReallocation = suggestDefaultFundReallocation ?? settings?.suggestDefaultFundReallocation ?? false

  const effectiveRequireFiscalDocumentForExpenses =
    requireFiscalDocumentForExpenses ??
    settings?.requireFiscalDocumentForExpenses ??
    true

  const effectiveRequireProofForIncomes =
    requireProofForIncomes ??
    settings?.requireProofForIncomes ??
    false

  const effectiveAutoFillClassificationSuggestions =
    autoFillClassificationSuggestions ??
    settings?.autoFillClassificationSuggestions ??
    true

  const selectedFundId = effectiveDefaultFundId

  const selectedFund = useMemo(() => {
    return funds.find((fund) => fund.id === selectedFundId) ?? null
  }, [funds, selectedFundId])

  function handleSave() {
    updateSettingsMutation.mutate(
      {
        defaultFundId: effectiveDefaultFundId || null,
        allowNegativeFunds: effectiveAllowNegativeFunds,
        suggestDefaultFundReallocation:
          canSuggestDefaultFundReallocation &&
          effectiveSuggestDefaultFundReallocation,
        requireFiscalDocumentForExpenses:
          effectiveRequireFiscalDocumentForExpenses,
        requireProofForIncomes: effectiveRequireProofForIncomes,
        autoFillClassificationSuggestions:
          effectiveAutoFillClassificationSuggestions,
      },
      {
        onSuccess: () => {
          toast.success("Configurações financeiras atualizadas.")

          setDefaultFundId(undefined)
          setAllowNegativeFunds(undefined)
          setSuggestDefaultFundReallocation(undefined)
          setRequireFiscalDocumentForExpenses(undefined)
          setRequireProofForIncomes(undefined)
          setAutoFillClassificationSuggestions(undefined)
        },
        onError: (error) => {
          toast.error(
            getApiErrorMessage(
              error,
              "Não foi possível atualizar as configurações.",
            ),
          )
        },
      },
    )
  }

  function handleAllowNegativeFundsChange(value: boolean) {
    setAllowNegativeFunds(value)

    if (value) {
      setSuggestDefaultFundReallocation(false)
    }
  }

  function handleDefaultFundChange(value: string) {
    setDefaultFundId(value)

    if (!value) {
      setSuggestDefaultFundReallocation(false)
    }
  }

  const isLoading = settingsQuery.isLoading || fundsQuery.isLoading
  const isError = settingsQuery.isError || fundsQuery.isError
  const hasChanged =
    (settings?.defaultFund?.id ?? "") !== effectiveDefaultFundId ||
    settings?.allowNegativeFunds !== effectiveAllowNegativeFunds ||
    settings?.suggestDefaultFundReallocation !==
    effectiveSuggestDefaultFundReallocation ||
    settings?.requireFiscalDocumentForExpenses !==
    effectiveRequireFiscalDocumentForExpenses ||
    settings?.requireProofForIncomes !== effectiveRequireProofForIncomes ||
    settings?.autoFillClassificationSuggestions !==
    effectiveAutoFillClassificationSuggestions

  const canSuggestDefaultFundReallocation = !effectiveAllowNegativeFunds && Boolean(effectiveDefaultFundId)

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <Landmark className="size-5 text-muted-foreground" />
              Configurações financeiras
            </CardTitle>

            <CardDescription>
              Defina regras financeiras padrão para esta organização.
            </CardDescription>
          </div>

          {settings?.defaultFund ? (
            <Badge variant="secondary">
              Fundo padrão configurado
            </Badge>
          ) : (
            <Badge variant="outline">
              Sem fundo padrão
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {isLoading ? (
          <FinancialSettingsSkeleton />
        ) : isError ? (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
            Não foi possível carregar as configurações financeiras.
          </div>
        ) : (
          <>
            <div className="grid gap-4 rounded-xl border p-4 md:grid-cols-[1fr_280px]">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="rounded-lg bg-muted p-2">
                    <Building2 className="size-4 text-muted-foreground" />
                  </div>

                  <div>
                    <h3 className="text-sm font-medium">
                      Fundo padrão / Caixa Base
                    </h3>

                    <p className="mt-1 text-sm text-muted-foreground">
                      Este fundo será usado automaticamente quando uma transação
                      liquidada for classificada ou criada sem alocação manual.
                    </p>
                  </div>
                </div>

                <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
                  <div className="flex gap-2">
                    <Info className="mt-0.5 size-4 shrink-0" />
                    <p>
                      Use um fundo como Caixa Base, Caixa Geral ou Fundo Padrão.
                      Isso evita que receitas e despesas comuns fiquem como
                      “não alocadas”.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Fundo padrão</Label>

                <FundComboboxWithCreate
                  value={selectedFundId}
                  allowClear={false}
                  disabled={!canAdmin}
                  onChange={handleDefaultFundChange}
                />

                {selectedFund && (
                  <p className="text-xs text-muted-foreground">
                    Atual: {selectedFund.label}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-4 rounded-lg border p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Permitir fundos negativos</p>
                  <p className="text-sm text-muted-foreground">
                    Quando ativado, o sistema permite que fundos fiquem com saldo abaixo de zero.
                  </p>
                </div>

                <Switch
                  checked={effectiveAllowNegativeFunds}
                  disabled={!canAdmin}
                  onCheckedChange={handleAllowNegativeFundsChange}
                />
              </div>

              <div className="flex items-start justify-between gap-4 border-t pt-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium">
                    Sugerir remanejamento para o fundo padrão
                  </p>

                  <p className="text-sm text-muted-foreground">
                    Quando um fundo não tiver saldo suficiente, o sistema sugere dividir o valor
                    com o fundo padrão. Nada é salvo automaticamente.
                  </p>

                  {!canSuggestDefaultFundReallocation && (
                    <p className="text-xs text-amber-700">
                      Disponível apenas quando fundos negativos estão bloqueados e existe um fundo padrão configurado.
                    </p>
                  )}
                </div>

                <Switch
                  checked={canSuggestDefaultFundReallocation && effectiveSuggestDefaultFundReallocation}
                  disabled={!canAdmin || !canSuggestDefaultFundReallocation}
                  onCheckedChange={setSuggestDefaultFundReallocation}
                />
              </div>
            </div>

            <div className="space-y-4 rounded-lg border p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium">
                    Preencher classificação automaticamente
                  </p>

                  <p className="text-sm text-muted-foreground">
                    Quando ativado, ao abrir uma transação para classificar, o sistema
                    procura histórico parecido e preenche tipo, categoria, fundo e
                    favorecido. Nada é salvo automaticamente.
                  </p>
                </div>

                <Switch
                  checked={effectiveAutoFillClassificationSuggestions}
                  disabled={!canAdmin}
                  onCheckedChange={setAutoFillClassificationSuggestions}
                />
              </div>
            </div>

            <div className="space-y-4 rounded-lg border p-4">
              <div className="space-y-1">
                <p className="text-sm font-medium">Regras de documentação</p>
                <p className="text-sm text-muted-foreground">
                  Defina as regras gerais de conferência documental da organização.
                  Categorias específicas ainda podem dispensar ou exigir documentos.
                </p>
              </div>

              <div className="flex items-start justify-between gap-4 border-t pt-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium">
                    Despesas exigem documento fiscal por padrão
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Quando ativado, despesas liquidadas cobram documento fiscal/documental,
                    exceto categorias configuradas como dispensadas.
                  </p>
                </div>

                <Switch
                  checked={effectiveRequireFiscalDocumentForExpenses}
                  disabled={!canAdmin}
                  onCheckedChange={setRequireFiscalDocumentForExpenses}
                />
              </div>

              <div className="flex items-start justify-between gap-4 border-t pt-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium">
                    Receitas exigem comprovante por padrão
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Normalmente fica desligado. Ative se a organização quiser cobrar
                    comprovante também para receitas recebidas.
                  </p>
                </div>

                <Switch
                  checked={effectiveRequireProofForIncomes}
                  disabled={!canAdmin}
                  onCheckedChange={setRequireProofForIncomes}
                />
              </div>
            </div>

            <div className="flex flex-col gap-3 border-t pt-4 md:flex-row md:items-center md:justify-between">
              <p className="text-xs text-muted-foreground">
                Esta configuração vale apenas para a organização atual.
              </p>

              {!canAdmin && (
                <Badge variant="outline">
                  Acesso somente leitura
                </Badge>
              )}
              {canAdmin && (
                <Button
                  type="button"
                  onClick={handleSave}
                  disabled={!hasChanged || updateSettingsMutation.isPending}
                >
                  <Save className="mr-2 size-4" />
                  {updateSettingsMutation.isPending
                    ? "Salvando..."
                    : "Salvar configurações"}
                </Button>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

function FinancialSettingsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border p-4">
        <div className="space-y-3">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>

      <div className="flex justify-end">
        <Skeleton className="h-10 w-40" />
      </div>
    </div>
  )
}