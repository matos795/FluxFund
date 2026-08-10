import {
  useEffect,
  useState,
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
  ChevronDown,
  ChevronUp,
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
  incomingReceiptTypes,
  isIncomingReceiptType,
  outgoingReceiptTypes,
  receiptDirectionLabels,
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
  ReceiptDirection,
  ReceiptDraftSource,
  ReceiptType,
} from "../receipt-types"

import {
  useReceiptMutations,
} from "../hooks/use-receipt-mutations"
import { EntityCombobox } from "@/components/form/entity-combobox"
import { formatCpfOrCnpj } from "@/utils/input-masks"
import { useOrganizationProfile } from "@/features/organization-profile/hooks/use-organization-profile"
import { useFinancialPartyOptions } from "@/features/financial-parties/hooks/use-financial-party-options"
import { formatCurrency, formatDate } from "@/utils/formatters"
import { useFundOptions } from "@/features/funds/hooks/use-fund-options"

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

      direction:
        receipt.direction,

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

  const direction:
    ReceiptDirection =
    source?.defaultDirection ??
    (
      source?.defaultReceiptType
        ? isIncomingReceiptType(
          source.defaultReceiptType,
        )
          ? "RECEIVED_BY_ORGANIZATION"
          : "PAID_BY_ORGANIZATION"
        : "RECEIVED_BY_ORGANIZATION"
    )

  const defaultReceiptType:
    ReceiptType =
    source?.defaultReceiptType ??
    (
      direction ===
        "RECEIVED_BY_ORGANIZATION"
        ? "DONATION"
        : "OTHER_PAYMENT"
    )

  return {
    sourceType,

    direction,

    financialTransactionId:
      source?.financialTransactionId ??
      "",

    transactionAllocationId:
      source?.transactionAllocationId ??
      "",

    receiptType:
      defaultReceiptType,

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


function appendDocument(
  name: string,
  document?: string | null,
) {
  const normalizedDocument =
    document?.trim()

  if (!normalizedDocument) {
    return name
  }

  return `${name}, CPF/CNPJ ${formatCpfOrCnpj(
    normalizedDocument,
  )}`
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

  const [
    detailsOpen,
    setDetailsOpen,
  ] = useState(false)

  const {
    register,
    control,
    handleSubmit,
    reset,
    setValue,
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

  const direction =
    useWatch({
      control,
      name:
        "direction",
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

  const amount =
    useWatch({
      control,
      name: "amount",
    })

  const paymentDate =
    useWatch({
      control,
      name: "paymentDate",
    })

  const purposeDescription =
    useWatch({
      control,
      name: "purposeDescription",
    })

  const counterpartyPartyId =
    useWatch({
      control,
      name: "counterpartyPartyId",
    })

  const counterpartyName =
    useWatch({
      control,
      name: "counterpartyName",
    })

  const counterpartyDocument =
    useWatch({
      control,
      name: "counterpartyDocument",
    })

  const signatoryName =
    useWatch({
      control,
      name: "signatoryName",
    })

  const beneficiaryPartyId =
    useWatch({
      control,
      name: "beneficiaryPartyId",
    })

  const beneficiaryName =
    useWatch({
      control,
      name: "beneficiaryName",
    })

  const beneficiaryDocument =
    useWatch({
      control,
      name: "beneficiaryDocument",
    })

  const fundId =
    useWatch({
      control,
      name: "fundId",
    })

  const fundName =
    useWatch({
      control,
      name: "fundName",
    })

  const incoming =
    direction ===
    "RECEIVED_BY_ORGANIZATION"

  const organizationProfileQuery =
    useOrganizationProfile()

  const counterpartyOptionsQuery =
    useFinancialPartyOptions(
      incoming
        ? "INCOME_SOURCE"
        : "PAYMENT_RECIPIENT",
    )

  const beneficiaryOptionsQuery =
    useFinancialPartyOptions(
      "PAYMENT_RECIPIENT",
    )

  const fundOptionsQuery =
    useFundOptions()

  const selectedBeneficiary =
    beneficiaryOptionsQuery.data?.find(
      party =>
        party.id ===
        beneficiaryPartyId,
    )

  const previewBeneficiaryName =
    beneficiaryMode === "REGISTERED"
      ? selectedBeneficiary?.label ?? ""
      : beneficiaryMode === "MANUAL"
        ? beneficiaryName?.trim() ?? ""
        : ""

  const previewBeneficiaryDocument =
    beneficiaryMode === "REGISTERED"
      ? selectedBeneficiary?.document ?? ""
      : beneficiaryMode === "MANUAL"
        ? beneficiaryDocument?.trim() ?? ""
        : ""

  const selectedFund =
    fundOptionsQuery.data?.find(
      fund =>
        fund.id ===
        fundId,
    )

  const previewFundName =
    selectedFund?.label ??
    fundName?.trim() ??
    ""

  const beneficiaryText =
    previewBeneficiaryName
      ? appendDocument(
        previewBeneficiaryName,
        previewBeneficiaryDocument,
      )
      : ""

  const destinationPreviewText =
    incoming &&
      beneficiaryText
      ? `Destinação informada: ${beneficiaryText}${previewFundName
        ? `, fundo ${previewFundName}`
        : ""
      }.`
      : ""

  const selectedCounterparty =
    counterpartyOptionsQuery.data?.find(
      party =>
        party.id ===
        counterpartyPartyId,
    )

  const previewCounterpartyName =
    counterpartyMode === "REGISTERED"
      ? selectedCounterparty?.label ?? ""
      : counterpartyMode === "MANUAL"
        ? counterpartyName?.trim() ?? ""
        : ""

  const previewCounterpartyDocument =
    counterpartyMode === "REGISTERED"
      ? selectedCounterparty?.document ?? ""
      : counterpartyMode === "MANUAL"
        ? counterpartyDocument?.trim() ?? ""
        : ""

  const organizationProfile =
    organizationProfileQuery.data

  const previewOrganizationName =
    organizationProfile
      ?.legalName
      ?.trim() ||
    organizationProfile
      ?.name
      ?.trim() ||
    "organização"

  const previewOrganizationDocument =
    organizationProfile
      ?.cnpj
      ?.trim() ?? ""

  const numericAmount =
    Number(
      amount ?? 0,
    )

  const previewAmount =
    Number.isFinite(
      numericAmount,
    ) &&
      numericAmount > 0
      ? formatCurrency(
        numericAmount,
      )
      : "[valor]"

  const previewPaymentDate =
    paymentDate
      ? formatDate(
        paymentDate,
      )
      : "[data]"

  const previewPurpose =
    purposeDescription
      ?.trim() ||
    "[finalidade]"

  const previewCounterparty =
    previewCounterpartyName ||
    (
      counterpartyMode ===
        "INFERRED"
        ? "[pessoa identificada pela alocação]"
        : "[pessoa / empresa]"
    )

  const counterpartyText =
    appendDocument(
      previewCounterparty,
      previewCounterpartyDocument,
    )

  const organizationText =
    appendDocument(
      previewOrganizationName,
      previewOrganizationDocument,
    )

  const previewSignatoryName =
    signatoryName
      ?.trim() ||
    previewCounterpartyName

  const receiptPreviewText =
    incoming
      ? `Recebemos de ${counterpartyText} a importância de ${previewAmount}, referente a ${previewPurpose}, com pagamento realizado em ${previewPaymentDate}.`
      : `Declaro ter recebido de ${organizationText} a importância de ${previewAmount}, referente a ${previewPurpose}, com pagamento realizado em ${previewPaymentDate}.`

  const availableReceiptTypes =
    incoming
      ? incomingReceiptTypes
      : outgoingReceiptTypes

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

            handleOpenChange(
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

          handleOpenChange(
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

  function handleOpenChange(
    nextOpen: boolean,
  ) {
    if (!nextOpen) {
      setDetailsOpen(false)
    }

    onOpenChange(
      nextOpen,
    )
  }

  return (
    <Dialog
      open={open}
      onOpenChange={
        handleOpenChange
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

            <Field label="Movimentação">
              {sourceType ===
                "MANUAL" ? (
                <Controller
                  control={
                    control
                  }
                  name="direction"
                  render={({
                    field,
                  }) => (
                    <Select
                      value={
                        field.value
                      }
                      onValueChange={(
                        value,
                      ) => {
                        const nextDirection =
                          value as
                          ReceiptDirection

                        field.onChange(
                          nextDirection,
                        )

                        setValue(
                          "receiptType",
                          nextDirection ===
                            "RECEIVED_BY_ORGANIZATION"
                            ? "DONATION"
                            : "OTHER_PAYMENT",
                          {
                            shouldDirty:
                              true,

                            shouldValidate:
                              true,
                          },
                        )

                        if (
                          nextDirection ===
                          "PAID_BY_ORGANIZATION"
                        ) {
                          setValue(
                            "beneficiaryMode",
                            "NONE",
                            {
                              shouldDirty:
                                true,
                            },
                          )
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a movimentação" />
                      </SelectTrigger>

                      <SelectContent>
                        <SelectItem value="RECEIVED_BY_ORGANIZATION">
                          Valor recebido
                        </SelectItem>

                        <SelectItem value="PAID_BY_ORGANIZATION">
                          Valor pago
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              ) : (
                <div className="flex h-9 items-center rounded-md border bg-muted/40 px-3 text-sm">
                  {
                    receiptDirectionLabels[
                    direction
                    ]
                  }
                </div>
              )}
            </Field>

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
                      availableReceiptTypes
                        .map(
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
                    <Controller
                      control={
                        control
                      }
                      name="counterpartyDocument"
                      render={({
                        field,
                      }) => (
                        <Input
                          ref={
                            field.ref
                          }
                          name={
                            field.name
                          }
                          value={formatCpfOrCnpj(
                            field.value ?? "",
                          )}
                          inputMode="numeric"
                          placeholder="CPF ou CNPJ"
                          onBlur={
                            field.onBlur
                          }
                          onChange={(
                            event,
                          ) =>
                            field.onChange(
                              formatCpfOrCnpj(
                                event.target.value,
                              ),
                            )
                          }
                        />
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
                      <Controller
                        control={
                          control
                        }
                        name="beneficiaryDocument"
                        render={({
                          field,
                        }) => (
                          <Input
                            ref={
                              field.ref
                            }
                            name={
                              field.name
                            }
                            value={formatCpfOrCnpj(
                              field.value ?? "",
                            )}
                            inputMode="numeric"
                            placeholder="CPF ou CNPJ"
                            onBlur={
                              field.onBlur
                            }
                            onChange={(
                              event,
                            ) =>
                              field.onChange(
                                formatCpfOrCnpj(
                                  event.target.value,
                                ),
                              )
                            }
                          />
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

          <Button
            type="button"
            variant="outline"
            className="w-full justify-between"
            onClick={() =>
              setDetailsOpen(
                current => !current,
              )
            }
          >
            <span className="text-left">
              Detalhes adicionais
            </span>

            {detailsOpen ? (
              <ChevronUp className="size-4" />
            ) : (
              <ChevronDown className="size-4" />
            )}
          </Button>

          {detailsOpen && (
            <section className="grid gap-4 rounded-xl border bg-muted/20 p-4 md:grid-cols-2">
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
          )}

          <section className="space-y-3 rounded-xl border border-primary/20 bg-primary/5 p-4">
            <div>
              <p className="text-sm font-medium">
                Prévia do texto
              </p>

              <p className="mt-1 text-xs text-muted-foreground">
                {incoming
                  ? "Formato para valor recebido pela organização."
                  : "Formato para valor pago pela organização."}
              </p>
            </div>

            <div className="rounded-lg bg-muted/50 p-3 text-xs leading-relaxed text-muted-foreground">
              {incoming ? (
                <p>
                  Neste formato, a organização confirma que recebeu
                  o valor da pessoa ou empresa informada.
                </p>
              ) : (
                <p>
                  Neste formato, quem recebeu o pagamento declara
                  ter recebido o valor da organização. Por isso o
                  texto começa com “Declaro ter recebido de...”.
                </p>
              )}
            </div>

            <div className="rounded-lg border bg-background p-4">
              <p className="text-sm leading-7">
                {receiptPreviewText}
              </p>

              {destinationPreviewText && (
                <p className="mt-3 text-sm leading-7">
                  {destinationPreviewText}
                </p>
              )}
            </div>

            {previewSignatoryName && (
              <p className="text-xs text-muted-foreground">
                Assinatura prevista:{" "}
                <span className="font-medium text-foreground">
                  {previewSignatoryName}
                </span>
              </p>
            )}

            {counterpartyMode ===
              "INFERRED" && (
                <p className="text-xs text-muted-foreground">
                  A pessoa ou empresa será identificada pela alocação ao salvar o rascunho.
                </p>
              )}

            <p className="text-xs text-muted-foreground">
              O PDF final também apresentará o valor por extenso e a formatação oficial do recibo.
            </p>
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
                handleOpenChange(
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