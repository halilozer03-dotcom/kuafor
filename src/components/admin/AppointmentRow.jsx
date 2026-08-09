import { fmtPrice } from '../../lib/money';
import { fmtTime } from '../../lib/time';
import { useSalon } from '../../context/SalonContext';

const STATUS_LABEL = { confirmed: 'Confirmé', completed: 'Terminé', cancelled: 'Annulé', no_show: 'Absent' };

export default function AppointmentRow({ appt, onStatus }) {
  const { locAdmin, adminLocale, currency } = useSalon();
  const svc = appt.salon_services;
  const staff = appt.salon_staff;

  return (
    <div className="appt-row">
      <div className="appt-time">{fmtTime(appt.start_time)}</div>
      <div className="appt-info">
        <strong>{appt.customer_name}</strong>
        <span>
          {svc ? locAdmin(svc, 'name') : ''} {staff ? '· ' + staff.full_name : ''} {svc ? '· ' + fmtPrice(svc.price_cents, adminLocale, currency) : ''}
        </span>
        <span>{appt.customer_phone}{appt.notes ? ' · ' + appt.notes : ''}</span>
      </div>
      <span className={'badge ' + appt.status}>{STATUS_LABEL[appt.status] || appt.status}</span>
      {onStatus && appt.status === 'confirmed' && (
        <div className="appt-actions">
          <button className="btn btn-ghost btn-sm" onClick={function () { onStatus(appt.id, 'completed'); }}>Terminé</button>
          <button className="btn btn-ghost btn-sm" onClick={function () { onStatus(appt.id, 'no_show'); }}>Absent</button>
          <button className="btn btn-danger btn-sm" onClick={function () { onStatus(appt.id, 'cancelled'); }}>Annuler</button>
        </div>
      )}
    </div>
  );
}
