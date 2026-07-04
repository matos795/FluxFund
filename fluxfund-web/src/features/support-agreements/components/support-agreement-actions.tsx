import { MoreHorizontal, RotateCcw, Trash2 } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useDeleteSupportAgreement } from "../hooks/use-delete-support-agreement"
import type { SupportAgreement } from "../support-agreement-types"
import { EditSupportAgreementDialog } from "./edit-support-agreement-dialog"
import { useActivateSupportAgreement } from "../hooks/use-activate-support-agreement"
import { usePermissions } from "@/features/auth/hooks/use-permissions"
import { ConfirmActionDialog } from "@/components/layout/confirm-action-dialog"
import { CreateSupportAgreementVersionDialog } from "./create-support-agreement-version-dialog"

type SupportAgreementActionsProps = {
  agreement: SupportAgreement
}

export function SupportAgreementActions({
  agreement,
}: SupportAgreementActionsProps) {

  const { canFinanceWrite } = usePermissions()

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  const deleteSupportAgreementMutation = useDeleteSupportAgreement()
  const activateSupportAgreementMutation = useActivateSupportAgreement()

  function handleDelete() {
    deleteSupportAgreementMutation.mutate(agreement.id, {
      onSuccess: () => {
        toast.success("Compromisso desativado com sucesso.")
        setDeleteDialogOpen(false)
      },
      onError: () => {
        toast.error("Não foi possível desativar o compromisso.")
      },
    })
  }

  function handleActivate() {
    activateSupportAgreementMutation.mutate(agreement.id, {
      onSuccess: () => {
        toast.success("Compromisso reativado com sucesso.")
      },
      onError: () => {
        toast.error("Não foi possível reativar o compromisso.")
      },
    })
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreHorizontal className="size-4" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end">
          {canFinanceWrite && <EditSupportAgreementDialog agreement={agreement} />}

          {canFinanceWrite && agreement.active && !agreement.endDate && (
            <CreateSupportAgreementVersionDialog agreement={agreement} />
          )}

          {canFinanceWrite &&
            (agreement.status === "ACTIVE" ||
              agreement.status === "SCHEDULED") && (
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => setDeleteDialogOpen(true)}
              >
                <Trash2 className="mr-2 size-4" />
                Desativar
              </DropdownMenuItem>
            )}

          {canFinanceWrite && agreement.status === "INACTIVE" && (
            <DropdownMenuItem onClick={handleActivate}>
              <RotateCcw className="mr-2 size-4" />
              Reativar
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <ConfirmActionDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Desativar compromisso?"
        description={
          <>
            O compromisso de <strong>{agreement.beneficiary.name}</strong> será
            desativado e não entrará mais nos relatórios futuros.
          </>
        }
        confirmLabel="Desativar"
        pendingLabel="Desativando..."
        isPending={deleteSupportAgreementMutation.isPending}
        isDestructive
        onConfirm={handleDelete}
      />
    </>
  )
}