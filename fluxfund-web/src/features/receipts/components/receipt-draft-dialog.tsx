import {
  useEffect,
} from "react"

import {
  zodResolver,
} from "@hookform/resolvers/zod"

import {
  Controller,
  useForm,
  useWatch,
} from "react-hook-form"

import {
  FileSignature,
  Info,
} from "lucide-react"

import {
  toast,
} from "sonner"

import {
  Button,
} from "@/components/ui/button"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

import {
  Input,
} from "@/components/ui/input"

import {
  Label,
} from "@/components/ui/label"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import {
  Textarea,
} from "@/components/ui/textarea"

import {
  CurrencyInput,
} from "@/components/form/currency-input"

import {
  FinancialPartyCombobox,
} from "@/features/financial-parties/components/financial-party-combobox"

import {
  FundComboboxWithCreate,
} from "@/features/funds/components/fund-combobox-with-create"

import {
  getApiErrorMessage,
} from "@/utils/api-error"

import {
  isIncomingReceiptType,
  receiptSourceTypeLabels,
  receiptTypeLabels,
} from "../receipt-labels"

import {
  receiptDraftFormSchema,
  type ReceiptDraftFormData,
} from "../receipt-schema"

import type {
  CreateReceiptDraftRequest,
  Receipt,
  ReceiptDraftSource,
  ReceiptType,
} from "../receipt-types"

import {
  useReceiptMutations,
} from "../hooks/use-receipt-mutations"
import { EntityCombobox } from "@/components/form/entity-combobox"

type Props = {
  open: boolean

  onOpenChange:
  (
    open:
      boolean,
  ) => void

  receipt?:
  Receipt | null

  source?:
  ReceiptDraftSource | null
}

function today() {
  return new Date()
    .toISOString()
    .slice(
      0,
      10,
    )
}

function buildDefaultValues({
  receipt,
  source,
}: {
  receipt?:
  Receipt | null

  source?:
  ReceiptDraftSource | null
}): ReceiptDraftFormData {
  if (receipt) {
    return {
      sourceType:
        receipt.sourceType,

      financialTransactionId:
        receipt.financialTransactionId ??
        "",

      transactionAllocationId:
        receipt.transactionAllocationId ??
        "",

      receiptType:
        receipt.receiptType,

      amount:
        receipt.amount,

      paymentDate:
        receipt.paymentDate,

      counterpartyMode:
        receipt.counterparty.partyId
          ? "REGISTERED"
          : "MANUAL",

      counterpartyPartyId:
        receipt.counterparty.partyId ??
        "",

      counterpartyName:
        receipt.counterparty.name ??
        "",

      counterpartyDocument:
        receipt.counterparty.document ??
        "",

      counterpartyAddress:
        receipt.counterparty.address ??
        "",

      beneficiaryMode:
        !receipt.beneficiary
          ? "NONE"
          : receipt.beneficiary.partyId
            ? "REGISTERED"
            : "MANUAL",

      beneficiaryPartyId:
        receipt.beneficiary?.partyId ??
        "",

      beneficiaryName:
        receipt.beneficiary?.name ??
        "",

      beneficiaryDocument:
        receipt.beneficiary?.document ??
        "",

      fundId:
        receipt.fundId ??
        "",

      fundName:
        receipt.fundId
          ? ""
          : receipt.fundName ??
          "",

      purposeDescription:
        receipt.purposeDescription,

      placeCity:
        receipt.placeCity ??
        "",

      placeState:
        receipt.placeState ??
        "",

      signatoryName:
        receipt.signatoryName ??
        "",

      signatoryTitle:
        receipt.signatoryTitle ??
        "",

      notes:
        receipt.notes ??
        "",
    }
  }

  const sourceType =
    source?.sourceType ??
    "MANUAL"

  return {
    sourceType,

    financialTransactionId:
      source?.financialTransactionId ??
      "",

    transactionAllocationId:
      source?.transactionAllocationId ??
      "",

    receiptType:
      source?.defaultReceiptType ??
      "DONATION",

    amount:
      source?.defaultAmount,

    paymentDate:
      source?.defaultPaymentDate ??
      today(),

    counterpartyMode:
      sourceType ===
        "ALLOCATION"
        ? "INFERRED"
        : "REGISTERED",

    counterpartyPartyId:
      "",

    counterpartyName:
      "",

    counterpartyDocument:
      "",

    counterpartyAddress:
      "",

    beneficiaryMode:
      "NONE",

    beneficiaryPartyId:
      "",

    beneficiaryName:
      "",

    beneficiaryDocument:
      "",

    fundId:
      "",

    fundName:
      "",

    purposeDescription:
      source?.defaultPurpose ??
      "",

    placeCity:
      "",

    placeState:
      "",

    signatoryName:
      "",

    signatoryTitle:
      "",

    notes:
      "",
  }
}

export function ReceiptDraftDialog({
  open,
  onOpenChange,
  receipt,
  source,
}: Props) {
  const {
    createMutation,
    updateMutation,
  } =
    useReceiptMutations()

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: {
      errors,
    },
  } =
    useForm<ReceiptDraftFormData>({
      resolver:
        zodResolver(
          receiptDraftFormSchema,
        ),

      defaultValues:
        buildDefaultValues({
          receipt,
          source,
        }),
    })

  useEffect(() => {
    if (!open) {
      return
    }

    reset(
      buildDefaultValues({
        receipt,
        source,
      }),
    )
  }, [
    open,
    receipt,
    reset,
    source,
  ])

  const receiptType =
    useWatch({
      control,
      name:
        "receiptType",
    })

  const sourceType =
    useWatch({
      control,
      name:
        "sourceType",
    })

  const counterpartyMode =
    useWatch({
      control,
      name:
        "counterpartyMode",
    })

  const beneficiaryMode =
    useWatch({
      control,
      name:
        "beneficiaryMode",
    })

  const incoming =
    isIncomingReceiptType(
      receiptType,
    )

  const isSubmitting =
    createMutation.isPending ||
    updateMutation.isPending

  function submit(
    data:
      ReceiptDraftFormData,
  ) {
    const payload:
      CreateReceiptDraftRequest = {
      sourceType:
        data.sourceType,

      financialTransactionId:
        data.financialTransactionId ||
        null,

      transactionAllocationId:
        data.transactionAllocationId ||
        null,

      receiptType:
        data.receiptType,

      amount:
        data.amount,

      paymentDate:
        data.paymentDate ||
        undefined,

      counterpartyPartyId:
        data.counterpartyMode ===
          "REGISTERED"
          ? data.counterpartyPartyId ||
          null
          : null,

      counterpartyName:
        data.counterpartyMode ===
          "MANUAL"
          ? data.counterpartyName ||
          null
          : null,

      counterpartyDocument:
        data.counterpartyMode ===
          "MANUAL"
          ? data.counterpartyDocument ||
          null
          : null,

      counterpartyAddress:
        data.counterpartyMode ===
          "MANUAL"
          ? data.counterpartyAddress ||
          null
          : null,

      beneficiaryPartyId:
        incoming &&
          data.beneficiaryMode ===
          "REGISTERED"
          ? data.beneficiaryPartyId ||
          null
          : null,

      beneficiaryName:
        incoming &&
          data.beneficiaryMode ===
          "MANUAL"
          ? data.beneficiaryName ||
          null
          : null,

      beneficiaryDocument:
        incoming &&
          data.beneficiaryMode ===
          "MANUAL"
          ? data.beneficiaryDocument ||
          null
          : null,

      fundId:
        data.fundId ||
        null,

      fundName:
        !data.fundId
          ? data.fundName ||
          null
          : null,

      purposeDescription:
        data.purposeDescription ||
        null,

      placeCity:
        data.placeCity ||
        null,

      placeState:
        data.placeState
          ?.toUpperCase() ||
        null,

      signatoryName:
        data.signatoryName ||
        null,

      signatoryTitle:
        data.signatoryTitle ||
        null,

      notes:
        data.notes ||
        null,
    }

    if (receipt) {
      updateMutation.mutate(
        {
          receiptId:
            receipt.id,

          data:
            payload,
        },
        {
          onSuccess: () => {
            toast.success(
              "Rascunho atualizado.",
            )

            onOpenChange(
              false,
            )
          },

          onError: (error) => {
            toast.error(
              getApiErrorMessage(
                error,
                "Não foi possível atualizar o recibo.",
              ),
            )
          },
        },
      )

      return
    }

    createMutation.mutate(
      payload,
      {
        onSuccess: () => {
          toast.success(
            "Rascunho criado. Confira a prévia antes de emitir.",
          )

          onOpenChange(
            false,
          )
        },

        onError: (error) => {
          toast.error(
            getApiErrorMessage(
              error,
              "Não foi possível criar o recibo.",
            ),
          )
        },
      },
    )
  }

  return (
    <Dialog
      open={open}
      onOpenChange={
        onOpenChange
      }
    >
      <DialogContent className="max-h-[94vh] overflow-y-auto sm:max-w-5xl lg:max-w-6xl">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <FileSignature className="size-5" />
            </div>

            <div>
              <DialogTitle>
                {receipt
                  ? "Editar rascunho"
                  : "Novo recibo"}
              </DialogTitle>

              <DialogDescription>
                Salve como rascunho, confira a prévia e só depois faça a emissão definitiva.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form
          className="space-y-6"
          onSubmit={
            handleSubmit(
              submit,
            )
          }
        >
          <div className="rounded-xl border bg-muted/20 p-4">
            <p className="text-sm font-medium">
              Origem do documento
            </p>

            <p className="mt-1 text-sm text-muted-foreground">
              {
                receiptSourceTypeLabels[
                sourceType
                ]
              }

              {source?.description
                ? ` · ${source.description}`
                : ""}
            </p>
          </div>

          <section className="grid gap-4 md:grid-cols-2">
            <Field label="Tipo do recibo">
              <Controller
                control={
                  control
                }
                name="receiptType"
                render={({
                  field,
                }) => (
                  <EntityCombobox
                    value={
                      field.value
                    }
                    options={
                      (
                        Object.keys(
                          receiptTypeLabels,
                        ) as
                        ReceiptType[]
                      ).map(
                        (type) => ({
                          value:
                            type,

                          label:
                            receiptTypeLabels[
                            type
                            ],
                        }),
                      )
                    }
                    placeholder="Selecione o tipo"
                    searchPlaceholder="Buscar tipo de recibo..."
                    emptyMessage="Nenhum tipo encontrado."
                    allowClear={
                      false
                    }
                    onChange={(
                      value,
                    ) =>
                      field.onChange(
                        value as
                        ReceiptType,
                      )
                    }
                  />
                )}
              />
            </Field>

            <Field
              label="Valor"
              error={
                errors.amount
                  ?.message
              }
            >
              <Controller
                control={
                  control
                }
                name="amount"
                render={({
                  field,
                }) => (
                  <CurrencyInput
                    value={
                      field.value
                    }
                    allowEmpty
                    onValueChange={
                      field.onChange
                    }
                  />
                )}
              />
            </Field>

            <Field
              label="Data do pagamento"
              error={
                errors.paymentDate
                  ?.message
              }
            >
              <Input
                type="date"
                {...register(
                  "paymentDate",
                )}
              />
            </Field>

            <Field
              label="Finalidade"
              className="md:col-span-2"
            >
              <Input
                placeholder="Ex.: Doação destinada ao Projeto Piauí"
                {...register(
                  "purposeDescription",
                )}
              />
            </Field>
          </section>

          <section className="space-y-4 rounded-xl border p-4">
            <div>
              <p className="font-medium">
                {incoming
                  ? "Quem realizou o pagamento?"
                  : "Quem recebeu o pagamento?"}
              </p>

              <p className="text-sm text-muted-foreground">
                Use um contato cadastrado, preencha manualmente ou deixe o FluxFund identificar pela alocação.
              </p>
            </div>

            <Controller
              control={
                control
              }
              name="counterpartyMode"
              render={({
                field,
              }) => (
                <Select
                  value={
                    field.value
                  }
                  onValueChange={
                    field.onChange
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>

                  <SelectContent>
                    {sourceType ===
                      "ALLOCATION" && (
                        <SelectItem value="INFERRED">
                          Usar dados da alocação
                        </SelectItem>
                      )}

                    <SelectItem value="REGISTERED">
                      Contato cadastrado
                    </SelectItem>

                    <SelectItem value="MANUAL">
                      Informar manualmente
                    </SelectItem>
                  </SelectContent>
                </Select>
              )}
            />

            {counterpartyMode ===
              "REGISTERED" && (
                <Controller
                  control={
                    control
                  }
                  name="counterpartyPartyId"
                  render={({
                    field,
                  }) => (
                    <FinancialPartyCombobox
                      role={
                        incoming
                          ? "INCOME_SOURCE"
                          : "PAYMENT_RECIPIENT"
                      }
                      value={
                        field.value ??
                        ""
                      }
                      allowClear
                      onChange={
                        field.onChange
                      }
                    />
                  )}
                />
              )}

            {counterpartyMode ===
              "MANUAL" && (
                <div className="grid gap-4 md:grid-cols-2">
                  <Field
                    label="Nome ou razão social"
                    error={
                      errors
                        .counterpartyName
                        ?.message
                    }
                  >
                    <Input
                      {...register(
                        "counterpartyName",
                      )}
                    />
                  </Field>

                  <Field label="CPF ou CNPJ">
                    <Input
                      {...register(
                        "counterpartyDocument",
                      )}
                    />
                  </Field>

                  <Field
                    label="Endereço"
                    className="md:col-span-2"
                  >
                    <Input
                      {...register(
                        "counterpartyAddress",
                      )}
                    />
                  </Field>
                </div>
              )}
          </section>

          {incoming && (
            <section className="space-y-4 rounded-xl border p-4">
              <div>
                <p className="font-medium">
                  Destinatário indicado
                </p>

                <p className="text-sm text-muted-foreground">
                  Use quando a receita foi destinada a um missionário, projeto ou outro favorecido.
                </p>
              </div>

              <Controller
                control={
                  control
                }
                name="beneficiaryMode"
                render={({
                  field,
                }) => (
                  <Select
                    value={
                      field.value
                    }
                    onValueChange={
                      field.onChange
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>

                    <SelectContent>
                      <SelectItem value="NONE">
                        Sem destinatário indicado
                      </SelectItem>

                      <SelectItem value="REGISTERED">
                        Contato cadastrado
                      </SelectItem>

                      <SelectItem value="MANUAL">
                        Informar manualmente
                      </SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />

              {beneficiaryMode ===
                "REGISTERED" && (
                  <Controller
                    control={
                      control
                    }
                    name="beneficiaryPartyId"
                    render={({
                      field,
                    }) => (
                      <FinancialPartyCombobox
                        role="PAYMENT_RECIPIENT"
                        value={
                          field.value ??
                          ""
                        }
                        allowClear
                        onChange={
                          field.onChange
                        }
                      />
                    )}
                  />
                )}

              {beneficiaryMode ===
                "MANUAL" && (
                  <div className="grid gap-4 md:grid-cols-2">
                    <Field
                      label="Nome do destinatário"
                      error={
                        errors
                          .beneficiaryName
                          ?.message
                      }
                    >
                      <Input
                        {...register(
                          "beneficiaryName",
                        )}
                      />
                    </Field>

                    <Field label="CPF ou CNPJ">
                      <Input
                        {...register(
                          "beneficiaryDocument",
                        )}
                      />
                    </Field>
                  </div>
                )}
            </section>
          )}

          <section className="grid gap-4 rounded-xl border p-4 md:grid-cols-2">
            <Field label="Fundo cadastrado">
              <Controller
                control={
                  control
                }
                name="fundId"
                render={({
                  field,
                }) => (
                  <FundComboboxWithCreate
                    value={
                      field.value ??
                      ""
                    }
                    allowClear
                    clearLabel="Sem fundo cadastrado"
                    onChange={
                      field.onChange
                    }
                  />
                )}
              />
            </Field>

            <Field label="Nome manual do fundo">
              <Input
                placeholder="Usado somente quando nenhum fundo foi selecionado"
                {...register(
                  "fundName",
                )}
              />
            </Field>
          </section>

          <section className="grid gap-4 md:grid-cols-2">
            <Field label="Cidade">
              <Input
                {...register(
                  "placeCity",
                )}
              />
            </Field>

            <Field label="Estado">
              <Input
                maxLength={
                  2
                }
                placeholder="SP"
                {...register(
                  "placeState",
                )}
              />
            </Field>

            <Field label="Nome do assinante">
              <Input
                placeholder="Preenchido automaticamente quando possível"
                {...register(
                  "signatoryName",
                )}
              />
            </Field>

            <Field label="Cargo ou identificação">
              <Input
                {...register(
                  "signatoryTitle",
                )}
              />
            </Field>

            <Field
              label="Observações"
              className="md:col-span-2"
            >
              <Textarea
                rows={
                  3
                }
                {...register(
                  "notes",
                )}
              />
            </Field>
          </section>

          <div className="flex gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-950">
            <Info className="mt-0.5 size-4 shrink-0" />

            <p>
              Salvar não emite o documento. O número oficial só será gerado ao clicar em <strong>Emitir recibo</strong>.
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                onOpenChange(
                  false,
                )
              }
            >
              Cancelar
            </Button>

            <Button
              type="submit"
              disabled={
                isSubmitting
              }
            >
              {isSubmitting
                ? "Salvando..."
                : "Salvar rascunho"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function Field({
  label,
  error,
  className,
  children,
}: {
  label: string
  error?: string
  className?: string
  children:
  React.ReactNode
}) {
  return (
    <div
      className={
        className
      }
    >
      <Label>
        {label}
      </Label>

      <div className="mt-2">
        {children}
      </div>

      {error && (
        <p className="mt-1 text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}