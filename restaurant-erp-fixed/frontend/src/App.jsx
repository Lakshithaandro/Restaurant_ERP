import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import Layout from "./components/Layout.jsx";
import VisualEffects from "./components/VisualEffects.jsx";

import Landing from "./pages/Landing.jsx";
import CustomerPortal from "./pages/CustomerPortal.jsx";
import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Reservations from "./pages/Reservations.jsx";
import Orders from "./pages/Orders.jsx";
import Kitchen from "./pages/Kitchen.jsx";
import Inventory from "./pages/Inventory.jsx";
import Billing from "./pages/Billing.jsx";
import Staff from "./pages/Staff.jsx";
import Attendance from "./pages/Attendance.jsx";
import Reports from "./pages/Reports.jsx";

const staffPage = (Component, roles) => (
  <ProtectedRoute roles={roles}>
    <Layout>
      <Component />
    </Layout>
  </ProtectedRoute>
);

export default function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <>
        <VisualEffects />
        <div className="loading">
          <div className="spinner" />
        </div>
      </>
    );
  }

  return (
    <>
      <VisualEffects />
      <Routes>
      <Route
        path="/"
        element={user ? <Navigate to="/staff-portal" replace /> : <Landing />}
      />
      <Route path="/customer" element={<CustomerPortal />} />
      <Route
        path="/staff-login"
        element={user ? <Navigate to="/staff-portal" replace /> : <Login />}
      />
      <Route path="/login" element={<Navigate to="/staff-login" replace />} />

      <Route path="/staff-portal" element={staffPage(Dashboard)} />
      <Route
        path="/staff-portal/reservations"
        element={staffPage(Reservations, ["admin", "manager", "waiter"])}
      />
      <Route
        path="/staff-portal/orders"
        element={staffPage(Orders, ["admin", "manager", "waiter"])}
      />
      <Route
        path="/staff-portal/kitchen"
        element={staffPage(Kitchen, ["admin", "manager", "kitchen"])}
      />
      <Route
        path="/staff-portal/inventory"
        element={staffPage(Inventory, ["admin", "manager", "kitchen"])}
      />
      <Route
        path="/staff-portal/billing"
        element={staffPage(Billing, ["admin", "manager", "cashier", "waiter"])}
      />
      <Route
        path="/staff-portal/team"
        element={staffPage(Staff, ["admin", "manager"])}
      />
      <Route
        path="/staff-portal/attendance"
        element={staffPage(Attendance)}
      />
      <Route
        path="/staff-portal/reports"
        element={staffPage(Reports, ["admin", "manager"])}
      />
      <Route
        path="*"
        element={<Navigate to={user ? "/staff-portal" : "/"} replace />}
      />
      </Routes>
    </>
  );
}
