import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import AppLayout from './components/AppLayout.jsx';
import LoginPage from './pages/Login.jsx';
import DashboardPage from './pages/Dashboard.jsx';
import ItemsPage from './pages/items/ItemsPage.jsx';
import ItemsDownloadPage from './pages/items/ItemsDownloadPage.jsx';
import ItemsTrashPage from './pages/items/ItemsTrashPage.jsx';
import OverstockPage from './pages/items/OverstockPage.jsx';
import BarcodeReceptionPage from './pages/items/BarcodeReceptionPage.jsx';
import InventoryAlertsPage from './pages/InventoryAlerts.jsx';
import GroupsPage from './pages/groups/GroupsPage.jsx';
import MovementRequestsPage from './pages/movements/MovementRequestsPage.jsx';
import ApprovalsPage from './pages/movements/ApprovalsPage.jsx';
import LocationsPage from './pages/locations/LocationsPage.jsx';
import ReportsPage from './pages/reports/ReportsPage.jsx';
import AuditLogsPage from './pages/audit/AuditLogsPage.jsx';
import UsersPage from './pages/users/UsersPage.jsx';
import PricingPage from './pages/public/PricingPage.jsx';
import FeaturesPage from './pages/public/FeaturesPage.jsx';
import RegisterTenantPage from './pages/public/RegisterTenantPage.jsx';
import PaymentResultPage from './pages/public/PaymentResultPage.jsx';
import LicensePage from './pages/billing/LicensePage.jsx';
import PlansAdminPage from './pages/billing/PlansAdminPage.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/funcionalidades" element={<FeaturesPage />} />
      <Route path="/planes" element={<PricingPage />} />
      <Route path="/registro" element={<RegisterTenantPage />} />
      <Route path="/pago/:status" element={<PaymentResultPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="inventory/alerts" element={<InventoryAlertsPage />} />
        <Route path="items" element={<ItemsPage />} />
        <Route path="overstock" element={<OverstockPage />} />
        <Route path="items/barcode-reception" element={<BarcodeReceptionPage />} />
        <Route path="items/download" element={<ItemsDownloadPage />} />
        <Route path="items/trash" element={<ItemsTrashPage />} />
        <Route path="groups" element={<GroupsPage />} />
        <Route path="requests" element={<MovementRequestsPage />} />
        <Route path="approvals" element={<ApprovalsPage />} />
        <Route path="locations" element={<LocationsPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="audit" element={<AuditLogsPage />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="licencia" element={<LicensePage />} />
        <Route path="admin/planes" element={<PlansAdminPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
