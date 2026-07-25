import { useEffect, useState } from 'react';
import {
  deleteStaff, fetchAllServices, fetchAllStaff, fetchStaffHours, fetchStaffServiceIds,
  setStaffHours, setStaffServices, upsertStaff,
} from '../../lib/api';
import Modal from '../../components/admin/Modal';
import HoursEditor from '../../components/admin/HoursEditor';

const EMPTY = { full_name: '', title: '', bio: '', active: true, sort_order: 0 };

export default function Staff() {
  const [staff, setStaff] = useState(null);
  const [services, setServices] = useState([]);
  const [err, setErr] = useState(null);
  const [editing, setEditing] = useState(null);

  function reload() {
    fetchAllStaff().then(setStaff).catch(function (e) { setErr(e.message || String(e)); });
  }

  useEffect(function () {
    reload();
    fetchAllServices().then(setServices).catch(function () {});
  }, []);

  function openNew() {
    setEditing({ base: Object.assign({}, EMPTY), serviceIds: [], hoursByDay: {} });
  }

  async function openEdit(s) {
    const [serviceIds, hours] = await Promise.all([fetchStaffServiceIds(s.id), fetchStaffHours(s.id)]);
    const hoursByDay = {};
    hours.forEach(function (h) {
      const list = hoursByDay[h.weekday] || [];
      list.push({ start: h.start_time.slice(0, 5), end: h.end_time.slice(0, 5) });
      hoursByDay[h.weekday] = list;
    });
    setEditing({
      base: { id: s.id, full_name: s.full_name, title: s.title || '', bio: s.bio || '', active: s.active, sort_order: s.sort_order },
      serviceIds,
      hoursByDay,
    });
  }

  async function handleDelete(id) {
    if (!confirm('Bu personeli silmek istediğinize emin misiniz? Geçmiş randevuları etkilemez.')) return;
    await deleteStaff(id);
    reload();
  }

  async function handleSave(state) {
    const saved = await upsertStaff(state.base);
    await setStaffServices(saved.id, state.serviceIds);
    const flatHours = [];
    Object.entries(state.hoursByDay).forEach(function ([weekday, ranges]) {
      ranges.forEach(function (r) {
        if (r.start && r.end && r.start < r.end) flatHours.push({ weekday: Number(weekday), start_time: r.start, end_time: r.end });
      });
    });
    await setStaffHours(saved.id, flatHours);
    setEditing(null);
    reload();
  }

  return (
    <div>
      <div className="admin-header">
        <h1>Personel</h1>
        <button className="btn btn-accent" onClick={openNew}>+ Yeni Personel</button>
      </div>

      {err && <div className="err-banner">{err}</div>}
      {!staff && !err && <p className="muted">Yükleniyor...</p>}
      {staff && staff.length === 0 && <div className="list-empty">Henüz personel eklenmedi.</div>}
      {staff && staff.map(function (s) {
        return (
          <div key={s.id} className="entity-row">
            <div className="entity-main">
              <span className="staff-avatar">{s.full_name.charAt(0).toUpperCase()}</span>
              <div>
                <div className="entity-title">{s.full_name}</div>
                <div className="entity-sub">{s.title || '—'}</div>
              </div>
            </div>
            <div className="entity-actions">
              <span className={'pill-toggle ' + (s.active ? 'active' : 'inactive')}>{s.active ? 'Aktif' : 'Pasif'}</span>
              <button className="btn btn-ghost btn-sm" onClick={function () { openEdit(s); }}>Düzenle</button>
              <button className="btn btn-danger btn-sm" onClick={function () { handleDelete(s.id); }}>Sil</button>
            </div>
          </div>
        );
      })}

      {editing && (
        <Modal title={editing.base.id ? 'Personeli Düzenle' : 'Yeni Personel'} onClose={function () { setEditing(null); }}>
          <StaffForm value={editing} services={services} onSave={handleSave} onCancel={function () { setEditing(null); }} />
        </Modal>
      )}
    </div>
  );
}

function StaffForm({ value, services, onSave, onCancel }) {
  const [base, setBase] = useState(value.base);
  const [serviceIds, setServiceIds] = useState(value.serviceIds);
  const [hoursByDay, setHoursByDay] = useState(value.hoursByDay);
  const [busy, setBusy] = useState(false);

  function set(field, v) { setBase(Object.assign({}, base, { [field]: v })); }
  function toggleService(id) {
    setServiceIds(serviceIds.includes(id) ? serviceIds.filter(function (x) { return x !== id; }) : serviceIds.concat([id]));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setBusy(true);
    try {
      await onSave({ base, serviceIds, hoursByDay });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="modal-form" onSubmit={handleSubmit}>
      <div className="form-grid">
        <div className="field">
          <label>Ad Soyad *</label>
          <input required value={base.full_name} onChange={function (e) { set('full_name', e.target.value); }} />
        </div>
        <div className="field">
          <label>Ünvan</label>
          <input value={base.title} onChange={function (e) { set('title', e.target.value); }} placeholder="Örn: Kuaför" />
        </div>
        <div className="field full">
          <label>Biyografi</label>
          <textarea value={base.bio} onChange={function (e) { set('bio', e.target.value); }} />
        </div>
      </div>
      <label className="checkbox-row">
        <input type="checkbox" checked={base.active} onChange={function (e) { set('active', e.target.checked); }} />
        Müşterilere görünsün (aktif)
      </label>

      <div>
        <label style={{ fontWeight: 600, fontSize: '.9rem' }}>Verebileceği Hizmetler</label>
        <div className="chips" style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
          {services.map(function (s) {
            return (
              <button
                type="button"
                key={s.id}
                className={'staff-card' + (serviceIds.includes(s.id) ? ' on' : '')}
                style={{ padding: '8px 12px', width: 'auto' }}
                onClick={function () { toggleService(s.id); }}
              >
                {s.name}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <label style={{ fontWeight: 600, fontSize: '.9rem' }}>Çalışma Saatleri</label>
        <div style={{ marginTop: 8 }}>
          <HoursEditor hoursByDay={hoursByDay} onChange={setHoursByDay} />
        </div>
      </div>

      <div className="modal-actions">
        <button type="button" className="btn btn-ghost" onClick={onCancel}>Vazgeç</button>
        <button type="submit" className="btn btn-primary btn-block" disabled={busy}>{busy ? 'Kaydediliyor...' : 'Kaydet'}</button>
      </div>
    </form>
  );
}
