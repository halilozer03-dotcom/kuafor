import { useEffect, useState } from 'react';
import { fetchStaffForService } from '../../lib/api';

export default function StaffStep({ serviceId, selectedId, onSelect, onAutoSkip }) {
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
  if (!staff) return <p className="muted">Yükleniyor...</p>;
  if (staff.length === 0) return <p className="muted">Bu hizmeti verebilecek personel bulunamadı.</p>;

  return (
    <div className="staff-list">
      {staff.length > 1 && (
        <button
          type="button"
          className={'staff-card' + (selectedId === null ? ' on' : '')}
          onClick={function () { onSelect(null); }}
        >
          <span className="staff-avatar">?</span>
          <div className="staff-info">
            <h3>Farketmez</h3>
            <p>İlk uygun personel</p>
          </div>
        </button>
      )}
      {staff.map((s) => (
        <button
          key={s.id}
          type="button"
          className={'staff-card' + (selectedId === s.id ? ' on' : '')}
          onClick={function () { onSelect(s.id, s.full_name); }}
        >
          <span className="staff-avatar">
            {s.avatar_url ? <img src={s.avatar_url} alt="" /> : s.full_name.charAt(0).toUpperCase()}
          </span>
          <div className="staff-info">
            <h3>{s.full_name}</h3>
            {s.title && <p>{s.title}</p>}
          </div>
        </button>
      ))}
    </div>
  );
}
