import { Input } from "@/components/ui/input"

type CurrencyInputProps = {
  value: number | null | undefined
  onValueChange: (value: number | undefined) => void
  id?: string
  placeholder?: string
  disabled?: boolean
  allowEmpty?: boolean
}

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
})

function formatCurrencyValue(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return ""
  }

  return currencyFormatter.format(value)
}

function parseCurrencyInput(value: string) {
  const digits = value.replace(/\D/g, "")

  if (!digits) {
    return undefined
  }

  return Number(digits) / 100
}

export function CurrencyInput({
  value,
  onValueChange,
  id,
  placeholder = "R$ 0,00",
  disabled = false,
  allowEmpty = false,
}: CurrencyInputProps) {
  const displayValue = formatCurrencyValue(value)

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const parsedValue = parseCurrencyInput(event.target.value)

    if (parsedValue === undefined) {
      onValueChange(allowEmpty ? undefined : 0)
      return
    }

    onValueChange(parsedValue)
  }

  return (
    <Input
      id={id}
      type="text"
      inputMode="numeric"
      placeholder={placeholder}
      disabled={disabled}
      value={displayValue}
      onChange={handleChange}
    />
  )
}