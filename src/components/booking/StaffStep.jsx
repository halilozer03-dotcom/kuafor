import { useEffect, useState } from 'react';
import { fetchStaffForService } from '../../lib/api';
import { useSalon } from '../../context/SalonContext';

export default function StaffStep({ serviceId, selectedId, onSelect, onAutoSkip }) {
  const { t, loc } = useSalon();
  const [staff, setStaff] = useState(null);
  const [err, setErr] = useState(null);

  useEffect(function () {
    setStaff(null);
    fetchStaffForService(serviceId)
      .then(function (list) {
        setStaff(list);
        if (list.length === 1 && onAutoSkip) onAutoSkip(list[0]);
      })
      .catch(function (e) { setErr(e.message || String(e)); });
  }, [serviceId]);

  if (err) return <div className="err-banner">{err}</div>;
  if (!staff) return <p className="muted">{t('common.loading')}</p>;
  if (staff.length === 0) return <p className="muted">{t('staff.none')}</p>;

  return (
    <div className="staff-list">
      {staff.length > 1 && (
        <button
          type="button"
          className={'staff-card' + (selectedId === null ? ' on' : '')}
          aria-pressed={selectedId === null}
          onClick={function () { onSelect(null); }}
        >
          <span className="staff-avatar">?</span>
          <div className="staff-info">
            <h3>{t('staff.any')}</h3>
            <p>{t('staff.anyHint')}</p>
          </div>
        </button>
      )}
      {staff.map(function (s) {
        return (
          <button
            key={s.id}
            type="button"
            className={'staff-card' + (selectedId === s.id ? ' on' : '')}
            aria-pressed={selectedId === s.id}
            onClick={function () { onSelect(s.id); }}
          >
            <span className="staff-avatar">
              {s.avatar_url ? <img src={s.avatar_url} alt="" /> : s.full_name.charAt(0).toUpperCase()}
            </span>
            <div className="staff-info">
              <h3>{s.full_name}</h3>
              {loc(s, 'title') && <p>{loc(s, 'title')}</p>}
            </div>
          </button>
        );
      })}
    </div>
  );
}
