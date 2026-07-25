import { useEffect, useState } from 'react';
import { fetchActiveServices } from '../../lib/api';
import { fmtPrice } from '../../lib/money';
import { durationLabel } from '../../lib/time';

export default function ServiceStep({ selected, onSelect }) {
  const [services, setServices] = useState(null);
  const [err, setErr] = useState(null);

  useEffect(function () {
    fetchActiveServices().then(setServices).catch(function (e) { setErr(e.message || String(e)); });
  }, []);

  if (err) return <div className="err-banner">{err}</div>;
  if (!services) return <p className="muted">Yükleniyor...</p>;

  const grouped = services.reduce(function (acc, s) {
    const cat = s.category || 'Diğer';
    (acc[cat] = acc[cat] || []).push(s);
    return acc;
  }, {});

  return (
    <>
      {Object.entries(grouped).map(([cat, items]) => (
        <div key={cat}>
          <div className="category-label">{cat}</div>
          <div className="service-list">
            {items.map((s) => (
              <button
                key={s.id}
                type="button"
                className={'service-card selectable' + (selected && selected.id === s.id ? ' on' : '')}
                onClick={function () { onSelect(s); }}
              >
                <div className="service-card-main">
                  <h3>{s.name}</h3>
                  <span className="muted">{durationLabel(s.duration_minutes)}</span>
                </div>
                <div className="service-card-price">
                  <strong>{fmtPrice(s.price_cents)}</strong>
                </div>
              </button>
            ))}
          </div>
        </div>
      ))}
    </>
  );
}
