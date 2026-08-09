import { useSalon } from '../context/SalonContext';

// Abonelik kapalıyken müşteriye gösterilen ekran. Bilerek sakin: müşterinin
// hatası değil ve yapabileceği bir şey yok — telefonla ulaşabilsin yeter.
// Asıl engel sunucuda (salon_get_available_slots / salon_book_appointment);
// bu ekran yalnızca boş bir takvim yerine açıklama gösterir.
export default function LockedNotice() {
  const { t, settings } = useSalon();
  const phone = settings && settings.phone;

  return (
    <div className="locked-notice">
      <div className="locked-icon">⏸</div>
      <h2>{t('lock.title')}</h2>
      <p className="muted">{t('lock.body')}</p>
      {phone && <a className="btn btn-primary" href={'tel:' + phone.replace(/\s/g, '')}>{phone}</a>}
    </div>
  );
}
