import { useEffect, useState } from 'react';
import { deleteService, fetchAllServices, upsertService } from '../../lib/api';
import { fmtPrice } from '../../lib/money';
import { durationLabel } from '../../lib/time';
import Modal from '../../components/admin/Modal';

const EMPTY = { name: '', description: '', category: '', duration_minutes: 30, price: '', active: true, sort_order: 0 };

export default function Services() {
  const [services, setServices] = useState(null);
  const [err, setErr] = useState(null);
  const [editing, setEditing] = useState(null);

  function reload() {
    fetchAllServices().then(setServices).catch(function (e) { setErr(e.message || String(e)); });
  }

  useEffect(reload, []);

  function openNew() { setEditing(Object.assign({}, EMPTY)); }
  function openEdit(s) {
    setEditing({
      id: s.id,
      name: s.name,
      description: s.description || '',
      category: s.category || '',
      duration_minutes: s.duration_minutes,
      price: (s.price_cents / 100).toString(),
      active: s.active,
      sort_order: s.sort_order,
    });
  }

  async function handleDelete(id) {
    if (!confirm('Bu hizmeti silmek istediğinize emin misiniz?')) return;
    await deleteService(id);
    reload();
  }

  async function handleSave(form) {
    await upsertService({
      id: form.id,
      name: form.name.trim(),
      description: form.description.trim() || null,
      category: form.category.trim() || null,
      duration_minutes: Number(form.duration_minutes),
      price_cents: Math.round(Number(form.price.replace(',', '.')) * 100),
      active: form.active,
      sort_order: Number(form.sort_order) || 0,
    });
    setEditing(null);
    reload();
  }

  return (
    <div>
      <div className="admin-header">
        <h1>Hizmetler</h1>
        <button className="btn btn-accent" onClick={openNew}>+ Yeni Hizmet</button>
      </div>

      {err && <div className="err-banner">{err}</div>}
      {!services && !err && <p className="muted">Yükleniyor...</p>}
      {services && services.length === 0 && <div className="list-empty">Henüz hizmet eklenmedi.</div>}
      {services && services.map(function (s) {
        return (
          <div key={s.id} className="entity-row">
            <div className="entity-main">
              <div>
                <div className="entity-title">{s.name}</div>
                <div className="entity-sub">{s.category ? s.category + ' · ' : ''}{durationLabel(s.duration_minutes)} · {fmtPrice(s.price_cents)}</div>
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
        <Modal title={editing.id ? 'Hizmeti Düzenle' : 'Yeni Hizmet'} onClose={function () { setEditing(null); }}>
          <ServiceForm value={editing} onSave={handleSave} onCancel={function () { setEditing(null); }} />
        </Modal>
      )}
    </div>
  );
}

function ServiceForm({ value, onSave, onCancel }) {
  const [form, setForm] = useState(value);
  const [busy, setBusy] = useState(false);

  function set(field, v) { setForm(Object.assign({}, form, { [field]: v })); }

  async function handleSubmit(e) {
    e.preventDefault();
    setBusy(true);
    try {
      await onSave(form);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="modal-form" onSubmit={handleSubmit}>
      <div className="field">
        <label>Hizmet Adı *</label>
        <input required value={form.name} onChange={function (e) { set('name', e.target.value); }} />
      </div>
      <div className="form-grid">
        <div className="field">
          <label>Kategori</label>
          <input value={form.category} onChange={function (e) { set('category', e.target.value); }} placeholder="Örn: Saç" />
        </div>
        <div className="field">
          <label>Süre (dk) *</label>
          <input required type="number" min="5" step="5" value={form.duration_minutes} onChange={function (e) { set('duration_minutes', e.target.value); }} />
        </div>
        <div className="field">
          <label>Fiyat (₺) *</label>
          <input required inputMode="decimal" value={form.price} onChange={function (e) { set('price', e.target.value); }} placeholder="450" />
        </div>
        <div className="field">
          <label>Sıra</label>
          <input type="number" value={form.sort_order} onChange={function (e) { set('sort_order', e.target.value); }} />
        </div>
        <div className="field full">
          <label>Açıklama</label>
          <textarea value={form.description} onChange={function (e) { set('description', e.target.value); }} />
        </div>
      </div>
      <label className="checkbox-row">
        <input type="checkbox" checked={form.active} onChange={function (e) { set('active', e.target.checked); }} />
        Müşterilere görünsün (aktif)
      </label>
      <div className="modal-actions">
        <button type="button" className="btn btn-ghost" onClick={onCancel}>Vazgeç</button>
        <button type="submit" className="btn btn-primary btn-block" disabled={busy}>{busy ? 'Kaydediliyor...' : 'Kaydet'}</button>
      </div>
    </form>
  );
}
