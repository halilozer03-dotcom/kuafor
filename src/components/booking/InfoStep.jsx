import { useState } from 'react';
import { useSalon } from '../../context/SalonContext';

export default function InfoStep({ value, onChange }) {
  const { t } = useSalon();
  // Dokunulma bilgisi alan BAŞINA tutulur: tek ortak bayrak varken ad alanından
  // çıkmak, kullanıcının daha görmediği telefon alanının altına da hata
  // basıyordu — form daha doldurulmadan hatalı görünüyordu.
  const [touched, setTouched] = useState({});
  const nameErr = touched.name && !value.name.trim();
  const phoneErr = touched.phone && !value.phone.trim();

  function set(field, v) {
    onChange(Object.assign({}, value, { [field]: v }));
  }

  function touch(field) {
    setTouched(function (prev) { return Object.assign({}, prev, { [field]: true }); });
  }

  return (
    <>
      <div className="field">
        <label htmlFor="cname">{t('info.name')}</label>
        <input
          id="cname"
          value={value.name}
          onChange={function (e) { set('name', e.target.value); }}
          onBlur={function () { touch('name'); }}
          placeholder={t('info.namePh')}
          autoComplete="name"
          required
          aria-invalid={nameErr ? 'true' : undefined}
          aria-describedby={nameErr ? 'cname-err' : undefined}
        />
        {nameErr && <span className="field-error" id="cname-err">{t('info.nameErr')}</span>}
      </div>
      <div className="field">
        <label htmlFor="cphone">{t('info.phone')}</label>
        <input
          id="cphone"
          value={value.phone}
          onChange={function (e) { set('phone', e.target.value); }}
          onBlur={function () { touch('phone'); }}
          placeholder={t('info.phonePh')}
          inputMode="tel"
          autoComplete="tel"
          required
          aria-invalid={phoneErr ? 'true' : undefined}
          aria-describedby={phoneErr ? 'cphone-err' : undefined}
        />
        {phoneErr && <span className="field-error" id="cphone-err">{t('info.phoneErr')}</span>}
      </div>
      <div className="field">
        <label htmlFor="cemail">{t('info.email')}</label>
        <input id="cemail" type="email" value={value.email} onChange={function (e) { set('email', e.target.value); }} placeholder={t('info.emailPh')} autoComplete="email" />
      </div>
      <div className="field">
        <label htmlFor="cnotes">{t('info.notes')}</label>
        <textarea id="cnotes" value={value.notes} onChange={function (e) { set('notes', e.target.value); }} placeholder={t('info.notesPh')} />
      </div>
    </>
  );
}
