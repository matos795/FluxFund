import { useState } from "react"
import type { Fund } from "../fund-types"
import { useUpdateFund } from "../hooks/use-update-fund"
import type { FundFormData } from "../fund-schema"
import { toast } from "sonner"
import { DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { FolderKanban, Pencil } from "lucide-react"
import { Dialog } from "@/components/ui/dialog"
import { FundForm } from "./fund-form"
import { AppDialogBody, AppDialogContent, AppDialogHeader } from "@/components/layout/app-dialog"

type EditFundDialogProps = {
  fund: Fund
}

export function EditFundDialog({ fund }: EditFundDialogProps) {
  const [open, setOpen] = useState(false)

  const updateFundMutation = useUpdateFund()

  function handleUpdateFund(data: FundFormData) {
    updateFundMutation.mutate(
      {
        id: fund.id,
        name: data.name,
        description: data.description || undefined,
        initialBalance: data.initialBalance,
        initialBalanceDate: data.initialBalanceDate || undefined,
      },
      {
        onSuccess: () => {
          toast.success("Fundo atualizado com sucesso!")
          setOpen(false)
        },
        onError: () => {
          toast.error("Erro ao atualizar o fundo. Verifique os dados e tente novamente.")
        }
      },
    )
  }

  return (
    <>
      <DropdownMenuItem
        onSelect={(event) => {
          event.preventDefault()
          setOpen(true)
        }}
      >
        <Pencil className="mr-2 size-4" />
        Editar
      </DropdownMenuItem>

      <Dialog open={open} onOpenChange={setOpen}>
        <AppDialogContent size="md">
          <AppDialogHeader
            icon={<FolderKanban className="size-4 text-muted-foreground" />}
            title="Editar fundo"
            description="Altere os dados do fundo selecionado."
          />

          <AppDialogBody>
            {updateFundMutation.isError && (
              <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                Erro ao atualizar fundo. Verifique os dados e tente novamente.
              </div>
            )}

            <FundForm
              onSubmit={handleUpdateFund}
              defaultValues={{
                name: fund.name,
                description: fund.description ?? "",
              }}
              submitLabel="Salvar alterações"
              isSubmitting={updateFundMutation.isPending}
            />
          </AppDialogBody>
        </AppDialogContent>
      </Dialog>
    </>
  )
}