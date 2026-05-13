import { Route, Routes } from "react-router-dom"

import { DashboardPage } from "@/pages/dashboard-page"
import { AccountsPage } from "@/pages/accounts-page"
import { CategoriesPage } from "@/pages/categories-page"
import { FundsPage } from "@/pages/funds-page"
import { BeneficiariesPage } from "@/pages/beneficiaries-page"
import { TransactionsPage } from "@/pages/transactions-page"
import { NotFoundPage } from "@/pages/not-found-page"

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<DashboardPage />} />
      <Route path="/accounts" element={<AccountsPage />} />
      <Route path="/categories" element={<CategoriesPage />} />
      <Route path="/funds" element={<FundsPage />} />
      <Route path="/beneficiaries" element={<BeneficiariesPage />} />
      <Route path="/transactions" element={<TransactionsPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}