import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchActiveServices } from '../lib/api';
import { fmtPrice } from '../lib/money';
import { durationLabel } from '../lib/time';
import { useSalon } from '../context/SalonContext';
import SiteHeader from '../components/booking/SiteHeader';
import LockedNotice from '../components/LockedNotice';
import LocationMap from '../components/LocationMap';
import SalonGallery from '../components/SalonGallery';

export default function Home() {
  const { settings, settingsErr, t, loc, locale, currency, locked } = useSalon();
  const [services, setServices] = useState(null);
  const [err, setErr] = useState(null);

  useEffect(function () {
    fetchActiveServices()
      .then(setServices)
      .catch(function (e) { setErr(e.message || String(e)); });
  }, []);

  const failure = settingsErr || err;
  if (failure) return <div className="center-msg">{t('common.error')}<br /><span className="muted">{failure}</span></div>;
  if (!settings || !services) return <div className="center-msg">{t('common.loading')}</div>;

  const grouped = groupByCategory(services, loc, t);

  return (
    <div className="app">
      <SiteHeader showBookButton={!locked} />

      {/* KALIP NOTU: hero.jpg salona özeldir (favicon.svg ile aynı kategoride).
          Yeni salonda bu dosya değişir, kod değişmez.
          Tek boyut: kaynak render 738px genişliğinden büyük değil, daha büyük
          sürüm üretmek büyütme olur ve yumuşatırdı. */}
      <div className="hero-banner">
        <img
          src="/hero.jpg"
          alt={t('home.bannerAlt') + (settings.name ? ' — ' + settings.name : '')}
          width="738"
          height="558"
        />
      </div>

      <section className="hero">
        <h1>{settings.name}</h1>
        <p>{loc(settings, 'slogan') || t('home.heroFallback')}</p>
        {!locked && (
          <div className="hero-cta">
            <Link to="/rendez-vous" className="btn btn-accent">{t('nav.book')}</Link>
          </div>
        )}
        <div className="hero-badges">
          {loc(settings, 'opening_hours_note') && <span className="hero-badge">🕘 {loc(settings, 'opening_hours_note')}</span>}
          {settings.address && <span className="hero-badge">📍 {settings.address}</span>}
          {settings.phone && <span className="hero-badge">📞 {settings.phone}</span>}
        </div>
      </section>

      {locked && <section className="section"><LockedNotice /></section>}

      <section className="section">
        <h2 className="section-title">{t('home.services')}</h2>
        <div className="service-list">
          {grouped.map(function (group) {
            return (
              <div key={group.label}>
                <div className="category-label">{group.label}</div>
                {group.items.map(function (s) {
                  return (
                    <div key={s.id} className="service-card">
                      <div className="service-card-main">
                        <h3>{loc(s, 'name')}</h3>
                        <span className="muted">{durationLabel(s.duration_minutes, t)}</span>
                      </div>
                      <div className="service-card-price">
                        <strong>{fmtPrice(s.price_cents, locale, currency)}</strong>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </section>

      {loc(settings, 'description') && (
        <section className="section">
          <h2 className="section-title">{t('home.about')}</h2>
          <p className="muted">{loc(settings, 'description')}</p>
        </section>
      )}

      <SalonGallery />

      <LocationMap />

      {!locked && (
        <div className="wizard-foot">
          <div className="wizard-foot-inner">
            <Link to="/rendez-vous" className="btn btn-accent btn-block">{t('nav.book')}</Link>
          </div>
        </div>
      )}
    </div>
  );
}

// Kategori sırası hizmetin sort_order'ını izler; alfabetik sıralama fiyat
// listesinin vitrindeki düzenini bozardı.
function groupByCategory(services, loc, t) {
  const order = [];
  const map = {};
  services.forEach(function (s) {
    const label = loc(s, 'category') || t('common.other');
    if (!map[label]) {
      map[label] = [];
      order.push(label);
    }
    map[label].push(s);
  });
  return order.map(function (label) { return { label, items: map[label] }; });
}
