import {
  useMemo,
  useState,
} from "react"

import {
  Info,
  ListChecks,
} from "lucide-react"

import {
  Button,
} from "@/components/ui/button"

import {
  Input,
} from "@/components/ui/input"

import {
  Label,
} from "@/components/ui/label"

import {
  CategoryComboboxWithCreate,
} from "@/features/categories/components/category-combobox-with-create"

import {
  FundComboboxWithCreate,
} from "@/features/funds/components/fund-combobox-with-create"

import {
  FinancialPartyCombobox,
} from "@/features/financial-parties/components/financial-party-combobox"

import type {
  FinancialTransaction,
  TransactionClassificationPrefill,
} from "../financial-transaction-types"

type Props = {
  transactions:
    FinancialTransaction[]

  onStart:
    (
      prefill:
        TransactionClassificationPrefill,
    ) => void

  onCancel:
    () => void
}

export function TransactionClassificationQueueSetup({
  transactions,
  onStart,
  onCancel,
}: Props) {
  const [
    categoryId,
    setCategoryId,
  ] =
    useState("")

  const [
    description,
    setDescription,
  ] =
    useState("")

  const [
    fundId,
    setFundId,
  ] =
    useState("")

  const [
    sourcePartyId,
    setSourcePartyId,
  ] =
    useState("")

  const [
    recipientPartyId,
    setRecipientPartyId,
  ] =
    useState("")

  const sharedType =
    useMemo(
      () => {
        const firstType =
          transactions[0]?.type

        if (
          firstType !==
            "INCOME" &&
          firstType !==
            "EXPENSE"
        ) {
          return null
        }

        const allSameType =
          transactions.every(
            (
              transaction,
            ) =>
              transaction.type ===
              firstType,
          )

        return allSameType
          ? firstType
          : null
      },
      [
        transactions,
      ],
    )

  function handleFundChange(
    value:
      string,
  ) {
    setFundId(
      value,
    )

    if (!value) {
      setSourcePartyId(
        "",
      )

      setRecipientPartyId(
        "",
      )
    }
  }

  function handleStart() {
    const trimmedDescription =
      description.trim()

    onStart({
      categoryId:
        sharedType &&
        categoryId
          ? categoryId
          : undefined,

      description:
        trimmedDescription ||
        undefined,

      allocation:
        sharedType &&
        fundId
          ? {
              fundId,

              sourcePartyId:
                sharedType ===
                  "INCOME" &&
                sourcePartyId
                  ? sourcePartyId
                  : undefined,

              recipientPartyId:
                recipientPartyId ||
                undefined,
            }
          : undefined,
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-3 rounded-xl border bg-blue-50 p-4 text-blue-950">
        <Info className="mt-0.5 size-5 shrink-0" />

        <div className="space-y-1">
          <p className="font-medium">
            Pré-preenchimento opcional
          </p>

          <p className="text-sm leading-relaxed text-blue-900">
            Os dados abaixo serão apenas preenchidos
            nas {transactions.length} movimentações
            selecionadas. Nada será salvo até você
            revisar e salvar cada classificação.
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <Label>
          Descrição interna
        </Label>

        <Input
          value={
            description
          }
          placeholder="Ex: Venda balcão"
          onChange={(
            event,
          ) =>
            setDescription(
              event.target.value,
            )
          }
        />

        <p className="text-xs text-muted-foreground">
          Deixe vazio para manter a descrição individual
          ou usar uma sugestão histórica quando existir.
        </p>
      </div>

      {sharedType ? (
        <>
          <div className="rounded-lg border bg-muted/30 p-3 text-sm">
            Todas as selecionadas são{" "}
            <strong>
              {sharedType ===
              "INCOME"
                ? "receitas"
                : "despesas"}
            </strong>
            . Por isso podemos também pré-preencher
            categoria e alocação.
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>
                Categoria
              </Label>

              <CategoryComboboxWithCreate
                value={
                  categoryId
                }
                type={
                  sharedType
                }
                allowClear
                clearLabel="Não pré-preencher categoria"
                placeholder="Não pré-preencher"
                onChange={
                  setCategoryId
                }
              />
            </div>

            <div className="space-y-2">
              <Label>
                Fundo
              </Label>

              <FundComboboxWithCreate
                value={
                  fundId
                }
                allowClear
                clearLabel="Não pré-preencher alocação"
                placeholder="Não pré-preencher alocação"
                onChange={
                  handleFundChange
                }
              />
            </div>
          </div>

          {fundId && (
            <div className="space-y-4 rounded-xl border p-4">
              <div>
                <p className="text-sm font-medium">
                  Alocação universal
                </p>

                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  Cada movimentação será aberta com 100%
                  do seu próprio valor neste fundo.
                  A competência continuará sendo o mês
                  da própria movimentação.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {sharedType ===
                  "INCOME" && (
                  <div className="space-y-2">
                    <Label>
                      Origem da receita
                    </Label>

                    <FinancialPartyCombobox
                      role="INCOME_SOURCE"
                      value={
                        sourcePartyId
                      }
                      allowClear
                      clearLabel="Deixar para sugestão ou revisão"
                      onChange={
                        setSourcePartyId
                      }
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label>
                    {sharedType ===
                    "INCOME"
                      ? "Destinatário / favorecido"
                      : "Recebedor do pagamento"}
                  </Label>

                  <FinancialPartyCombobox
                    role="PAYMENT_RECIPIENT"
                    value={
                      recipientPartyId
                    }
                    allowClear
                    clearLabel={
                      sharedType ===
                      "INCOME"
                        ? "Sem destinação universal"
                        : "Deixar para sugestão ou revisão"
                    }
                    onChange={
                      setRecipientPartyId
                    }
                  />
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
          <p className="font-medium">
            Há receitas e despesas na mesma seleção.
          </p>

          <p className="mt-1 leading-relaxed text-amber-900">
            A descrição universal ainda pode ser usada,
            mas categoria e alocação não serão
            pré-preenchidas porque dependem do tipo
            da movimentação. Para usar esses campos,
            filtre receitas ou despesas antes de selecionar.
          </p>
        </div>
      )}

      <div className="flex flex-wrap justify-end gap-2 border-t pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={
            onCancel
          }
        >
          Cancelar
        </Button>

        <Button
          type="button"
          onClick={
            handleStart
          }
        >
          <ListChecks className="mr-2 size-4" />
          Iniciar revisão
        </Button>
      </div>
    </div>
  )
}