import { Navigate, Route, Routes } from 'react-router-dom';
import { configured } from './lib/supabase';
import { useAuth } from './context/AuthContext';

import Home from './pages/Home';
import Booking from './pages/Booking';
import AdminLogin from './pages/admin/Login';
import AdminLayout from './components/admin/AdminLayout';
import Dashboard from './pages/admin/Dashboard';
import Appointments from './pages/admin/Appointments';
import Services from './pages/admin/Services';
import Staff from './pages/admin/Staff';
import Settings from './pages/admin/Settings';

export default function App() {
  if (!configured) return <SetupScreen />;

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/randevu-al" element={<Booking />} />
      <Route path="/admin/giris" element={<AdminLogin />} />
      <Route path="/admin" element={<ProtectedAdmin><AdminLayout /></ProtectedAdmin>}>
        <Route index element={<Dashboard />} />
        <Route path="randevular" element={<Appointments />} />
        <Route path="hizmetler" element={<Services />} />
        <Route path="personel" element={<Staff />} />
        <Route path="ayarlar" element={<Settings />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function ProtectedAdmin({ children }) {
  const { session, isAdmin, loading, claimAdmin } = useAuth();

  if (loading) return <div className="center-msg">Yükleniyor...</div>;
  if (!session) return <Navigate to="/admin/giris" replace />;
  if (!isAdmin) return <PendingApproval onClaim={claimAdmin} />;
  return children;
}

function PendingApproval({ onClaim }) {
  async function handleClaim() {
    try {
      const granted = await onClaim();
      if (!granted) window.location.reload();
    } catch (e) {
      alert(e.message || String(e));
    }
  }
  return (
    <div className="center-msg">
      <h2>Hesabınız henüz onaylanmadı</h2>
      <p className="muted">
        Bu salonun ilk yöneticisi değilseniz, mevcut bir yöneticinin sizi eklemesi gerekir.
        Eğer ilk kurulumu yapıyorsanız aşağıdan yönetici olarak devam edebilirsiniz.
      </p>
      <button className="btn btn-primary" onClick={handleClaim}>Yönetici olarak devam et</button>
    </div>
  );
}

function SetupScreen() {
  return (
    <div className="center-msg setup">
      <h1>RANDEVU</h1>
      <p><code>.env</code> boş. Supabase Settings → API'den al:</p>
      <pre>{'VITE_SUPABASE_URL=https://XXX.supabase.co\nVITE_SUPABASE_ANON_KEY=eyJ...'}</pre>
    </div>
  );
}
