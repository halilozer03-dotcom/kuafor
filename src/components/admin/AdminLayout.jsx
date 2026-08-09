import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSalon } from '../../context/SalonContext';
import BarberEmblem from '../BarberEmblem';

const LINKS = [
  { to: '/admin', label: 'Tableau de bord', end: true },
  { to: '/admin/randevular', label: 'Rendez-vous' },
  { to: '/admin/hizmetler', label: 'Prestations' },
  { to: '/admin/personel', label: 'Personnel' },
  { to: '/admin/ayarlar', label: 'Paramètres' },
];

export default function AdminLayout() {
  const { signOut } = useAuth();
  const { locked } = useSalon();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  async function handleSignOut() {
    await signOut();
    navigate('/admin/giris');
  }

  return (
    <div className="admin-shell">
      <div className="admin-mobile-bar">
        <strong>Espace admin</strong>
        <button className="btn btn-ghost btn-sm" style={{ background: 'transparent', color: '#fff', borderColor: 'rgba(255,255,255,.3)' }} onClick={function () { setMobileOpen(!mobileOpen); }}>
          {mobileOpen ? 'Fermer' : 'Menu'}
        </button>
      </div>

      <aside className="admin-sidebar" style={mobileOpen ? { display: 'flex', position: 'fixed', inset: 0, zIndex: 30, width: '100%' } : undefined}>
        <div className="admin-brand">
          <span className="admin-brand-mark"><BarberEmblem /></span>
          Espace admin
        </div>
        {LINKS.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            end={l.end}
            className={function ({ isActive }) { return 'admin-nav-link' + (isActive ? ' on' : ''); }}
            onClick={function () { setMobileOpen(false); }}
          >
            {l.label}
          </NavLink>
        ))}
        <div className="admin-sidebar-foot">
          <button className="admin-nav-link" onClick={handleSignOut}>Déconnexion</button>
        </div>
      </aside>

      <main className="admin-main">
        {locked && (
          <div className="subscription-banner">
            <strong>Réservation en ligne fermée.</strong> Les clients ne peuvent pas prendre rendez-vous en ligne pour le moment.
            Vous pouvez continuer à consulter et gérer vos rendez-vous existants. Contactez votre prestataire pour la réactiver.
          </div>
        )}
        <Outlet />
      </main>
    </div>
  );
}
