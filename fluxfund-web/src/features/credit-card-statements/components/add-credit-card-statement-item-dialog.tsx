import { zodResolver } from "@hookform/resolvers/zod"
import { Plus } from "lucide-react"
import { useState, type ReactNode } from "react"
import { Controller, useForm, useWatch } from "react-hook-form"
import { toast } from "sonner"

import { CurrencyInput } from "@/components/form/currency-input"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { CategoryComboboxWithCreate } from "@/features/categories/components/category-combobox-with-create"
import { FundComboboxWithCreate } from "@/features/funds/components/fund-combobox-with-create"
import { toReferenceMonthDate } from "@/utils/formatters"
import type { CreditCardStatement } from "../credit-card-statement-types"
import {
  creditCardStatementItemFormSchema,
  type CreditCardStatementItemFormData,
  type CreditCardStatementItemFormInput,
} from "../credit-card-statement-schema"
import { useAddCreditCardStatementItem } from "../hooks/use-add-credit-card-statement-item"
import { getApiErrorMessage } from "@/utils/api-error"
import { normalizeFiscalDocumentNote } from "@/features/financial-transactions/financial-transaction-labels"
import { FiscalDocumentPolicyField } from "@/features/financial-transactions/components/fiscal-document-policy-field"
import { AppDialogBody, AppDialogContent, AppDialogFooter, AppDialogHeader } from "@/components/layout/app-dialog"
import { FinancialPartyCombobox } from "@/features/financial-parties/components/financial-party-combobox"
import { MonthYearPickerPopover } from "@/components/filters/month-year-picker-popover"

type AddCreditCardStatementItemDialogProps = {
  statement: CreditCardStatement
  open?: boolean
  onOpenChange?: (open: boolean) => void
  trigger?: ReactNode | null
}

export function AddCreditCardStatementItemDialog({
  statement,
  open,
  onOpenChange,
  trigger,
}: AddCreditCardStatementItemDialogProps) {

  const [internalOpen, setInternalOpen] = useState(false)

  const dialogOpen = open ?? internalOpen
  const setDialogOpen = onOpenChange ?? setInternalOpen

  const addItemMutation = useAddCreditCardStatementItem()

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    control,
    formState: { errors },
  } = useForm<
    CreditCardStatementItemFormInput,
    unknown,
    CreditCardStatementItemFormData
  >({
    resolver: zodResolver(creditCardStatementItemFormSchema),
    defaultValues: {
      purchaseDate: new Date().toISOString().slice(0, 10),
      description: "",
      amount: 0,
      categoryId: "",
      documentNumber: "",
      fiscalDocumentPolicy: "CATEGORY",
      fiscalDocumentNote: "",
      installmentNumber: undefined,
      installmentCount: undefined,
      fundId: "",
      recipientPartyId: "",
      referenceMonth: statement.dueDate?.slice(0, 7) ?? "",
      allocationAmount: undefined,
    },
  })

  const selectedCategoryId = useWatch({ control, name: "categoryId" })
  const selectedFundId = useWatch({ control, name: "fundId" })
  const selectedRecipientPartyId = useWatch({ control, name: "recipientPartyId" })

  const fiscalDocumentPolicy = useWatch({
    control,
    name: "fiscalDocumentPolicy",
  })

  const fiscalDocumentNote = useWatch({
    control,
    name: "fiscalDocumentNote",
  })

  function handleOpenChange(value: boolean) {
    if (!value) {
      reset()
    }

    setDialogOpen(value)
  }

  function handleAddItem(data: CreditCardStatementItemFormData) {
    const shouldCreateAllocation = Boolean(data.fundId && data.allocationAmount)

    addItemMutation.mutate(
      {
        statementId: statement.id,
        data: {
          purchaseDate: data.purchaseDate,
          description: data.description,
          amount: data.amount,
          categoryId: data.categoryId || null,
          documentNumber: data.documentNumber || null,
          fiscalDocumentPolicy: data.fiscalDocumentPolicy,
          fiscalDocumentNote: normalizeFiscalDocumentNote(
            data.fiscalDocumentPolicy,
            data.fiscalDocumentNote,
          ),
          installmentNumber:
            data.installmentNumber && data.installmentNumber > 0
              ? data.installmentNumber
              : null,
          installmentCount:
            data.installmentCount && data.installmentCount > 0
              ? data.installmentCount
              : null,
          allocations: shouldCreateAllocation
            ? [
              {
                fundId: data.fundId ?? "",
                recipientPartyId: data.recipientPartyId || null,
                amount: data.allocationAmount ?? data.amount,
                referenceMonth: toReferenceMonthDate(data.referenceMonth),
              },
            ]
            : [],
        },
      },
      {
        onSuccess: () => {
          toast.success("Item adicionado à fatura.")
          handleOpenChange(false)
        },
        onError: (error) => {
          toast.error(
            getApiErrorMessage(error, "Não foi possível adicionar o item à fatura."),
          )
        },
      },
    )
  }

  const canAddItem = statement.status === "OPEN" || statement.status === "CLOSED"

  return (
    <Dialog open={dialogOpen} onOpenChange={handleOpenChange}>
      {trigger === undefined ? (
        <DialogTrigger asChild>
          <Button size="sm" variant="outline" disabled={!canAddItem}>
            <Plus className="mr-2 size-4" />
            Item
          </Button>
        </DialogTrigger>
      ) : (
        trigger
      )}

      <AppDialogContent size="xl">
        <AppDialogHeader
          icon={<Plus className="size-4 text-muted-foreground" />}
          title="Adicionar item à fatura"
          description="O item será criado como uma despesa de cartão e aparecerá também na tela de transações."
        />

        <form onSubmit={handleSubmit(handleAddItem)} className="contents">
          <AppDialogBody className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="purchaseDate">Data da compra</Label>
                <Input id="purchaseDate" type="date" {...register("purchaseDate")} />
                {errors.purchaseDate && (
                  <p className="text-sm text-destructive">
                    {errors.purchaseDate.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">Valor</Label>
                <Controller
                  name="amount"
                  control={control}
                  render={({ field }) => (
                    <CurrencyInput
                      id="amount"
                      value={field.value as number | null | undefined}
                      onValueChange={field.onChange}
                    />
                  )}
                />
                {errors.amount && (
                  <p className="text-sm text-destructive">{errors.amount.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                placeholder="Ex: Combustível, hospedagem, compra de material..."
                {...register("description")}
              />
              {errors.description && (
                <p className="text-sm text-destructive">
                  {errors.description.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Categoria</Label>
              <CategoryComboboxWithCreate
                value={selectedCategoryId ?? ""}
                type="EXPENSE"
                placeholder="Selecione a categoria"
                searchPlaceholder="Buscar categoria..."
                emptyMessage="Nenhuma categoria de despesa encontrada."
                onChange={(value) =>
                  setValue("categoryId", value, { shouldValidate: true })
                }
              />
              {errors.categoryId && (
                <p className="text-sm text-destructive">
                  {errors.categoryId.message}
                </p>
              )}
            </div>

            <FiscalDocumentPolicyField
              value={fiscalDocumentPolicy ?? "CATEGORY"}
              note={fiscalDocumentNote ?? ""}
              policyError={errors.fiscalDocumentPolicy?.message}
              noteError={errors.fiscalDocumentNote?.message}
              onValueChange={(value) => {
                setValue("fiscalDocumentPolicy", value, {
                  shouldValidate: true,
                })

                if (value === "CATEGORY" || value === "REQUIRED") {
                  setValue("fiscalDocumentNote", "", {
                    shouldValidate: true,
                  })
                }
              }}
              onNoteChange={(value) =>
                setValue("fiscalDocumentNote", value, {
                  shouldValidate: true,
                })
              }
            />

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="documentNumber">Documento</Label>
                <Input
                  id="documentNumber"
                  placeholder="Opcional"
                  {...register("documentNumber")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="installmentNumber">Parcela</Label>
                <Input
                  id="installmentNumber"
                  type="number"
                  min={1}
                  placeholder="Ex: 1"
                  {...register("installmentNumber")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="installmentCount">Total parcelas</Label>
                <Input
                  id="installmentCount"
                  type="number"
                  min={1}
                  placeholder="Ex: 3"
                  {...register("installmentCount")}
                />
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <div>
                <h3 className="text-sm font-medium">Alocação inicial</h3>
                <p className="text-xs text-muted-foreground">
                  Opcional. Você também pode alocar depois pela tela de transações.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Fundo</Label>
                  <FundComboboxWithCreate
                    value={selectedFundId ?? ""}
                    allowClear
                    clearLabel="Sem alocação agora"
                    onChange={(value) =>
                      setValue("fundId", value, { shouldValidate: true })
                    }
                  />
                  {errors.fundId && (
                    <p className="text-sm text-destructive">{errors.fundId.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>
                    Recebedor do pagamento
                  </Label>

                  <FinancialPartyCombobox
                    role="PAYMENT_RECIPIENT"
                    value={
                      selectedRecipientPartyId ??
                      ""
                    }
                    allowClear
                    clearLabel="Sem recebedor identificado"
                    placeholder="Sem recebedor identificado"
                    onChange={(value) =>
                      setValue(
                        "recipientPartyId",
                        value,
                        {
                          shouldValidate:
                            true,
                        },
                      )
                    }
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="referenceMonth">Competência</Label>
                  <Controller
                    name="referenceMonth"
                    control={control}
                    render={({ field }) => (
                      <MonthYearPickerPopover
                        value={
                          field.value ?? ""
                        }
                        onChange={
                          field.onChange
                        }
                        placeholder="Selecionar competência"
                      />
                    )}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="allocationAmount">Valor alocado</Label>
                  <Controller
                    name="allocationAmount"
                    control={control}
                    render={({ field }) => (
                      <CurrencyInput
                        id="allocationAmount"
                        value={field.value as number | null | undefined}
                        onValueChange={field.onChange}
                      />
                    )}
                  />
                  {errors.allocationAmount && (
                    <p className="text-sm text-destructive">
                      {errors.allocationAmount.message}
                    </p>
                  )}
                </div>
              </div>
            </div>

          </AppDialogBody>

          <AppDialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={addItemMutation.isPending}
              onClick={() => handleOpenChange(false)}
            >
              Cancelar
            </Button>

            <Button type="submit" disabled={addItemMutation.isPending}>
              {addItemMutation.isPending ? "Adicionando..." : "Adicionar item"}
            </Button>
          </AppDialogFooter>
        </form>
      </AppDialogContent>
    </Dialog>
  )
}
