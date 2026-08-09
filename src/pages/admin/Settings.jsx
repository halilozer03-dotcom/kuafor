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
      // subscription_active BİLEREK gönderilmiyor: hosting/lisans kilidi salonun
      // kendi kontrolünde olmamalı. Veritabanında da trigger ile engelli.
      await updateSettings({
        name: form.name,
        slogan: form.slogan,
        slogan_tr: form.slogan_tr,
        description: form.description,
        description_tr: form.description_tr,
        address: form.address,
        phone: form.phone,
        email: form.email,
        instagram: form.instagram,
        opening_hours_note: form.opening_hours_note,
        opening_hours_note_tr: form.opening_hours_note_tr,
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

      <form className="card" style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 640 }} onSubmit={handleSubmit}>
        <p className="muted" style={{ fontSize: '.85rem', margin: 0 }}>
          Fransızca alanlar müşterinin gördüğü metindir. Türkçe alanlar sitede dil TR seçildiğinde gösterilir.
        </p>

        <div className="field">
          <label>Salon Adı</label>
          <input value={form.name || ''} onChange={function (e) { set('name', e.target.value); }} />
        </div>

        <div className="form-grid">
          <div className="field">
            <label>Slogan — Fransızca</label>
            <input value={form.slogan || ''} onChange={function (e) { set('slogan', e.target.value); }} placeholder="Avec ou sans rendez-vous" />
          </div>
          <div className="field">
            <label>Slogan — Türkçe</label>
            <input value={form.slogan_tr || ''} onChange={function (e) { set('slogan_tr', e.target.value); }} placeholder="Randevulu veya randevusuz" />
          </div>
          <div className="field full">
            <label>Açıklama — Fransızca</label>
            <textarea value={form.description || ''} onChange={function (e) { set('description', e.target.value); }} />
          </div>
          <div className="field full">
            <label>Açıklama — Türkçe</label>
            <textarea value={form.description_tr || ''} onChange={function (e) { set('description_tr', e.target.value); }} />
          </div>
        </div>

        <div className="form-grid">
          <div className="field">
            <label>Adres</label>
            <input value={form.address || ''} onChange={function (e) { set('address', e.target.value); }} />
          </div>
          <div className="field">
            <label>Telefon</label>
            <input value={form.phone || ''} onChange={function (e) { set('phone', e.target.value); }} placeholder="07 58 37 79 86" />
          </div>
          <div className="field">
            <label>E-posta</label>
            <input value={form.email || ''} onChange={function (e) { set('email', e.target.value); }} />
          </div>
          <div className="field">
            <label>Instagram</label>
            <input value={form.instagram || ''} onChange={function (e) { set('instagram', e.target.value); }} />
          </div>
          <div className="field">
            <label>Çalışma Saatleri Notu — Fransızca</label>
            <input value={form.opening_hours_note || ''} onChange={function (e) { set('opening_hours_note', e.target.value); }} placeholder="Lundi - Samedi 09:00 - 19:00" />
          </div>
          <div className="field">
            <label>Çalışma Saatleri Notu — Türkçe</label>
            <input value={form.opening_hours_note_tr || ''} onChange={function (e) { set('opening_hours_note_tr', e.target.value); }} placeholder="Pazartesi - Cumartesi 09:00 - 19:00" />
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

      <div className="card" style={{ maxWidth: 640, marginTop: 16 }}>
        <h2 className="section-title" style={{ fontSize: '1rem', marginTop: 0 }}>Sistem</h2>
        <div className="summary-row"><span>Saat dilimi</span><span>{form.timezone || '—'}</span></div>
        <div className="summary-row"><span>Para birimi</span><span>{form.currency || '—'}</span></div>
        <div className="summary-row">
          <span>Online randevu</span>
          <span>{form.subscription_active === false ? 'Kapalı' : 'Açık'}</span>
        </div>
        <p className="muted" style={{ fontSize: '.8rem', marginBottom: 0 }}>
          Bu üç değer panelden değiştirilemez; sistem sağlayıcısı tarafından ayarlanır.
        </p>
      </div>
    </div>
  );
}
