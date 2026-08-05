import {
  Controller,
  useForm,
  useWatch,
} from "react-hook-form"

import {
  zodResolver,
} from "@hookform/resolvers/zod"

import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Target,
} from "lucide-react"

import {
  AppDialogBody,
  AppDialogFooter,
  AppDialogSection,
} from "@/components/layout/app-dialog"

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
  Textarea,
} from "@/components/ui/textarea"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

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
  financialCommitmentFormSchema,
  type FinancialCommitmentFormData,
  type FinancialCommitmentFormInput,
} from "../financial-commitment-schema"

import {
  financialCommitmentRecurrenceLabels,
  financialCommitmentTypeLabels,
  getCommitmentTypesByDirection,
} from "../financial-commitment-labels"

import type {
  FinancialCommitmentDirection,
  FinancialCommitmentRecurrence,
  FinancialCommitmentType,
} from "../financial-commitment-types"

type FinancialCommitmentFormProps = {
  defaultValues?:
    Partial<
      FinancialCommitmentFormInput
    >

  lockDefinition?: boolean
  isSubmitting?: boolean
  submitLabel?: string

  onSubmit: (
    data:
      FinancialCommitmentFormData,
  ) => void

  onCancel: () => void
}

export function FinancialCommitmentForm({
  defaultValues,
  lockDefinition = false,
  isSubmitting = false,
  submitLabel =
    "Salvar compromisso",
  onSubmit,
  onCancel,
}: FinancialCommitmentFormProps) {
  const {
    control,
    register,
    handleSubmit,
    setValue,

    formState: {
      errors,
    },
  } = useForm<
    FinancialCommitmentFormInput,
    unknown,
    FinancialCommitmentFormData
  >({
    resolver:
      zodResolver(
        financialCommitmentFormSchema,
      ),

    defaultValues: {
      partyId:
        defaultValues?.partyId ??
        "",

      designatedRecipientId:
        defaultValues
          ?.designatedRecipientId ??
        "",

      fundId:
        defaultValues?.fundId ??
        "",

      direction:
        defaultValues?.direction ??
        "RECEIVABLE",

      commitmentType:
        defaultValues
          ?.commitmentType ??
        "DONATION",

      recurrence:
        defaultValues?.recurrence ??
        "MONTHLY",

      amount:
        defaultValues?.amount ??
        0,

      dueDay:
        defaultValues?.dueDay ??
        "",

      startDate:
        defaultValues?.startDate ??
        "",

      endDate:
        defaultValues?.endDate ??
        "",

      description:
        defaultValues?.description ??
        "",
    },
  })

  const direction =
    useWatch({
      control,
      name: "direction",
    })

  const commitmentType =
    useWatch({
      control,
      name: "commitmentType",
    })

  const recurrence =
    useWatch({
      control,
      name: "recurrence",
    })

  const partyId =
    useWatch({
      control,
      name: "partyId",
    })

  const designatedRecipientId =
    useWatch({
      control,
      name:
        "designatedRecipientId",
    })

  const allowedTypes =
    getCommitmentTypesByDirection(
      direction,
    )

  function handleDirectionChange(
    nextDirection:
      FinancialCommitmentDirection,
  ) {
    setValue(
      "direction",
      nextDirection,
      {
        shouldDirty: true,
        shouldValidate: true,
      },
    )

    /*
     * O contato anterior pode não possuir
     * o papel exigido pela nova direção.
     */
    setValue(
      "partyId",
      "",
      {
        shouldDirty: true,
        shouldValidate: true,
      },
    )

    setValue(
      "designatedRecipientId",
      "",
      {
        shouldDirty: true,
        shouldValidate: true,
      },
    )

    setValue(
      "commitmentType",
      nextDirection ===
        "RECEIVABLE"
        ? "DONATION"
        : "OTHER",
      {
        shouldDirty: true,
        shouldValidate: true,
      },
    )
  }

  function handleRecurrenceChange(
    nextRecurrence:
      FinancialCommitmentRecurrence,
  ) {
    setValue(
      "recurrence",
      nextRecurrence,
      {
        shouldDirty: true,
        shouldValidate: true,
      },
    )

    if (
      nextRecurrence ===
      "ONE_TIME"
    ) {
      setValue(
        "dueDay",
        "",
        {
          shouldDirty: true,
          shouldValidate: true,
        },
      )

      setValue(
        "endDate",
        "",
        {
          shouldDirty: true,
          shouldValidate: true,
        },
      )
    }
  }

  const PartyIcon =
    direction ===
    "RECEIVABLE"
      ? ArrowDownToLine
      : ArrowUpFromLine

  return (
    <form
      className="flex min-h-0 flex-1 flex-col overflow-hidden"
      onSubmit={
        handleSubmit(
          onSubmit,
        )
      }
    >
      <AppDialogBody className="space-y-4">
        <AppDialogSection
          title="Definição"
          description="Informe se a organização espera receber ou realizar este compromisso."
        >
          <div className="grid min-w-0 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>
                Direção
              </Label>

              <Select
                disabled={
                  lockDefinition
                }
                value={
                  direction
                }
                onValueChange={(
                  value,
                ) =>
                  handleDirectionChange(
                    value as
                      FinancialCommitmentDirection,
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="RECEIVABLE">
                    A receber
                  </SelectItem>

                  <SelectItem value="PAYABLE">
                    A pagar
                  </SelectItem>
                </SelectContent>
              </Select>

              {lockDefinition && (
                <p className="text-xs text-muted-foreground">
                  Para alterar a direção, encerre este compromisso e crie outro.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>
                Tipo
              </Label>

              <Select
                disabled={
                  lockDefinition
                }
                value={
                  commitmentType
                }
                onValueChange={(
                  value,
                ) =>
                  setValue(
                    "commitmentType",
                    value as
                      FinancialCommitmentType,
                    {
                      shouldDirty:
                        true,
                      shouldValidate:
                        true,
                    },
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>

                <SelectContent>
                  {allowedTypes.map(
                    (type) => (
                      <SelectItem
                        key={
                          type
                        }
                        value={
                          type
                        }
                      >
                        {
                          financialCommitmentTypeLabels[
                            type
                          ]
                        }
                      </SelectItem>
                    ),
                  )}
                </SelectContent>
              </Select>

              {errors.commitmentType && (
                <p className="text-sm text-destructive">
                  {
                    errors
                      .commitmentType
                      .message
                  }
                </p>
              )}
            </div>
          </div>

          <div className="mt-4 flex gap-3 rounded-lg border bg-muted/30 p-4">
            <PartyIcon className="mt-0.5 size-5 shrink-0 text-muted-foreground" />

            <div className="space-y-1">
              <p className="text-sm font-medium">
                {direction ===
                "RECEIVABLE"
                  ? "A organização espera receber este valor."
                  : "A organização espera pagar ou repassar este valor."}
              </p>

              <p className="text-xs text-muted-foreground">
                {direction ===
                "RECEIVABLE"
                  ? "O contato principal será usado como origem da receita quando o compromisso for realizado."
                  : "O contato principal será usado como recebedor do pagamento."}
              </p>
            </div>
          </div>
        </AppDialogSection>

        <AppDialogSection
          title="Contatos e destinação"
          description="Identifique quem participa do compromisso e para onde o recurso será destinado."
        >
          <div className="grid min-w-0 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>
                {direction ===
                "RECEIVABLE"
                  ? "Quem deverá enviar"
                  : "Quem deverá receber"}
              </Label>

              <FinancialPartyCombobox
                role={
                  direction ===
                  "RECEIVABLE"
                    ? "INCOME_SOURCE"
                    : "PAYMENT_RECIPIENT"
                }
                value={
                  partyId
                }
                allowClear={
                  false
                }
                placeholder={
                  direction ===
                  "RECEIVABLE"
                    ? "Selecione o doador ou pagador"
                    : "Selecione o recebedor"
                }
                onChange={(
                  value,
                ) =>
                  setValue(
                    "partyId",
                    value,
                    {
                      shouldDirty:
                        true,
                      shouldValidate:
                        true,
                    },
                  )
                }
              />

              {errors.partyId && (
                <p className="text-sm text-destructive">
                  {
                    errors.partyId
                      .message
                  }
                </p>
              )}
            </div>

            {direction ===
              "RECEIVABLE" && (
              <div className="space-y-2">
                <Label>
                  Destinatário indicado
                </Label>

                <FinancialPartyCombobox
                  role="PAYMENT_RECIPIENT"
                  value={
                    designatedRecipientId ??
                    ""
                  }
                  allowClear
                  clearLabel="Sem destinatário individual"
                  placeholder="Sem destinatário individual"
                  onChange={(
                    value,
                  ) =>
                    setValue(
                      "designatedRecipientId",
                      value,
                      {
                        shouldDirty:
                          true,
                        shouldValidate:
                          true,
                      },
                    )
                  }
                />

                {errors.designatedRecipientId && (
                  <p className="text-sm text-destructive">
                    {
                      errors
                        .designatedRecipientId
                        .message
                    }
                  </p>
                )}

                <p className="text-xs text-muted-foreground">
                  Deixe vazio quando a contribuição for destinada somente ao fundo.
                </p>
              </div>
            )}
          </div>

          {direction ===
            "RECEIVABLE" && (
            <div className="mt-4 flex gap-3 rounded-lg bg-muted/40 p-3">
              <Target className="mt-0.5 size-4 shrink-0 text-muted-foreground" />

              <p className="text-xs leading-relaxed text-muted-foreground">
                Ao indicar um destinatário, o sistema poderá mostrar futuramente este doador na visão do favorecido e conferir mensalmente se a contribuição foi recebida.
              </p>
            </div>
          )}
        </AppDialogSection>

        <AppDialogSection
          title="Condição financeira"
          description="Defina o fundo, o valor e a recorrência."
        >
          <div className="grid min-w-0 gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>
                Fundo
              </Label>

              <Controller
                name="fundId"
                control={
                  control
                }
                render={({
                  field,
                }) => (
                  <FundComboboxWithCreate
                    value={
                      field.value
                    }
                    allowClear={
                      false
                    }
                    onChange={
                      field.onChange
                    }
                  />
                )}
              />

              {errors.fundId && (
                <p className="text-sm text-destructive">
                  {
                    errors.fundId
                      .message
                  }
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>
                Recorrência
              </Label>

              <Select
                value={
                  recurrence
                }
                onValueChange={(
                  value,
                ) =>
                  handleRecurrenceChange(
                    value as
                      FinancialCommitmentRecurrence,
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>

                <SelectContent>
                  {(
                    [
                      "MONTHLY",
                      "ONE_TIME",
                    ] as const
                  ).map(
                    (value) => (
                      <SelectItem
                        key={
                          value
                        }
                        value={
                          value
                        }
                      >
                        {
                          financialCommitmentRecurrenceLabels[
                            value
                          ]
                        }
                      </SelectItem>
                    ),
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>
                Valor
              </Label>

              <Controller
                name="amount"
                control={
                  control
                }
                render={({
                  field,
                }) => (
                  <CurrencyInput
                    value={
                      field.value as
                        | number
                        | null
                        | undefined
                    }
                    onValueChange={
                      field.onChange
                    }
                  />
                )}
              />

              {errors.amount && (
                <p className="text-sm text-destructive">
                  {
                    errors.amount
                      .message
                  }
                </p>
              )}
            </div>
          </div>
        </AppDialogSection>

        <AppDialogSection
          title="Vigência"
          description="Informe quando o compromisso começa e, quando aplicável, quando termina."
        >
          <div
            className={
              recurrence ===
              "MONTHLY"
                ? "grid gap-4 md:grid-cols-3"
                : "grid gap-4 md:grid-cols-1"
            }
          >
            <div className="space-y-2">
              <Label htmlFor="commitment-start-date">
                {recurrence ===
                "ONE_TIME"
                  ? "Data prevista"
                  : "Início"}
              </Label>

              <Input
                id="commitment-start-date"
                type="date"
                {...register(
                  "startDate",
                )}
              />

              {errors.startDate && (
                <p className="text-sm text-destructive">
                  {
                    errors.startDate
                      .message
                  }
                </p>
              )}
            </div>

            {recurrence ===
              "MONTHLY" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="commitment-end-date">
                    Fim opcional
                  </Label>

                  <Input
                    id="commitment-end-date"
                    type="date"
                    {...register(
                      "endDate",
                    )}
                  />

                  {errors.endDate && (
                    <p className="text-sm text-destructive">
                      {
                        errors.endDate
                          .message
                      }
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="commitment-due-day">
                    Dia esperado
                  </Label>

                  <Input
                    id="commitment-due-day"
                    type="number"
                    min={1}
                    max={31}
                    placeholder="Ex: 10"
                    {...register(
                      "dueDay",
                    )}
                  />

                  {errors.dueDay && (
                    <p className="text-sm text-destructive">
                      {
                        errors.dueDay
                          .message
                      }
                    </p>
                  )}

                  <p className="text-xs text-muted-foreground">
                    Opcional. Usado para previsões e alertas futuros.
                  </p>
                </div>
              </>
            )}
          </div>
        </AppDialogSection>

        <AppDialogSection
          title="Observações"
          description="Informações internas sobre este compromisso."
        >
          <div className="space-y-2">
            <Label htmlFor="commitment-description">
              Descrição
            </Label>

            <Textarea
              id="commitment-description"
              className="min-h-24"
              placeholder="Ex: oferta mensal destinada ao Missionário Carlos"
              {...register(
                "description",
              )}
            />

            {errors.description && (
              <p className="text-sm text-destructive">
                {
                  errors.description
                    .message
                }
              </p>
            )}
          </div>
        </AppDialogSection>
      </AppDialogBody>

      <AppDialogFooter>
        <Button
          type="button"
          variant="ghost"
          disabled={
            isSubmitting
          }
          onClick={
            onCancel
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
            : submitLabel}
        </Button>
      </AppDialogFooter>
    </form>
  )
}