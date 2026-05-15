import { Plus } from "lucide-react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, } from "@/components/ui/dialog"
import { toast } from "sonner"
import { useCreateFund } from "../hooks/use-create-fund"
import type { FundFormData } from "../fund-schema"
import { FundForm } from "./fund-form"

export function CreateFundDialog() {

  const [open, setOpen] = useState(false)

  const createFundMutation = useCreateFund()

  function handleCreateFund(data: FundFormData) {
    createFundMutation.mutate(
      {
        name: data.name,
        description: data.description || undefined,
        initialBalance: data.initialBalance,
        initialBalanceDate: data.initialBalanceDate || undefined,
      },
      {
        onSuccess: () => {
          toast.success("Fundo criado com sucesso!")
          setOpen(false)
        },
        onError: () => {
          toast.error("Erro ao criar fundo. Tente novamente.")
        }
      },
    )
  }

  return (
    <>
      <Button type="button" onClick={() => setOpen(true)}>
        <Plus className="mr-2 size-4" />
        Novo fundo
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Novo fundo</DialogTitle>
            <DialogDescription>
              Cadastre uma destinação interna para controlar recursos de projetos, áreas ou finalidades específicas.
            </DialogDescription>
          </DialogHeader>

          <FundForm onSubmit={handleCreateFund} isSubmitting={createFundMutation.isPending} />
        </DialogContent>
      </Dialog>
    </>
  )
}