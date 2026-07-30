import type {
  FormEvent,
} from "react"

import {
  zodResolver,
} from "@hookform/resolvers/zod"

import {
  useForm,
  useWatch,
} from "react-hook-form"

import {
  Building2,
  HandCoins,
  Landmark,
  UserRound,
} from "lucide-react"

import {
  AppDialogBody,
  AppDialogFooter,
  AppDialogSection,
} from "@/components/layout/app-dialog"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import {
  financialPartyClassificationLabels,
} from "../financial-party-labels"

import {
  financialPartyFormSchema,
  type FinancialPartyFormData,
  type FinancialPartyFormInput,
} from "../financial-party-schema"

import type {
  FinancialPartyRole,
} from "../financial-party-types"

type FinancialPartyFormProps = {
  onSubmit: (
    data: FinancialPartyFormData,
  ) => void

  onCancel: () => void

  isSubmitting?: boolean

  defaultValues?:
    Partial<
      FinancialPartyFormInput
    >

  submitLabel?: string
}

const roleOptions: Array<{
  value: FinancialPartyRole
  title: string
  description: string
  icon: typeof HandCoins
}> = [
  {
    value: "INCOME_SOURCE",
    title: "Origem de receita",
    description:
      "Pessoa ou empresa que doa, contribui, compra ou envia recursos para a organização.",
    icon: HandCoins,
  },
  {
    value:
      "PAYMENT_RECIPIENT",
    title:
      "Recebedor de pagamento",
    description:
      "Pessoa ou empresa que pode receber pagamentos, repasses, salários ou reembolsos.",
    icon: Landmark,
  },
]

export function FinancialPartyForm({
  onSubmit,
  onCancel,
  isSubmitting = false,
  defaultValues,
  submitLabel =
    "Salvar contato",
}: FinancialPartyFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    control,

    formState: {
      errors,
    },
  } = useForm<
    FinancialPartyFormInput,
    unknown,
    FinancialPartyFormData
  >({
    resolver:
      zodResolver(
        financialPartyFormSchema,
      ),

    defaultValues: {
      name:
        defaultValues?.name ?? "",

      partyType:
        defaultValues?.partyType ??
        "INDIVIDUAL",

      type:
        defaultValues?.type ??
        "OTHER",

      roles:
        defaultValues?.roles ?? [],

      document:
        defaultValues?.document ??
        "",

      email:
        defaultValues?.email ?? "",

      phone:
        defaultValues?.phone ?? "",

      legalName:
        defaultValues?.legalName ??
        "",

      contactPerson:
        defaultValues
          ?.contactPerson ?? "",

      addressLine:
        defaultValues?.addressLine ??
        "",

      addressNumber:
        defaultValues
          ?.addressNumber ?? "",

      addressComplement:
        defaultValues
          ?.addressComplement ??
        "",

      neighborhood:
        defaultValues
          ?.neighborhood ?? "",

      city:
        defaultValues?.city ?? "",

      state:
        defaultValues?.state ?? "",

      zipCode:
        defaultValues?.zipCode ??
        "",

      notes:
        defaultValues?.notes ?? "",
    },
  })

  const selectedPartyType =
    useWatch({
      control,
      name: "partyType",
    })

  const selectedClassification =
    useWatch({
      control,
      name: "type",
    })

  const selectedRoles =
    useWatch({
      control,
      name: "roles",
    }) ?? []

  function handleRoleChange(
    role: FinancialPartyRole,
    checked: boolean,
  ) {
    const nextRoles = checked
      ? Array.from(
          new Set([
            ...selectedRoles,
            role,
          ]),
        )
      : selectedRoles.filter(
          (currentRole) =>
            currentRole !== role,
        )

    setValue(
      "roles",
      nextRoles,
      {
        shouldValidate: true,
        shouldDirty: true,
      },
    )
  }

  function handleFormSubmit(
    event:
      FormEvent<HTMLFormElement>,
  ) {
    event.stopPropagation()

    void handleSubmit(
      (data) => {
        /*
         * Caso o contato seja alterado de
         * pessoa jurídica para pessoa física,
         * limpamos os campos empresariais.
         */
        onSubmit({
          ...data,

          legalName:
            data.partyType ===
            "LEGAL_ENTITY"
              ? data.legalName
              : "",

          contactPerson:
            data.partyType ===
            "LEGAL_ENTITY"
              ? data.contactPerson
              : "",
        })
      },
    )(event)
  }

  const NameIcon =
    selectedPartyType ===
    "LEGAL_ENTITY"
      ? Building2
      : UserRound

  return (
    <form
      onSubmit={
        handleFormSubmit
      }
      className="flex min-h-0 flex-1 flex-col overflow-hidden"
    >
      <AppDialogBody className="space-y-4">
        <AppDialogSection
          title="Identificação"
          description="Informe quem é o contato e como ele deve ser reconhecido no sistema."
        >
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>
                Natureza
              </Label>

              <Select
                value={
                  selectedPartyType
                }
                onValueChange={(
                  value,
                ) =>
                  setValue(
                    "partyType",
                    value as FinancialPartyFormInput["partyType"],
                    {
                      shouldValidate:
                        true,
                      shouldDirty:
                        true,
                    },
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a natureza" />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="INDIVIDUAL">
                    Pessoa física
                  </SelectItem>

                  <SelectItem value="LEGAL_ENTITY">
                    Pessoa jurídica
                  </SelectItem>
                </SelectContent>
              </Select>

              {errors.partyType && (
                <p className="text-sm text-destructive">
                  {
                    errors
                      .partyType
                      .message
                  }
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>
                Classificação
              </Label>

              <Select
                value={
                  selectedClassification
                }
                onValueChange={(
                  value,
                ) =>
                  setValue(
                    "type",
                    value as FinancialPartyFormInput["type"],
                    {
                      shouldValidate:
                        true,
                      shouldDirty:
                        true,
                    },
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a classificação" />
                </SelectTrigger>

                <SelectContent>
                  {Object.entries(
                    financialPartyClassificationLabels,
                  ).map(
                    ([
                      value,
                      label,
                    ]) => (
                      <SelectItem
                        key={
                          value
                        }
                        value={
                          value
                        }
                      >
                        {
                          label
                        }
                      </SelectItem>
                    ),
                  )}
                </SelectContent>
              </Select>

              {errors.type && (
                <p className="text-sm text-destructive">
                  {
                    errors.type
                      .message
                  }
                </p>
              )}
            </div>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="financial-party-name">
                {selectedPartyType ===
                "LEGAL_ENTITY"
                  ? "Nome de exibição ou nome fantasia"
                  : "Nome completo"}
              </Label>

              <div className="relative">
                <NameIcon className="absolute left-3 top-2.5 size-4 text-muted-foreground" />

                <Input
                  id="financial-party-name"
                  className="pl-9"
                  placeholder={
                    selectedPartyType ===
                    "LEGAL_ENTITY"
                      ? "Ex: Gráfica Parceira"
                      : "Ex: João da Silva"
                  }
                  {...register(
                    "name",
                  )}
                />
              </div>

              {errors.name && (
                <p className="text-sm text-destructive">
                  {
                    errors.name
                      .message
                  }
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="financial-party-document">
                {selectedPartyType ===
                "LEGAL_ENTITY"
                  ? "CNPJ"
                  : "CPF"}
              </Label>

              <Input
                id="financial-party-document"
                placeholder={
                  selectedPartyType ===
                  "LEGAL_ENTITY"
                    ? "Ex: 12.345.678/0001-90"
                    : "Ex: 123.456.789-00"
                }
                {...register(
                  "document",
                )}
              />

              {errors.document && (
                <p className="text-sm text-destructive">
                  {
                    errors
                      .document
                      .message
                  }
                </p>
              )}
            </div>
          </div>

          {selectedPartyType ===
            "LEGAL_ENTITY" && (
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="financial-party-legal-name">
                  Razão social
                </Label>

                <Input
                  id="financial-party-legal-name"
                  placeholder="Ex: Gráfica Parceira Atibaia Ltda"
                  {...register(
                    "legalName",
                  )}
                />

                {errors.legalName && (
                  <p className="text-sm text-destructive">
                    {
                      errors
                        .legalName
                        .message
                    }
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="financial-party-contact-person">
                  Responsável ou contato principal
                </Label>

                <Input
                  id="financial-party-contact-person"
                  placeholder="Ex: Mariana Souza"
                  {...register(
                    "contactPerson",
                  )}
                />

                {errors.contactPerson && (
                  <p className="text-sm text-destructive">
                    {
                      errors
                        .contactPerson
                        .message
                    }
                  </p>
                )}
              </div>
            </div>
          )}
        </AppDialogSection>

        <AppDialogSection
          title="Papéis financeiros"
          description="Selecione como este contato participa das movimentações da organização."
        >
          <div className="grid gap-3 md:grid-cols-2">
            {roleOptions.map(
              (option) => {
                const Icon =
                  option.icon

                const checked =
                  selectedRoles.includes(
                    option.value,
                  )

                return (
                  <label
                    key={
                      option.value
                    }
                    htmlFor={`financial-party-role-${option.value}`}
                    className="flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition hover:bg-muted/40"
                  >
                    <Checkbox
                      id={`financial-party-role-${option.value}`}
                      checked={
                        checked
                      }
                      onCheckedChange={(
                        value,
                      ) =>
                        handleRoleChange(
                          option.value,
                          value ===
                            true,
                        )
                      }
                    />

                    <div className="flex min-w-0 gap-3">
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                        <Icon className="size-4 text-muted-foreground" />
                      </div>

                      <div className="space-y-1">
                        <p className="text-sm font-medium">
                          {
                            option.title
                          }
                        </p>

                        <p className="text-xs leading-relaxed text-muted-foreground">
                          {
                            option.description
                          }
                        </p>
                      </div>
                    </div>
                  </label>
                )
              },
            )}
          </div>

          {errors.roles && (
            <p className="mt-3 text-sm text-destructive">
              {
                errors.roles
                  .message
              }
            </p>
          )}

          <div className="mt-3 rounded-lg bg-muted/40 p-3 text-xs text-muted-foreground">
            Um contato pode exercer os dois papéis. Por exemplo, uma empresa pode comprar serviços da organização e também receber um pagamento.
          </div>
        </AppDialogSection>

        <AppDialogSection
          title="Contato"
          description="Dados usados para comunicação, acompanhamento e emissão futura de recibos."
        >
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="financial-party-email">
                E-mail
              </Label>

              <Input
                id="financial-party-email"
                type="email"
                placeholder="Ex: contato@empresa.com"
                {...register(
                  "email",
                )}
              />

              {errors.email && (
                <p className="text-sm text-destructive">
                  {
                    errors.email
                      .message
                  }
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="financial-party-phone">
                Telefone ou celular
              </Label>

              <Input
                id="financial-party-phone"
                placeholder="Ex: (11) 99999-9999"
                {...register(
                  "phone",
                )}
              />

              {errors.phone && (
                <p className="text-sm text-destructive">
                  {
                    errors.phone
                      .message
                  }
                </p>
              )}
            </div>
          </div>
        </AppDialogSection>

        <AppDialogSection
          title="Endereço"
          description="O endereço é opcional, mas poderá ser utilizado futuramente nos recibos."
        >
          <div className="grid gap-4 md:grid-cols-[minmax(0,2fr)_minmax(120px,0.7fr)]">
            <div className="space-y-2">
              <Label htmlFor="financial-party-address-line">
                Logradouro
              </Label>

              <Input
                id="financial-party-address-line"
                placeholder="Rua, avenida, estrada..."
                {...register(
                  "addressLine",
                )}
              />

              {errors.addressLine && (
                <p className="text-sm text-destructive">
                  {
                    errors
                      .addressLine
                      .message
                  }
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="financial-party-address-number">
                Número
              </Label>

              <Input
                id="financial-party-address-number"
                placeholder="Ex: 100"
                {...register(
                  "addressNumber",
                )}
              />

              {errors.addressNumber && (
                <p className="text-sm text-destructive">
                  {
                    errors
                      .addressNumber
                      .message
                  }
                </p>
              )}
            </div>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="financial-party-address-complement">
                Complemento
              </Label>

              <Input
                id="financial-party-address-complement"
                placeholder="Apartamento, sala, referência..."
                {...register(
                  "addressComplement",
                )}
              />

              {errors.addressComplement && (
                <p className="text-sm text-destructive">
                  {
                    errors
                      .addressComplement
                      .message
                  }
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="financial-party-neighborhood">
                Bairro
              </Label>

              <Input
                id="financial-party-neighborhood"
                placeholder="Ex: Centro"
                {...register(
                  "neighborhood",
                )}
              />

              {errors.neighborhood && (
                <p className="text-sm text-destructive">
                  {
                    errors
                      .neighborhood
                      .message
                  }
                </p>
              )}
            </div>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-[minmax(0,1.5fr)_100px_minmax(140px,0.8fr)]">
            <div className="space-y-2">
              <Label htmlFor="financial-party-city">
                Cidade
              </Label>

              <Input
                id="financial-party-city"
                placeholder="Ex: Atibaia"
                {...register(
                  "city",
                )}
              />

              {errors.city && (
                <p className="text-sm text-destructive">
                  {
                    errors.city
                      .message
                  }
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="financial-party-state">
                UF
              </Label>

              <Input
                id="financial-party-state"
                maxLength={2}
                placeholder="SP"
                className="uppercase"
                {...register(
                  "state",
                )}
              />

              {errors.state && (
                <p className="text-sm text-destructive">
                  {
                    errors.state
                      .message
                  }
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="financial-party-zip-code">
                CEP
              </Label>

              <Input
                id="financial-party-zip-code"
                placeholder="12940-000"
                {...register(
                  "zipCode",
                )}
              />

              {errors.zipCode && (
                <p className="text-sm text-destructive">
                  {
                    errors
                      .zipCode
                      .message
                  }
                </p>
              )}
            </div>
          </div>
        </AppDialogSection>

        <AppDialogSection
          title="Observações"
          description="Informações internas sobre o relacionamento com este contato."
        >
          <div className="space-y-2">
            <Label htmlFor="financial-party-notes">
              Observações internas
            </Label>

            <Textarea
              id="financial-party-notes"
              className="min-h-28"
              placeholder="Ex: responsável financeiro, melhor horário para contato, informações do relacionamento..."
              {...register(
                "notes",
              )}
            />

            {errors.notes && (
              <p className="text-sm text-destructive">
                {
                  errors.notes
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