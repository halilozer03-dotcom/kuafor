import { Link } from 'react-router-dom';
import { useSalon } from '../../context/SalonContext';
import LangSwitch from '../LangSwitch';
import BarberEmblem from '../BarberEmblem';

export default function SiteHeader({ showBookButton = true }) {
  const { settings, t } = useSalon();
  const name = (settings && settings.name) || '';

  return (
    <header className="site-header">
      <div className="site-header-inner">
        <Link to="/" className="brand">
          <span className="brand-mark"><BarberEmblem /></span>
          {name}
        </Link>
        <div className="site-header-actions">
          <LangSwitch />
          {showBookButton && (
            <Link to="/rendez-vous" className="btn btn-accent btn-sm">{t('nav.book')}</Link>
          )}
        </div>
      </div>
    </header>
  );
}
