import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, useWatch } from "react-hook-form"

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
import { beneficiaryFormSchema, type BeneficiaryFormData, type BeneficiaryFormInput } from "../beneficiary-schema"
import { beneficiaryTypeLabels } from "../beneficiary-labels"

type BeneficiaryFormProps = {
  onSubmit: (data: BeneficiaryFormData) => void
  isSubmitting?: boolean
  defaultValues?: Partial<BeneficiaryFormInput>
  submitLabel?: string
}

export function BeneficiaryForm({
  onSubmit,
  isSubmitting = false,
  defaultValues,
  submitLabel = "Salvar favorecido",
}: BeneficiaryFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors },
  } = useForm<BeneficiaryFormInput, unknown, BeneficiaryFormData>({
    resolver: zodResolver(beneficiaryFormSchema),
    defaultValues: {
      name: defaultValues?.name ?? "",
      type: defaultValues?.type ?? "MISSIONARY",
      document: defaultValues?.document ?? "",
      email: defaultValues?.email ?? "",
      phone: defaultValues?.phone ?? "",
    },
  })

  const selectedType = useWatch({ control, name: "type" })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Nome do favorecido</Label>
        <Input
          id="name"
          placeholder="Ex: Missionário João, Fornecedor ABC, Responsável do Projeto"
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
            setValue("type", value as BeneficiaryFormInput["type"], {
              shouldValidate: true,
            })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione o tipo" />
          </SelectTrigger>

          <SelectContent>
            {Object.entries(beneficiaryTypeLabels).map(([value, label]) => (
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
          <Label htmlFor="document">Documento</Label>
          <Input
            id="document"
            placeholder="Ex: 123.456.789-90"
            {...register("document")}
          />
          {errors.document && (
            <p className="text-sm text-destructive">
              {errors.document.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="Ex: exemplo@gmail.com"
            {...register("email")}
          />
          {errors.email && (
            <p className="text-sm text-destructive">
              {errors.email.message}
            </p>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="phone">Celular</Label>
          <Input
            id="phone"
            placeholder="Ex: (11) 98765-4321"
            {...register("phone")}
          />
          {errors.phone && (
            <p className="text-sm text-destructive">
              {errors.phone.message}
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