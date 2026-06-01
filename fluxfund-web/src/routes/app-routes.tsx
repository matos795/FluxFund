import { Route, Routes } from "react-router-dom"

import { AppLayout } from "@/components/layout/app-layout"
import { AccountsPage } from "@/pages/accounts-page"
import { BeneficiariesPage } from "@/pages/beneficiaries-page"
import { CategoriesPage } from "@/pages/categories-page"
import { DashboardPage } from "@/pages/dashboard-page"
import { FundsPage } from "@/pages/funds-page"
import { LoginPage } from "@/pages/login-page"
import { NoOrganizationPage } from "@/pages/no-organization-page"
import { NotFoundPage } from "@/pages/not-found-page"
import { ReportsPage } from "@/pages/reports-page"
import { AccountabilityReportPage } from "@/pages/results/accountability-report-page"
import { CategoryResultReportPage } from "@/pages/results/category-result-report-page"
import { FundReportPage } from "@/pages/results/fund-report-page"
import { SettingsPage } from "@/pages/settings-page"
import { SupportAgreementsPage } from "@/pages/support-agreements-page"
import { TransactionsPage } from "@/pages/transactions-page"
import { ProtectedRoute } from "@/routes/protected-route"

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/no-organization" element={<NoOrganizationPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/accounts" element={<AccountsPage />} />
          <Route path="/categories" element={<CategoriesPage />} />
          <Route path="/funds" element={<FundsPage />} />
          <Route path="/beneficiaries" element={<BeneficiariesPage />} />
          <Route
            path="/support-agreements"
            element={<SupportAgreementsPage />}
          />
          <Route path="/transactions" element={<TransactionsPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route
            path="/reports/category-result"
            element={<CategoryResultReportPage />}
          />
          <Route path="/reports/funds" element={<FundReportPage />} />
          <Route
            path="/reports/accountability"
            element={<AccountabilityReportPage />}
          />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Route>
    </Routes>
  )
}