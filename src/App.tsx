import { Route, Routes } from 'react-router-dom'

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

export function App() {
  return (
    <>
      <Routes>
        <Route element={<DonorLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/donate/:sector" element={<CatalogPage />} />
          <Route path="/donate/:sector/:itemId" element={<ItemDetailPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/receipt/:donationId" element={<ReceiptPage />} />
          <Route path="/my/donations" element={<MyDonationsPage />} />
        </Route>

        <Route path="/console" element={<ConsoleLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="donations" element={<DonationsPage />} />
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
