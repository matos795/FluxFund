import { useState } from "react"
import type { Fund } from "../fund-types"
import { useUpdateFund } from "../hooks/use-update-fund"
import type { FundFormData } from "../fund-schema"
import { toast } from "sonner"
import { DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { Pencil } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { FundForm } from "./fund-form"

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
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar fundo</DialogTitle>
            <DialogDescription>
              Altere os dados do fundo selecionado.
            </DialogDescription>
          </DialogHeader>

          {updateFundMutation.isError && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              Não foi possível atualizar o fundo. Verifique os dados e tente novamente.
            </div>
          )}

          <FundForm
            defaultValues={{
              name: fund.name,
              description: fund.description ?? "",
              initialBalance: fund.initialBalance,
              initialBalanceDate: fund.initialBalanceDate ?? "",
            }}
            submitLabel="Salvar alterações"
            onSubmit={handleUpdateFund}
            isSubmitting={updateFundMutation.isPending}
          />
        </DialogContent>
      </Dialog>
    </>
  )
}