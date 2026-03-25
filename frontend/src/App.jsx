import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Customers from './pages/Customers';
import CustomerDetail from './pages/CustomerDetail';
import Medicines from './pages/Medicines';
import Inventory from './pages/Inventory';
import Prescriptions from './pages/Prescriptions';
import NewPrescription from './pages/NewPrescription';
import PrescriptionDetail from './pages/PrescriptionDetail';
import Reports from './pages/Reports';
import Alerts from './pages/Alerts';

function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-screen"><div className="spinner" /><span>Loading&hellip;</span></div>;
  if (!user)   return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  const { user, loading } = useAuth();

  if (loading) return <div className="loading-screen"><div className="spinner" /><span>Loading&hellip;</span></div>;

  return (
    <Routes>
      <Route path="/" element={user ? <Navigate to="/app" replace /> : <Landing />} />
      <Route path="/login" element={user ? <Navigate to="/app" replace /> : <Login />} />
      <Route path="/app" element={<RequireAuth><Layout /></RequireAuth>}>
        <Route index element={<Dashboard />} />
        <Route path="customers"           element={<Customers />} />
        <Route path="customers/:id"       element={<CustomerDetail />} />
        <Route path="medicines"           element={<Medicines />} />
        <Route path="inventory"           element={<Inventory />} />
        <Route path="prescriptions"       element={<Prescriptions />} />
        <Route path="prescriptions/new"   element={<NewPrescription />} />
        <Route path="prescriptions/:id"   element={<PrescriptionDetail />} />
        <Route path="reports"             element={<Reports />} />
        <Route path="alerts"              element={<Alerts />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
