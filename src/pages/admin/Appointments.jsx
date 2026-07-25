import { useEffect, useState } from 'react';
import { fetchAllStaff, fetchAppointments, updateAppointmentStatus } from '../../lib/api';
import { toISODate } from '../../lib/time';
import AppointmentRow from '../../components/admin/AppointmentRow';

export default function Appointments() {
  const [date, setDate] = useState(toISODate(new Date()));
  const [staffId, setStaffId] = useState('');
  const [status, setStatus] = useState('');
  const [staff, setStaff] = useState([]);
  const [rows, setRows] = useState(null);
  const [err, setErr] = useState(null);

  useEffect(function () {
    fetchAllStaff().then(setStaff).catch(function () {});
  }, []);

  function reload() {
    setRows(null);
    fetchAppointments({ from: date, to: date, staffId: staffId || undefined, status: status || undefined })
      .then(setRows)
      .catch(function (e) { setErr(e.message || String(e)); });
  }

  useEffect(reload, [date, staffId, status]);

  async function handleStatus(id, st) {
    await updateAppointmentStatus(id, st);
    reload();
  }

  return (
    <div>
      <div className="admin-header">
        <h1>Randevular</h1>
      </div>

      <div className="toolbar">
        <input className="input" type="date" value={date} onChange={function (e) { setDate(e.target.value); }} />
        <select className="select" value={staffId} onChange={function (e) { setStaffId(e.target.value); }}>
          <option value="">Tüm personel</option>
          {staff.map(function (s) { return <option key={s.id} value={s.id}>{s.full_name}</option>; })}
        </select>
        <select className="select" value={status} onChange={function (e) { setStatus(e.target.value); }}>
          <option value="">Tüm durumlar</option>
          <option value="confirmed">Onaylı</option>
          <option value="completed">Tamamlandı</option>
          <option value="cancelled">İptal</option>
          <option value="no_show">Gelmedi</option>
        </select>
      </div>

      {err && <div className="err-banner">{err}</div>}
      {!rows && !err && <p className="muted">Yükleniyor...</p>}
      {rows && rows.length === 0 && <div className="list-empty">Bu filtrelerle eşleşen randevu yok.</div>}
      {rows && rows.map(function (a) {
        return <AppointmentRow key={a.id} appt={a} onStatus={handleStatus} />;
      })}
    </div>
  );
}
