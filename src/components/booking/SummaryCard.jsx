import { fmtPrice } from '../../lib/money';
import { durationLabel, fmtDateLong, fmtTime } from '../../lib/time';

export default function SummaryCard({ service, staffName, date, time }) {
  return (
    <div className="summary-card">
      <div className="summary-row"><span>Hizmet</span><strong>{service.name}</strong></div>
      <div className="summary-row"><span>Süre</span><span>{durationLabel(service.duration_minutes)}</span></div>
      {staffName && <div className="summary-row"><span>Personel</span><span>{staffName}</span></div>}
      <div className="summary-row"><span>Tarih</span><span>{fmtDateLong(date)}</span></div>
      <div className="summary-row"><span>Saat</span><span>{fmtTime(time)}</span></div>
      <div className="summary-row summary-total"><span>Toplam</span><span>{fmtPrice(service.price_cents)}</span></div>
    </div>
  );
}
