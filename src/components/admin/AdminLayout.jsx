import { useEffect, useState } from 'react';
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

  // Çekmece açıkken arkadaki sayfanın kaymaması ve ESC ile kapanması.
  useEffect(function () {
    if (!mobileOpen) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    function onKey(e) { if (e.key === 'Escape') setMobileOpen(false); }
    document.addEventListener('keydown', onKey);
    return function () {
      document.body.style.overflow = prev;
      document.removeEventListener('keydown', onKey);
    };
  }, [mobileOpen]);

  async function handleSignOut() {
    await signOut();
    navigate('/admin/giris');
  }

  return (
    <div className="admin-shell">
      <div className="admin-mobile-bar">
        <strong>Espace admin</strong>
        <button
          className="btn btn-ghost btn-sm"
          style={{ background: 'transparent', color: '#fff', borderColor: 'rgba(255,255,255,.3)' }}
          aria-expanded={mobileOpen}
          onClick={function () { setMobileOpen(!mobileOpen); }}
        >
          Menu
        </button>
      </div>

      <aside className={'admin-sidebar' + (mobileOpen ? ' open' : '')}>
        <div className="admin-brand">
          <span className="admin-brand-mark"><BarberEmblem /></span>
          Espace admin
          {/* Açık çekmece üstteki çubuğu örttüğü için kapatma düğmesi çekmecenin
              KENDİ içinde olmak zorunda; yoksa menü bir bağlantıya basmadan
              kapatılamıyor. */}
          <button className="admin-drawer-close" aria-label="Fermer le menu" onClick={function () { setMobileOpen(false); }}>×</button>
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
