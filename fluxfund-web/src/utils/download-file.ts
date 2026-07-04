export function downloadFile(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob)

  const link = document.createElement("a")
  link.href = url
  link.download = filename
  link.style.display = "none"

  document.body.appendChild(link)
  link.click()

  window.setTimeout(() => {
    link.remove()
    window.URL.revokeObjectURL(url)
  }, 1_000)
}