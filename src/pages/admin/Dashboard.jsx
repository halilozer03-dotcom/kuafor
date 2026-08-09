import { useEffect, useState } from 'react';
import { fetchAppointments, updateAppointmentStatus } from '../../lib/api';
import { fmtPrice } from '../../lib/money';
import { fmtDateLong, fmtTime, nextDays, toISODate } from '../../lib/time';
import AppointmentRow from '../../components/admin/AppointmentRow';
import { useSalon } from '../../context/SalonContext';

export default function Dashboard() {
  const { adminLocale, currency } = useSalon();
  const [today, setToday] = useState(null);
  const [weekCount, setWeekCount] = useState(null);
  const [err, setErr] = useState(null);

  const todayDate = new Date();
  const todayISO = toISODate(todayDate);
  const weekEndISO = toISODate(nextDays(7, todayDate)[6]);

  function reload() {
    fetchAppointments({ from: todayISO, to: todayISO })
      .then(setToday)
      .catch(function (e) { setErr(e.message || String(e)); });
    fetchAppointments({ from: todayISO, to: weekEndISO })
      .then(function (rows) { setWeekCount(rows.filter(function (r) { return r.status !== 'cancelled'; }).length); })
      .catch(function () {});
  }

  useEffect(reload, []);

  async function handleStatus(id, status) {
    await updateAppointmentStatus(id, status);
    reload();
  }

  const activeToday = today ? today.filter(function (r) { return r.status !== 'cancelled'; }) : [];
  const revenueToday = activeToday.reduce(function (s, r) { return s + (r.salon_services ? r.salon_services.price_cents : 0); }, 0);

  return (
    <div>
      <div className="admin-header">
        <h1>Panel</h1>
        <span className="muted">{fmtDateLong(todayDate, adminLocale)}</span>
      </div>

      <div className="stat-grid">
        <div className="stat-card"><div className="num">{activeToday.length}</div><div className="lbl">Bugünkü randevu</div></div>
        <div className="stat-card"><div className="num">{weekCount === null ? '—' : weekCount}</div><div className="lbl">Bu hafta</div></div>
        <div className="stat-card"><div className="num">{fmtPrice(revenueToday, adminLocale, currency)}</div><div className="lbl">Bugünkü tahmini ciro</div></div>
      </div>

      <h2 className="section-title" style={{ fontSize: '1.1rem', marginBottom: 12 }}>Bugünkü Randevular</h2>
      {err && <div className="err-banner">{err}</div>}
      {!today && !err && <p className="muted">Yükleniyor...</p>}
      {today && activeToday.length === 0 && <div className="list-empty">Bugün için randevu yok.</div>}
      {activeToday.map(function (a) {
        return <AppointmentRow key={a.id} appt={a} onStatus={handleStatus} />;
      })}
    </div>
  );
}
