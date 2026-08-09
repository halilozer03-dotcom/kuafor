import { useEffect, useState } from 'react';
import {
  deleteStaff, fetchAllServices, fetchAllStaff, fetchStaffHours, fetchStaffServiceIds,
  setStaffBreak, setStaffHours, setStaffServices, upsertStaff,
} from '../../lib/api';
import { useSalon } from '../../context/SalonContext';
import Modal from '../../components/admin/Modal';
import HoursEditor from '../../components/admin/HoursEditor';

const EMPTY = { full_name: '', title: '', title_tr: '', bio: '', bio_tr: '', avatar_url: '', active: true, sort_order: 0 };

export default function Staff() {
  const { locAdmin } = useSalon();
  const [staff, setStaff] = useState(null);
  const [services, setServices] = useState([]);
  const [err, setErr] = useState(null);
  const [editing, setEditing] = useState(null);
  const [breakBusy, setBreakBusy] = useState(null);

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
      base: {
        id: s.id,
        full_name: s.full_name,
        title: s.title || '',
        title_tr: s.title_tr || '',
        bio: s.bio || '',
        bio_tr: s.bio_tr || '',
        avatar_url: s.avatar_url || '',
        active: s.active,
        sort_order: s.sort_order,
      },
      serviceIds,
      hoursByDay,
    });
  }

  async function handleDelete(id) {
    if (!confirm('Voulez-vous vraiment supprimer ce membre du personnel ? Les rendez-vous passés ne sont pas affectés.')) return;
    await deleteStaff(id);
    reload();
  }

  async function toggleBreak(s) {
    setBreakBusy(s.id);
    try {
      await setStaffBreak(s.id, !s.on_break);
      reload();
    } catch (e) {
      setErr(e.message || String(e));
    } finally {
      setBreakBusy(null);
    }
  }

  async function handleSave(state) {
    const base = Object.assign({}, state.base, {
      title: state.base.title.trim() || null,
      title_tr: state.base.title_tr.trim() || null,
      bio: state.base.bio.trim() || null,
      bio_tr: state.base.bio_tr.trim() || null,
      avatar_url: state.base.avatar_url.trim() || null,
    });
    const saved = await upsertStaff(base);
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
        <h1>Personnel</h1>
        <button className="btn btn-accent" onClick={openNew}>+ Nouveau membre</button>
      </div>

      <p className="muted" style={{ fontSize: '.85rem', marginTop: -4 }}>
        « En pause » ferme uniquement aujourd'hui — ça se rouvre automatiquement demain. Pour fermer définitivement, passez en « Inactif ».
      </p>

      {err && <div className="err-banner">{err}</div>}
      {!staff && !err && <p className="muted">Chargement...</p>}
      {staff && staff.length === 0 && <div className="list-empty">Aucun membre du personnel pour le moment.</div>}
      {staff && staff.map(function (s) {
        return (
          <div key={s.id} className="entity-row">
            <div className="entity-main">
              <span className="staff-avatar">
                {s.avatar_url ? <img src={s.avatar_url} alt="" /> : s.full_name.charAt(0).toUpperCase()}
              </span>
              <div>
                <div className="entity-title">{s.full_name}</div>
                <div className="entity-sub">{locAdmin(s, 'title') || '—'}</div>
              </div>
            </div>
            <div className="entity-actions">
              <button
                className={'pill-toggle pill-btn ' + (s.on_break ? 'onbreak' : 'working')}
                disabled={breakBusy === s.id}
                onClick={function () { toggleBreak(s); }}
                title="Fermer/rouvrir les rendez-vous pour aujourd'hui"
              >
                {s.on_break ? '⏸ En pause' : '● Disponible'}
              </button>
              <span className={'pill-toggle ' + (s.active ? 'active' : 'inactive')}>{s.active ? 'Actif' : 'Inactif'}</span>
              <button className="btn btn-ghost btn-sm" onClick={function () { openEdit(s); }}>Modifier</button>
              <button className="btn btn-danger btn-sm" onClick={function () { handleDelete(s.id); }}>Supprimer</button>
            </div>
          </div>
        );
      })}

      {editing && (
        <Modal title={editing.base.id ? 'Modifier le membre' : 'Nouveau membre'} onClose={function () { setEditing(null); }}>
          <StaffForm value={editing} services={services} onSave={handleSave} onCancel={function () { setEditing(null); }} />
        </Modal>
      )}
    </div>
  );
}

function StaffForm({ value, services, onSave, onCancel }) {
  const { locAdmin } = useSalon();
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
        <div className="field full">
          <label>Nom et prénom *</label>
          <input required value={base.full_name} onChange={function (e) { set('full_name', e.target.value); }} />
        </div>
        <div className="field full">
          <label>Photo — URL</label>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <span className="staff-avatar" style={{ flexShrink: 0 }}>
              {base.avatar_url ? <img src={base.avatar_url} alt="" /> : (base.full_name || '?').charAt(0).toUpperCase()}
            </span>
            <input
              style={{ flex: 1 }}
              value={base.avatar_url}
              onChange={function (e) { set('avatar_url', e.target.value); }}
              placeholder="https://…jpg"
            />
          </div>
        </div>
        <div className="field">
          <label>Titre</label>
          <input value={base.title} onChange={function (e) { set('title', e.target.value); }} placeholder="Barbier" />
        </div>
        <div className="field full">
          <label>Biographie</label>
          <textarea value={base.bio} onChange={function (e) { set('bio', e.target.value); }} />
        </div>
      </div>
      <label className="checkbox-row">
        <input type="checkbox" checked={base.active} onChange={function (e) { set('active', e.target.checked); }} />
        Visible pour les clients (actif)
      </label>

      <div>
        <label style={{ fontWeight: 600, fontSize: '.9rem' }}>Prestations proposées</label>
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
                {locAdmin(s, 'name')}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <label style={{ fontWeight: 600, fontSize: '.9rem' }}>Horaires</label>
        <div style={{ marginTop: 8 }}>
          <HoursEditor hoursByDay={hoursByDay} onChange={setHoursByDay} />
        </div>
      </div>

      <div className="modal-actions">
        <button type="button" className="btn btn-ghost" onClick={onCancel}>Annuler</button>
        <button type="submit" className="btn btn-primary btn-block" disabled={busy}>{busy ? 'Enregistrement...' : 'Enregistrer'}</button>
      </div>
    </form>
  );
}
