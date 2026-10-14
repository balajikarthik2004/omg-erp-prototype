import { Navigate, Route, Routes } from 'react-router-dom'

import { ConsoleLayout } from '@/components/layout/ConsoleLayout'
import { DonorLayout } from '@/components/layout/DonorLayout'
import { Toaster } from '@/components/ui/Toast'

import { HomePage } from '@/features/donor/HomePage'
import { LoginPage } from '@/features/donor/LoginPage'
import { MyDonationsPage } from '@/features/donor/MyDonationsPage'
import { CatalogPage } from '@/features/catalog/CatalogPage'
import { ItemDetailPage } from '@/features/catalog/ItemDetailPage'
import { CheckoutPage } from '@/features/checkout/CheckoutPage'
import { ReceiptPage } from '@/features/checkout/ReceiptPage'

import { DashboardPage } from '@/features/dashboard/DashboardPage'
import { DonationsPage } from '@/features/donations/DonationsPage'
import { ReconciliationPage } from '@/features/reconciliation/ReconciliationPage'
import { LedgerPage } from '@/features/ledger/LedgerPage'
import { AllotmentsPage } from '@/features/allotments/AllotmentsPage'
import { BudgetsPage } from '@/features/budgets/BudgetsPage'
import { InventoryPage } from '@/features/inventory/InventoryPage'
import { SuppliersPage } from '@/features/suppliers/SuppliersPage'
import { ProcurementPage } from '@/features/procurement/ProcurementPage'
import { PurchaseOrdersPage } from '@/features/purchase-orders/PurchaseOrdersPage'
import { PurchaseOrderDetailPage } from '@/features/purchase-orders/PurchaseOrderDetailPage'
import { PaymentsPage } from '@/features/payments/PaymentsPage'
import { ApprovalsPage } from '@/features/approvals/ApprovalsPage'
import { ReportsPage } from '@/features/reports/ReportsPage'
import { AuditPage } from '@/features/audit/AuditPage'
import { CatalogManagerPage } from '@/features/catalog/CatalogManagerPage'
import { NotFoundPage } from '@/features/donor/NotFoundPage'
import { GaushalaPage } from '@/features/gaushala/GaushalaPage'
import { GaushalaDashboardPage } from '@/features/gaushala/console/GaushalaDashboardPage'
import { CowManagementPage } from '@/features/gaushala/console/CowManagementPage'
import { SewaCataloguePage } from '@/features/gaushala/console/SewaCataloguePage'
import { GaushalaDonationsPage } from '@/features/gaushala/console/GaushalaDonationsPage'
import { SevaPage } from '@/features/gaushala/SevaPage'
import { StatementPage } from '@/features/donor/StatementPage'
import { EventsPage } from '@/features/events/EventsPage'
import { EventsOverviewPage } from '@/features/events/EventsOverviewPage'
import { BudgetsPlanningPage } from '@/features/events/BudgetsPlanningPage'
import { ApprovalCenterPage } from '@/features/events/ApprovalCenterPage'
import { PosterStudioPage } from '@/features/events/PosterStudioPage'
import { RegistrationsPage } from '@/features/events/RegistrationsPage'
import { PurchasesPage } from '@/features/events/PurchasesPage'
import { EventReportsPage } from '@/features/events/EventReportsPage'
import { EventDetailPage } from '@/features/events/EventDetailPage'
import { PublicEventsPage } from '@/features/events/PublicEventsPage'
import { RegisterPage } from '@/features/events/RegisterPage'
import { CashCountsPage } from '@/features/cash-counts/CashCountsPage'
import { PeriodClosePage } from '@/features/period-close/PeriodClosePage'
import { OnboardingPage } from '@/features/onboarding/OnboardingPage'
import { OnboardingWizardPage } from '@/features/onboarding/OnboardingWizardPage'
import { CsrOverviewPage } from '@/features/csr/CsrOverviewPage'
import { ComplianceVaultPage } from '@/features/csr/ComplianceVaultPage'
import { CsrProjectsPage } from '@/features/csr/CsrProjectsPage'
import { CompanyPipelinePage } from '@/features/csr/CompanyPipelinePage'
import { CsrDealsPage } from '@/features/csr/CsrDealsPage'
import { CsrReportsPage } from '@/features/csr/CsrReportsPage'

export function App() {
  return (
    <>
      <Routes>
        <Route element={<DonorLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/donate/:sector" element={<CatalogPage />} />
          <Route path="/donate/:sector/:itemId" element={<ItemDetailPage />} />

          {/* Sevalaya is two pages now. The old URL keeps working: a static
              segment outranks /donate/:sector, so this wins for Sevalaya. */}
          <Route path="/donate/sevalaya" element={<Navigate to="/sevalaya/seva" replace />} />
          <Route path="/sevalaya" element={<Navigate to="/sevalaya/seva" replace />} />
          <Route path="/sevalaya/seva" element={<SevaPage />} />
          <Route path="/sevalaya/gaushala" element={<GaushalaPage />} />
          <Route path="/sevalaya/gaushala/:itemId" element={<ItemDetailPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/receipt/:donationId" element={<ReceiptPage />} />
          <Route path="/my/donations" element={<MyDonationsPage />} />
          <Route path="/my/statement" element={<StatementPage />} />
          <Route path="/events" element={<PublicEventsPage />} />
          <Route path="/register/:eventId" element={<RegisterPage />} />
        </Route>

        <Route path="/console" element={<ConsoleLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="donations" element={<DonationsPage />} />
          <Route path="events" element={<EventsPage />} />
          <Route path="events/overview" element={<EventsOverviewPage />} />
          <Route path="events/budgets" element={<BudgetsPlanningPage />} />
          <Route path="events/approvals" element={<ApprovalCenterPage />} />
          <Route path="events/studio" element={<PosterStudioPage />} />
          <Route path="events/registrations" element={<RegistrationsPage />} />
          <Route path="events/purchases" element={<PurchasesPage />} />
          <Route path="events/reports" element={<EventReportsPage />} />
          <Route path="events/:eventId" element={<EventDetailPage />} />
          <Route path="gaushala" element={<GaushalaDashboardPage />} />
          <Route path="gaushala/cows" element={<CowManagementPage />} />
          <Route path="gaushala/sewas" element={<SewaCataloguePage />} />
          <Route path="gaushala/donations" element={<GaushalaDonationsPage />} />
          {/* CSR */}
          <Route path="csr" element={<CsrOverviewPage />} />
          <Route path="csr/compliance" element={<ComplianceVaultPage />} />
          <Route path="csr/projects" element={<CsrProjectsPage />} />
          <Route path="csr/pipeline" element={<CompanyPipelinePage />} />
          <Route path="csr/deals" element={<CsrDealsPage />} />
          <Route path="csr/reports" element={<CsrReportsPage />} />
          <Route path="cash-counts" element={<CashCountsPage />} />
          <Route path="period-close" element={<PeriodClosePage />} />
          <Route path="onboarding" element={<OnboardingPage />} />
          <Route path="onboarding/new" element={<OnboardingWizardPage />} />
          <Route path="reconciliation" element={<ReconciliationPage />} />
          <Route path="ledger" element={<LedgerPage />} />
          <Route path="allotments" element={<AllotmentsPage />} />
          <Route path="budgets" element={<BudgetsPage />} />
          <Route path="inventory" element={<InventoryPage />} />
          <Route path="suppliers" element={<SuppliersPage />} />
          <Route path="procurement" element={<ProcurementPage />} />
          <Route path="purchase-orders" element={<PurchaseOrdersPage />} />
          <Route path="purchase-orders/:poId" element={<PurchaseOrderDetailPage />} />
          <Route path="payments" element={<PaymentsPage />} />
          <Route path="approvals" element={<ApprovalsPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="audit" element={<AuditPage />} />
          <Route path="settings/catalog" element={<CatalogManagerPage />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      <Toaster />
    </>
  )
}
