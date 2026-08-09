import { fmtPrice } from '../../lib/money';
import { durationLabel, fmtDateLong, fmtTime } from '../../lib/time';
import { useSalon } from '../../context/SalonContext';

export default function SummaryCard({ service, staffName, date, time }) {
  const { t, loc, locale, currency } = useSalon();

  return (
    <div className="summary-card">
      <div className="summary-row"><span>{t('summary.service')}</span><strong>{loc(service, 'name')}</strong></div>
      <div className="summary-row"><span>{t('summary.duration')}</span><span>{durationLabel(service.duration_minutes, t)}</span></div>
      {staffName && <div className="summary-row"><span>{t('summary.staff')}</span><span>{staffName}</span></div>}
      <div className="summary-row"><span>{t('summary.date')}</span><span>{fmtDateLong(date, locale)}</span></div>
      <div className="summary-row"><span>{t('summary.time')}</span><span>{fmtTime(time)}</span></div>
      <div className="summary-row summary-total"><span>{t('summary.total')}</span><span>{fmtPrice(service.price_cents, locale, currency)}</span></div>
    </div>
  );
}
