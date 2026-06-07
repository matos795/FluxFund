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

export function FinancialSettingsCard() {

  const { canAdmin } = usePermissions()

  const [defaultFundId, setDefaultFundId] = useState<string | null>(null)

  const settingsQuery = useOrganizationSettings()
  const updateSettingsMutation = useUpdateOrganizationSettings()

  const fundsQuery = useFundOptions()
  const funds = useMemo(() => fundsQuery.data ?? [], [fundsQuery.data])

  const settings = settingsQuery.data

  const selectedFundId =
    defaultFundId === null ? settings?.defaultFund?.id ?? null : defaultFundId

  const selectedFund = useMemo(() => {
    return funds.find((fund) => fund.id === selectedFundId) ?? null
  }, [funds, selectedFundId])

  function handleSave() {
    updateSettingsMutation.mutate(
      {
        defaultFundId: defaultFundId || null,
      },
      {
        onSuccess: () => {
          toast.success("Configurações financeiras salvas com sucesso.")
        },
        onError: () => {
          toast.error("Não foi possível salvar as configurações.")
        },
      },
    )
  }

  const isLoading = settingsQuery.isLoading || fundsQuery.isLoading
  const isError = settingsQuery.isError || fundsQuery.isError
  const hasChanged = (settings?.defaultFund?.id ?? null) !== selectedFundId

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
                  value={selectedFundId ?? ""}
                  allowClear={false}
                  onChange={(value) => setDefaultFundId(value)}
                />

                {selectedFund && (
                  <p className="text-xs text-muted-foreground">
                    Atual: {selectedFund.label}
                  </p>
                )}
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