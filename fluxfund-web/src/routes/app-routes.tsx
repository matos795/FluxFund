import { Route, Routes } from "react-router-dom"

import { DashboardPage } from "@/pages/dashboard-page"
import { AccountsPage } from "@/pages/accounts-page"
import { CategoriesPage } from "@/pages/categories-page"
import { FundsPage } from "@/pages/funds-page"
import { BeneficiariesPage } from "@/pages/beneficiaries-page"
import { TransactionsPage } from "@/pages/transactions-page"
import { NotFoundPage } from "@/pages/not-found-page"
import { AppLayout } from "@/components/layout/app-layout"
import { ReportsPage } from "@/pages/reports-page"
import { CategoryResultReportPage } from "@/pages/results/category-result-report-page"
import { FundReportPage } from "@/pages/results/fund-report-page"

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/accounts" element={<AccountsPage />} />
        <Route path="/categories" element={<CategoriesPage />} />
        <Route path="/funds" element={<FundsPage />} />
        <Route path="/beneficiaries" element={<BeneficiariesPage />} />
        <Route path="/transactions" element={<TransactionsPage />} />
        <Route path="/reports" element={<ReportsPage />} />
          <Route path="/reports/category-result" element={<CategoryResultReportPage />} />
          <Route path="/reports/funds" element={<FundReportPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}