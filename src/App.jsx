import { Suspense, lazy } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { configured } from './lib/firebase';
import { useAuth } from './context/AuthContext';

import Home from './pages/Home';
import Booking from './pages/Booking';

// Panel yalnızca salon sahibinin girdiği bir bölüm; müşterinin ilk açılışında
// indirilmesi için hiçbir sebep yok. Statik import'ken beş panel sayfası da
// müşteri paketine giriyordu. lazy() ile ayrı bir parçaya alındı.
const AdminLogin = lazy(() => import('./pages/admin/Login'));
const AdminLayout = lazy(() => import('./components/admin/AdminLayout'));
const Dashboard = lazy(() => import('./pages/admin/Dashboard'));
const Appointments = lazy(() => import('./pages/admin/Appointments'));
const Services = lazy(() => import('./pages/admin/Services'));
const Staff = lazy(() => import('./pages/admin/Staff'));
const Settings = lazy(() => import('./pages/admin/Settings'));

export default function App() {
  if (!configured) return <SetupScreen />;

  return (
    <Suspense fallback={<div className="center-msg">Chargement...</div>}>
      <Routes>
        <Route path="/" element={<Home />} />
        {/* Müşteri tarafı Fransızca olduğu için kanonik adres /rendez-vous.
            /randevu-al eski bağlantılar bozulmasın diye yönlendirme olarak duruyor. */}
        <Route path="/rendez-vous" element={<Booking />} />
        <Route path="/randevu-al" element={<Navigate to="/rendez-vous" replace />} />
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
    </Suspense>
  );
}

function ProtectedAdmin({ children }) {
  const { session, isAdmin, loading, signOut } = useAuth();

  if (loading) return <div className="center-msg">Chargement...</div>;
  if (!session) return <Navigate to="/admin/giris" replace />;
  if (!isAdmin) return <PendingApproval email={session.email} onSignOut={signOut} />;
  return children;
}

// Hesap oluşturmak artık otomatik yetki VERMEZ (bkz. AuthContext.jsx).
// Yöneticilik Firebase konsolundan (Firestore → admins/{uid}) elle açılır.
function PendingApproval({ email, onSignOut }) {
  return (
    <div className="center-msg">
      <h2>Votre compte n'est pas encore autorisé</h2>
      <p className="muted">
        Le compte <strong>{email}</strong> a été créé mais n'est pas marqué comme administrateur.
        Votre prestataire doit autoriser ce compte depuis la console Firebase.
      </p>
      <button className="btn btn-ghost" onClick={onSignOut}>Déconnexion</button>
    </div>
  );
}

function SetupScreen() {
  return (
    <div className="center-msg setup">
      <h1>RANDEVU</h1>
      <p>Firebase yapılandırması eksik: <code>src/lib/firebase.js</code>.</p>
    </div>
  );
}
