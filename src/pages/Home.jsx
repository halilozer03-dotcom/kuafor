import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchActiveServices, fetchSettings } from '../lib/api';
import { fmtPrice } from '../lib/money';
import { durationLabel } from '../lib/time';
import SiteHeader from '../components/booking/SiteHeader';

export default function Home() {
  const [settings, setSettings] = useState(null);
  const [services, setServices] = useState(null);
  const [err, setErr] = useState(null);

  useEffect(function () {
    Promise.all([fetchSettings(), fetchActiveServices()])
      .then(function ([s, sv]) {
        setSettings(s);
        setServices(sv);
      })
      .catch(function (e) {
        setErr(e.message || String(e));
      });
  }, []);

  if (err) return <div className="center-msg">Bir şeyler ters gitti.<br /><span className="muted">{err}</span></div>;
  if (!settings || !services) return <div className="center-msg">Yükleniyor...</div>;

  const grouped = groupByCategory(services);

  return (
    <div className="app">
      <SiteHeader name={settings.name} />

      <section className="hero">
        <h1>{settings.name}</h1>
        <p>{settings.slogan || 'Birkaç adımda size uygun hizmeti, personeli ve saati seçin.'}</p>
        <div className="hero-cta">
          <Link to="/randevu-al" className="btn btn-accent">Randevu Al</Link>
        </div>
        <div className="hero-badges">
          {settings.opening_hours_note && <span className="hero-badge">🕘 {settings.opening_hours_note}</span>}
          {settings.address && <span className="hero-badge">📍 {settings.address}</span>}
          {settings.phone && <span className="hero-badge">📞 {settings.phone}</span>}
        </div>
      </section>

      <section className="section">
        <h2 className="section-title">Hizmetlerimiz</h2>
        <div className="service-list">
          {Object.entries(grouped).map(([cat, items]) => (
            <div key={cat}>
              <div className="category-label">{cat}</div>
              {items.map((s) => (
                <div key={s.id} className="service-card">
                  <div className="service-card-main">
                    <h3>{s.name}</h3>
                    <span className="muted">{durationLabel(s.duration_minutes)}</span>
                  </div>
                  <div className="service-card-price">
                    <strong>{fmtPrice(s.price_cents)}</strong>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </section>

      {settings.description && (
        <section className="section">
          <h2 className="section-title">Hakkımızda</h2>
          <p className="muted">{settings.description}</p>
        </section>
      )}

      <div className="wizard-foot">
        <div className="wizard-foot-inner">
          <Link to="/randevu-al" className="btn btn-accent btn-block">Randevu Al</Link>
        </div>
      </div>
    </div>
  );
}

function groupByCategory(services) {
  return services.reduce(function (acc, s) {
    const cat = s.category || 'Diğer';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(s);
    return acc;
  }, {});
}
