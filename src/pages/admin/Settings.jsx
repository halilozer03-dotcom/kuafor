import { useEffect, useState } from 'react';
import { fetchSettings, updateSettings } from '../../lib/api';

export default function Settings() {
  const [form, setForm] = useState(null);
  const [err, setErr] = useState(null);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(function () {
    fetchSettings().then(setForm).catch(function (e) { setErr(e.message || String(e)); });
  }, []);

  function set(field, v) {
    setForm(Object.assign({}, form, { [field]: v }));
    setSaved(false);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      await updateSettings({
        name: form.name,
        slogan: form.slogan,
        description: form.description,
        address: form.address,
        phone: form.phone,
        email: form.email,
        instagram: form.instagram,
        opening_hours_note: form.opening_hours_note,
        slot_interval_minutes: Number(form.slot_interval_minutes),
        booking_lead_minutes: Number(form.booking_lead_minutes),
        booking_horizon_days: Number(form.booking_horizon_days),
      });
      setSaved(true);
    } catch (e2) {
      setErr(e2.message || String(e2));
    } finally {
      setBusy(false);
    }
  }

  if (err && !form) return <div className="err-banner">{err}</div>;
  if (!form) return <p className="muted">Yükleniyor...</p>;

  return (
    <div>
      <div className="admin-header"><h1>Ayarlar</h1></div>

      <form className="card" style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 560 }} onSubmit={handleSubmit}>
        <div className="field">
          <label>Salon Adı</label>
          <input value={form.name || ''} onChange={function (e) { set('name', e.target.value); }} />
        </div>
        <div className="field">
          <label>Slogan</label>
          <input value={form.slogan || ''} onChange={function (e) { set('slogan', e.target.value); }} />
        </div>
        <div className="field">
          <label>Açıklama</label>
          <textarea value={form.description || ''} onChange={function (e) { set('description', e.target.value); }} />
        </div>
        <div className="form-grid">
          <div className="field">
            <label>Adres</label>
            <input value={form.address || ''} onChange={function (e) { set('address', e.target.value); }} />
          </div>
          <div className="field">
            <label>Telefon</label>
            <input value={form.phone || ''} onChange={function (e) { set('phone', e.target.value); }} />
          </div>
          <div className="field">
            <label>E-posta</label>
            <input value={form.email || ''} onChange={function (e) { set('email', e.target.value); }} />
          </div>
          <div className="field">
            <label>Instagram</label>
            <input value={form.instagram || ''} onChange={function (e) { set('instagram', e.target.value); }} />
          </div>
          <div className="field full">
            <label>Çalışma Saatleri Notu</label>
            <input value={form.opening_hours_note || ''} onChange={function (e) { set('opening_hours_note', e.target.value); }} placeholder="Örn: Pazartesi - Cumartesi 09:00 - 19:00" />
          </div>
        </div>

        <div className="form-grid">
          <div className="field">
            <label>Randevu Aralığı (dk)</label>
            <input type="number" min="5" step="5" value={form.slot_interval_minutes} onChange={function (e) { set('slot_interval_minutes', e.target.value); }} />
          </div>
          <div className="field">
            <label>Min. Önceden Rezervasyon (dk)</label>
            <input type="number" min="0" step="5" value={form.booking_lead_minutes} onChange={function (e) { set('booking_lead_minutes', e.target.value); }} />
          </div>
          <div className="field">
            <label>Kaç Gün İleriye Randevu Alınabilir</label>
            <input type="number" min="1" value={form.booking_horizon_days} onChange={function (e) { set('booking_horizon_days', e.target.value); }} />
          </div>
        </div>

        {err && <div className="err-banner">{err}</div>}
        {saved && <div style={{ color: 'var(--ok)', fontWeight: 600, fontSize: '.9rem' }}>Kaydedildi.</div>}
        <button className="btn btn-primary" type="submit" disabled={busy}>{busy ? 'Kaydediliyor...' : 'Kaydet'}</button>
      </form>
    </div>
  );
}
