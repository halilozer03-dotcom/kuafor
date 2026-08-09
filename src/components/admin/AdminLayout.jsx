import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSalon } from '../../context/SalonContext';
import BarberEmblem from '../BarberEmblem';

const LINKS = [
  { to: '/admin', label: 'Panel', end: true },
  { to: '/admin/randevular', label: 'Randevular' },
  { to: '/admin/hizmetler', label: 'Hizmetler' },
  { to: '/admin/personel', label: 'Personel' },
  { to: '/admin/ayarlar', label: 'Ayarlar' },
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
        <strong>Yönetim Paneli</strong>
        <button className="btn btn-ghost btn-sm" style={{ background: 'transparent', color: '#fff', borderColor: 'rgba(255,255,255,.3)' }} onClick={function () { setMobileOpen(!mobileOpen); }}>
          {mobileOpen ? 'Kapat' : 'Menü'}
        </button>
      </div>

      <aside className="admin-sidebar" style={mobileOpen ? { display: 'flex', position: 'fixed', inset: 0, zIndex: 30, width: '100%' } : undefined}>
        <div className="admin-brand">
          <span className="admin-brand-mark"><BarberEmblem /></span>
          Yönetim Paneli
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
          <button className="admin-nav-link" onClick={handleSignOut}>Çıkış Yap</button>
        </div>
      </aside>

      <main className="admin-main">
        {locked && (
          <div className="subscription-banner">
            <strong>Online randevu kapalı.</strong> Müşteriler şu anda siteden randevu alamıyor.
            Mevcut randevularınızı görmeye ve yönetmeye devam edebilirsiniz. Açtırmak için sistem sağlayıcınıza ulaşın.
          </div>
        )}
        <Outlet />
      </main>
    </div>
  );
}
