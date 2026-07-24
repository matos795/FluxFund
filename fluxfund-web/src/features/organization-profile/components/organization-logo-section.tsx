import { ImageUp, Trash2 } from "lucide-react"
import {
  useRef,
  useState,
  type ChangeEvent,
} from "react"
import { toast } from "sonner"

import { ConfirmActionDialog } from "@/components/layout/confirm-action-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { getApiErrorMessage } from "@/utils/api-error"

import { validateOrganizationLogo } from "../organization-logo-validation"
import type { OrganizationProfile } from "../organization-profile-types"
import { useDeleteOrganizationLogo } from "../hooks/use-organization-logo-mutations"
import { useUploadOrganizationLogo } from "../hooks/use-organization-logo-mutations"
import { OrganizationLogo } from "./organization-logo"
import { useQueryClient } from "@tanstack/react-query"
import { useAuth } from "@/features/auth"

type OrganizationLogoSectionProps = {
  organization: OrganizationProfile
  canManage: boolean
}

export function OrganizationLogoSection({
  organization,
  canManage,
}: OrganizationLogoSectionProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [deleteConfirmationOpen, setDeleteConfirmationOpen] =
    useState(false)

  const uploadMutation = useUploadOrganizationLogo()
  const deleteMutation = useDeleteOrganizationLogo()

  const {
    activeOrganization,
    refreshUser,
  } = useAuth()

  const queryClient = useQueryClient()

  function resetSelectedFile() {
    setSelectedFile(null)

    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null

    if (!file) {
      resetSelectedFile()
      return
    }

    const validationError = validateOrganizationLogo(file)

    if (validationError) {
      toast.error(validationError)
      resetSelectedFile()
      return
    }

    setSelectedFile(file)
  }

  async function handleUpload() {
    if (!selectedFile) {
      toast.error("Selecione uma imagem antes de enviar.")
      return
    }

    try {
      await uploadMutation.mutateAsync(selectedFile)

      await refreshUser()

      if (activeOrganization) {
        queryClient.invalidateQueries({
          queryKey: [
            "user-organization-logo",
            activeOrganization.id,
          ],
        })
      }

      toast.success(
        organization.logo
          ? "Logo substituída com sucesso."
          : "Logo enviada com sucesso.",
      )

      resetSelectedFile()
    } catch (error) {
      toast.error(
        getApiErrorMessage(
          error,
          "Não foi possível enviar a logo da organização.",
        ),
      )
    }
  }

  async function handleDelete() {
    try {
      await deleteMutation.mutateAsync()

      await refreshUser()

      if (activeOrganization) {
        queryClient.invalidateQueries({
          queryKey: [
            "user-organization-logo",
            activeOrganization.id,
          ],
        })
      }

      toast.success("Logo removida com sucesso.")
      setDeleteConfirmationOpen(false)
    } catch (error) {
      toast.error(
        getApiErrorMessage(
          error,
          "Não foi possível remover a logo da organização.",
        ),
      )
    }
  }

  return (
    <>
      <section className="rounded-xl border bg-muted/20 p-4">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_260px]">
          <div className="space-y-3">
            <div>
              <h3 className="text-sm font-semibold">
                Identidade visual
              </h3>

              <p className="mt-1 text-sm text-muted-foreground">
                A logo será usada na header, nos relatórios e na capa do
                Dossiê de Fechamento.
              </p>
            </div>

            {organization.logo ? (
              <div className="rounded-lg border bg-background p-3 text-sm">
                <p className="truncate font-medium">
                  {organization.logo.originalFilename}
                </p>

                <p className="mt-1 text-xs text-muted-foreground">
                  {formatFileSize(organization.logo.sizeBytes)} · enviada em{" "}
                  {formatDateTime(organization.logo.uploadedAt)}
                </p>
              </div>
            ) : (
              <div className="rounded-lg border border-dashed bg-background p-3 text-sm text-muted-foreground">
                Nenhuma logo foi configurada para esta organização.
              </div>
            )}

            {canManage && (
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="organization-logo">
                    {organization.logo
                      ? "Substituir logo"
                      : "Selecionar logo"}
                  </Label>

                  <Input
                    ref={fileInputRef}
                    id="organization-logo"
                    type="file"
                    accept=".png,.jpg,.jpeg,image/png,image/jpeg"
                    onChange={handleFileChange}
                  />

                  <p className="text-xs text-muted-foreground">
                    PNG, JPG ou JPEG, com no máximo 2 MB.
                  </p>
                </div>

                {selectedFile && (
                  <div className="flex flex-col gap-2 rounded-lg border bg-background p-3 text-sm sm:flex-row sm:items-center sm:justify-between">
                    <span className="truncate font-medium">
                      {selectedFile.name}
                    </span>

                    <Button
                      type="button"
                      size="sm"
                      onClick={handleUpload}
                      disabled={uploadMutation.isPending}
                    >
                      <ImageUp className="mr-2 size-4" />
                      {uploadMutation.isPending
                        ? "Enviando..."
                        : organization.logo
                          ? "Substituir"
                          : "Enviar logo"}
                    </Button>
                  </div>
                )}

                {organization.logo && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="text-destructive hover:text-destructive"
                    onClick={() => setDeleteConfirmationOpen(true)}
                  >
                    <Trash2 className="mr-2 size-4" />
                    Remover logo
                  </Button>
                )}
              </div>
            )}
          </div>

          <div className="flex min-h-36 items-center justify-center rounded-xl border bg-background p-4">
            <OrganizationLogo
              organizationName={organization.name}
              hasLogo={Boolean(organization.logo)}
              className="h-28 w-full max-w-52 rounded-xl border bg-muted/30 shadow-sm"
            />
          </div>
        </div>
      </section>

      <ConfirmActionDialog
        open={deleteConfirmationOpen}
        onOpenChange={setDeleteConfirmationOpen}
        title="Remover logo da organização?"
        description="A logo deixará de aparecer na header e em novos relatórios gerados pelo sistema."
        confirmLabel="Remover logo"
        pendingLabel="Removendo..."
        isPending={deleteMutation.isPending}
        isDestructive
        onConfirm={handleDelete}
      />
    </>
  )
}

function formatFileSize(sizeBytes: number) {
  if (sizeBytes < 1024) {
    return `${sizeBytes} B`
  }

  if (sizeBytes < 1024 * 1024) {
    return `${(sizeBytes / 1024).toFixed(1)} KB`
  }

  return `${(sizeBytes / 1024 / 1024).toFixed(1)} MB`
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value))
}