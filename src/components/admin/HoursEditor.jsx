import { weekdayNames } from '../../lib/time';
import { useSalon } from '../../context/SalonContext';

// Postgres extract(dow) sırası: 0=Pazar..6=Cumartesi. Görünümde Pazartesi'den başlatıyoruz.
const DISPLAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

export default function HoursEditor({ hoursByDay, onChange }) {
  const { adminLocale } = useSalon();
  const dayNames = weekdayNames(adminLocale);

  function updateDay(weekday, ranges) {
    onChange(Object.assign({}, hoursByDay, { [weekday]: ranges }));
  }

  function addRange(weekday) {
    const ranges = hoursByDay[weekday] || [];
    updateDay(weekday, ranges.concat([{ start: '09:00', end: '19:00' }]));
  }

  function removeRange(weekday, idx) {
    const ranges = (hoursByDay[weekday] || []).filter(function (_, i) { return i !== idx; });
    updateDay(weekday, ranges);
  }

  function setRange(weekday, idx, field, value) {
    const ranges = (hoursByDay[weekday] || []).map(function (r, i) { return i === idx ? Object.assign({}, r, { [field]: value }) : r; });
    updateDay(weekday, ranges);
  }

  return (
    <div className="hours-grid">
      {DISPLAY_ORDER.map(function (weekday) {
        const ranges = hoursByDay[weekday] || [];
        return (
          <div key={weekday} className="hours-day">
            <div className="day-name">{dayNames[weekday]}</div>
            <div className="hours-day-slots">
              {ranges.length === 0 && <span className="muted" style={{ fontSize: '.82rem' }}>Kapalı</span>}
              {ranges.map(function (r, idx) {
                return (
                  <div key={idx} className="hours-slot-row">
                    <input className="input" type="time" value={r.start} onChange={function (e) { setRange(weekday, idx, 'start', e.target.value); }} />
                    <span className="muted">-</span>
                    <input className="input" type="time" value={r.end} onChange={function (e) { setRange(weekday, idx, 'end', e.target.value); }} />
                    <button type="button" className="btn btn-ghost btn-sm" onClick={function () { removeRange(weekday, idx); }}>Kaldır</button>
                  </div>
                );
              })}
              <button type="button" className="link-btn" style={{ textAlign: 'left', fontSize: '.82rem' }} onClick={function () { addRange(weekday); }}>
                + Saat aralığı ekle
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
