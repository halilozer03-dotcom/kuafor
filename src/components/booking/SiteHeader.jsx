import { Link } from 'react-router-dom';

export default function SiteHeader({ name }) {
  const initial = (name || 'S').trim().charAt(0).toUpperCase();
  return (
    <header className="site-header">
      <div className="site-header-inner">
        <Link to="/" className="brand">
          <span className="brand-mark">{initial}</span>
          {name || 'Kuaför Salonu'}
        </Link>
        <Link to="/randevu-al" className="btn btn-accent btn-sm">Randevu Al</Link>
      </div>
    </header>
  );
}
