import { useEffect, useState } from 'react';
import { fetchActiveServices } from '../../lib/api';
import { fmtPrice } from '../../lib/money';
import { durationLabel } from '../../lib/time';
import { useSalon } from '../../context/SalonContext';

export default function ServiceStep({ selected, onSelect }) {
  const { t, loc, locale, currency } = useSalon();
  const [services, setServices] = useState(null);
  const [err, setErr] = useState(null);

  useEffect(function () {
    fetchActiveServices().then(setServices).catch(function (e) { setErr(e.message || String(e)); });
  }, []);

  if (err) return <div className="err-banner">{err}</div>;
  if (!services) return <p className="muted">{t('common.loading')}</p>;

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

  return (
    <>
      {order.map(function (cat) {
        return (
          <div key={cat}>
            <div className="category-label">{cat}</div>
            <div className="service-list">
              {map[cat].map(function (s) {
                return (
                  <button
                    key={s.id}
                    type="button"
                    className={'service-card selectable' + (selected && selected.id === s.id ? ' on' : '')}
                    aria-pressed={Boolean(selected && selected.id === s.id)}
                    onClick={function () { onSelect(s); }}
                  >
                    <div className="service-card-main">
                      <h3>{loc(s, 'name')}</h3>
                      <span className="muted">{durationLabel(s.duration_minutes, t)}</span>
                    </div>
                    <div className="service-card-price">
                      <strong>{fmtPrice(s.price_cents, locale, currency)}</strong>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </>
  );
}
