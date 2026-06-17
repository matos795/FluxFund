import { zodResolver } from "@hookform/resolvers/zod"
import { UserPlus } from "lucide-react"
import { Controller, useForm } from "react-hook-form"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { getApiErrorMessage } from "@/utils/api-error"
import { organizationRoleLabels } from "../organization-user-labels"
import {
  createOrganizationUserSchema,
  type CreateOrganizationUserFormData,
  type CreateOrganizationUserFormInput,
} from "../organization-user-schema"
import { useCreateOrganizationUser } from "../hooks/use-create-organization-user"
import { useState } from "react"

export function CreateOrganizationUserDialog() {
  const [open, setOpen] = useState(false)

  const createUserMutation = useCreateOrganizationUser()

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateOrganizationUserFormInput, unknown, CreateOrganizationUserFormData>({
    resolver: zodResolver(createOrganizationUserSchema),
    defaultValues: {
      name: "",
      email: "",
      temporaryPassword: "",
      role: "FINANCE",
    },
  })

  function handleOpenChange(value: boolean) {
    if (!value) {
      reset()
    }

    setOpen(value)
  }

  function handleCreateUser(data: CreateOrganizationUserFormData) {
    createUserMutation.mutate(data, {
      onSuccess: () => {
        toast.success("Usuário adicionado à organização.")
        handleOpenChange(false)
      },
      onError: (error) => {
        toast.error(
          getApiErrorMessage(
            error,
            "Não foi possível adicionar o usuário.",
          ),
        )
      },
    })
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button type="button">
          <UserPlus className="mr-2 size-4" />
          Novo usuário
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo usuário</DialogTitle>
          <DialogDescription>
            Crie um acesso para a organização atual. Use uma senha temporária e
            informe a pessoa para alterá-la futuramente quando essa opção estiver disponível.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit(handleCreateUser)}>
          <div className="space-y-2">
            <Label htmlFor="name">Nome</Label>
            <Input id="name" {...register("name")} />
            {errors.name && (
              <p className="text-sm text-destructive">
                {errors.name.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" type="email" {...register("email")} />
            {errors.email && (
              <p className="text-sm text-destructive">
                {errors.email.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="temporaryPassword">Senha temporária</Label>
            <Input
              id="temporaryPassword"
              type="password"
              {...register("temporaryPassword")}
            />
            {errors.temporaryPassword && (
              <p className="text-sm text-destructive">
                {errors.temporaryPassword.message}
              </p>
            )}
          </div>

          <Controller
            control={control}
            name="role"
            render={({ field }) => (
              <div className="space-y-2">
                <Label>Papel</Label>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o papel" />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value="ADMIN">
                      {organizationRoleLabels.ADMIN}
                    </SelectItem>
                    <SelectItem value="FINANCE">
                      {organizationRoleLabels.FINANCE}
                    </SelectItem>
                    <SelectItem value="VIEWER">
                      {organizationRoleLabels.VIEWER}
                    </SelectItem>
                  </SelectContent>
                </Select>

                {errors.role && (
                  <p className="text-sm text-destructive">
                    {errors.role.message}
                  </p>
                )}
              </div>
            )}
          />

          <div className="rounded-lg border bg-muted/40 p-3 text-sm text-muted-foreground">
            OWNER não aparece como opção neste MVP para evitar perda acidental
            de controle da organização.
          </div>

          <div className="flex flex-col-reverse gap-2 border-t pt-4 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="ghost"
              disabled={createUserMutation.isPending}
              onClick={() => handleOpenChange(false)}
            >
              Cancelar
            </Button>

            <Button type="submit" disabled={createUserMutation.isPending}>
              {createUserMutation.isPending ? "Criando..." : "Criar usuário"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}