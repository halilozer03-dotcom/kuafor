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
        <h1>Rendez-vous</h1>
      </div>

      <div className="toolbar">
        <input className="input" type="date" value={date} onChange={function (e) { setDate(e.target.value); }} />
        <select className="select" value={staffId} onChange={function (e) { setStaffId(e.target.value); }}>
          <option value="">Tout le personnel</option>
          {staff.map(function (s) { return <option key={s.id} value={s.id}>{s.full_name}</option>; })}
        </select>
        <select className="select" value={status} onChange={function (e) { setStatus(e.target.value); }}>
          <option value="">Tous les statuts</option>
          <option value="confirmed">Confirmé</option>
          <option value="completed">Terminé</option>
          <option value="cancelled">Annulé</option>
          <option value="no_show">Absent</option>
        </select>
      </div>

      {err && <div className="err-banner">{err}</div>}
      {!rows && !err && <p className="muted">Chargement...</p>}
      {rows && rows.length === 0 && <div className="list-empty">Aucun rendez-vous ne correspond à ces filtres.</div>}
      {rows && rows.map(function (a) {
        return <AppointmentRow key={a.id} appt={a} onStatus={handleStatus} />;
      })}
    </div>
  );
}
