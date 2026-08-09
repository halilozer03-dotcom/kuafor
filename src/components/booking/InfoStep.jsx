import { useState } from 'react';
import { useSalon } from '../../context/SalonContext';

export default function InfoStep({ value, onChange }) {
  const { t } = useSalon();
  const [touched, setTouched] = useState(false);
  const nameErr = touched && !value.name.trim();
  const phoneErr = touched && !value.phone.trim();

  function set(field, v) {
    onChange(Object.assign({}, value, { [field]: v }));
  }

  return (
    <>
      <div className="field">
        <label htmlFor="cname">{t('info.name')}</label>
        <input id="cname" value={value.name} onChange={function (e) { set('name', e.target.value); }} onBlur={function () { setTouched(true); }} placeholder={t('info.namePh')} autoComplete="name" />
        {nameErr && <span className="err-banner">{t('info.nameErr')}</span>}
      </div>
      <div className="field">
        <label htmlFor="cphone">{t('info.phone')}</label>
        <input id="cphone" value={value.phone} onChange={function (e) { set('phone', e.target.value); }} onBlur={function () { setTouched(true); }} placeholder={t('info.phonePh')} inputMode="tel" autoComplete="tel" />
        {phoneErr && <span className="err-banner">{t('info.phoneErr')}</span>}
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
