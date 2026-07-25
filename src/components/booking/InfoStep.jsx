import { useState } from 'react';

export default function InfoStep({ value, onChange }) {
  const [touched, setTouched] = useState(false);
  const nameErr = touched && !value.name.trim();
  const phoneErr = touched && !value.phone.trim();

  function set(field, v) {
    onChange(Object.assign({}, value, { [field]: v }));
  }

  return (
    <>
      <div className="field">
        <label htmlFor="cname">Ad Soyad *</label>
        <input id="cname" value={value.name} onChange={function (e) { set('name', e.target.value); }} onBlur={function () { setTouched(true); }} placeholder="Adınız Soyadınız" />
        {nameErr && <span className="err-banner">Ad soyad gerekli</span>}
      </div>
      <div className="field">
        <label htmlFor="cphone">Telefon *</label>
        <input id="cphone" value={value.phone} onChange={function (e) { set('phone', e.target.value); }} onBlur={function () { setTouched(true); }} placeholder="05xx xxx xx xx" inputMode="tel" />
        {phoneErr && <span className="err-banner">Telefon numarası gerekli</span>}
      </div>
      <div className="field">
        <label htmlFor="cemail">E-posta (opsiyonel)</label>
        <input id="cemail" type="email" value={value.email} onChange={function (e) { set('email', e.target.value); }} placeholder="ornek@eposta.com" />
      </div>
      <div className="field">
        <label htmlFor="cnotes">Not (opsiyonel)</label>
        <textarea id="cnotes" value={value.notes} onChange={function (e) { set('notes', e.target.value); }} placeholder="Eklemek istediğiniz bir not var mı?" />
      </div>
    </>
  );
}
