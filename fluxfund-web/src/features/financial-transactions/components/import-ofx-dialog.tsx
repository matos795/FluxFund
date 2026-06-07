import { useState } from "react"
import { Upload } from "lucide-react"
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
import { useImportOfxFile } from "../hooks/use-import-ofx-file"
import { AccountComboboxWithCreate } from "@/features/accounts/components/account-combobox-with-create"

export function ImportOfxDialog() {
  const [open, setOpen] = useState(false)
  const [accountId, setAccountId] = useState("")
  const [file, setFile] = useState<File | null>(null)

  const importOfxFile = useImportOfxFile()

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!accountId) {
      toast.error("Selecione uma conta.")
      return
    }

    if (!file) {
      toast.error("Selecione um arquivo OFX.")
      return
    }

    importOfxFile.mutate(
      {
        accountId,
        file,
      },
      {
        onSuccess: (response) => {
          toast.success(
            `OFX importado: ${response.imported} importadas, ${response.ignoredDuplicates} duplicadas ignoradas.`,
          )

          if (response.failed > 0) {
            toast.warning(`${response.failed} transações falharam na importação.`)
          }

          setAccountId("")
          setFile(null)
          setOpen(false)
        },
        onError: () => {
          toast.error("Não foi possível importar o arquivo OFX.")
        },
      },
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Upload className="mr-2 size-4" />
          Importar OFX
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Importar OFX</DialogTitle>
          <DialogDescription>
            Selecione a conta bancária e envie o arquivo OFX exportado pelo banco.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label>Conta</Label>
            <AccountComboboxWithCreate
              value={accountId}
              allowClear={false}
              onChange={(value) => setAccountId(value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ofxFile">Arquivo OFX</Label>
            <Input
              id="ofxFile"
              type="file"
              accept=".ofx"
              onChange={(event) => {
                setFile(event.target.files?.[0] ?? null)
              }}
            />
          </div>

          {file && (
            <p className="text-sm text-muted-foreground">
              Arquivo selecionado: {file.name}
            </p>
          )}

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancelar
            </Button>

            <Button type="submit" disabled={importOfxFile.isPending}>
              {importOfxFile.isPending ? "Importando..." : "Importar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}