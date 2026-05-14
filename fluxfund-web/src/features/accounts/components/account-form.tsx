import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, useWatch } from "react-hook-form"

import {
  accountFormSchema,
  type AccountFormData,
  type AccountFormInput,
} from "@/features/accounts/account-schema"
import { accountTypeLabels } from "@/features/accounts/account-labels"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type AccountFormProps = {
  onSubmit: (data: AccountFormData) => void
  isSubmitting?: boolean
  defaultValues?: Partial<AccountFormInput>
  submitLabel?: string
}

export function AccountForm({
  onSubmit,
  isSubmitting = false,
  defaultValues,
  submitLabel = "Salvar conta",
}: AccountFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors },
  } = useForm<AccountFormInput, unknown, AccountFormData>({
    resolver: zodResolver(accountFormSchema),
    defaultValues: {
      name: defaultValues?.name ?? "",
      type: defaultValues?.type ?? "BANK",
      bankName: defaultValues?.bankName ?? "",
      bankCode: defaultValues?.bankCode ?? "",
      agency: defaultValues?.agency ?? "",
      accountNumber: defaultValues?.accountNumber ?? "",
      initialBalance: defaultValues?.initialBalance ?? 0,
      initialBalanceDate:
        defaultValues?.initialBalanceDate ??
        new Date().toISOString().slice(0, 10),
      active: defaultValues?.active ?? true,
    },
  })

  const selectedType = useWatch({ control, name: "type" })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Nome da conta</Label>
        <Input
          id="name"
          placeholder="Ex: Banco do Brasil - Conta Corrente"
          {...register("name")}
        />
        {errors.name && (
          <p className="text-sm text-destructive">{errors.name.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label>Tipo</Label>
        <Select
          value={selectedType}
          onValueChange={(value) =>
            setValue("type", value as AccountFormInput["type"], {
              shouldValidate: true,
            })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione o tipo" />
          </SelectTrigger>

          <SelectContent>
            {Object.entries(accountTypeLabels).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {errors.type && (
          <p className="text-sm text-destructive">{errors.type.message}</p>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="bankName">Banco</Label>
          <Input
            id="bankName"
            placeholder="Ex: Banco do Brasil"
            {...register("bankName")}
          />
          {errors.bankName && (
            <p className="text-sm text-destructive">
              {errors.bankName.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="bankCode">Código do banco</Label>
          <Input
            id="bankCode"
            placeholder="Ex: 001"
            {...register("bankCode")}
          />
          {errors.bankCode && (
            <p className="text-sm text-destructive">
              {errors.bankCode.message}
            </p>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="agency">Agência</Label>
          <Input
            id="agency"
            placeholder="Ex: 1234-5"
            {...register("agency")}
          />
          {errors.agency && (
            <p className="text-sm text-destructive">
              {errors.agency.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="accountNumber">Número da conta</Label>
          <Input
            id="accountNumber"
            placeholder="Ex: 98765-4"
            {...register("accountNumber")}
          />
          {errors.accountNumber && (
            <p className="text-sm text-destructive">
              {errors.accountNumber.message}
            </p>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="initialBalance">Saldo inicial</Label>
          <Input
            id="initialBalance"
            type="number"
            step="0.01"
            min="0"
            placeholder="0,00"
            {...register("initialBalance")}
          />
          {errors.initialBalance && (
            <p className="text-sm text-destructive">
              {errors.initialBalance.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="initialBalanceDate">Data do saldo inicial</Label>
          <Input
            id="initialBalanceDate"
            type="date"
            {...register("initialBalanceDate")}
          />
          {errors.initialBalanceDate && (
            <p className="text-sm text-destructive">
              {errors.initialBalanceDate.message}
            </p>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Salvando..." : submitLabel}
        </Button>
      </div>
    </form>
  )
}