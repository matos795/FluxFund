import { AppRoutes } from "@/routes/app-routes"
import { Toaster } from "@/components/ui/sonner"

export default function App() {
  return (
    <>
      <AppRoutes />
      <Toaster theme="light" richColors position="top-right" />
    </>
  )
}