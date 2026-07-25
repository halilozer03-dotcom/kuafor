import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { bookAppointment, fetchSettings } from '../lib/api';
import { fmtDateLong, fmtTime } from '../lib/time';
import SiteHeader from '../components/booking/SiteHeader';
import ServiceStep from '../components/booking/ServiceStep';
import StaffStep from '../components/booking/StaffStep';
import DateTimeStep from '../components/booking/DateTimeStep';
import InfoStep from '../components/booking/InfoStep';
import SummaryCard from '../components/booking/SummaryCard';

const STEP_TITLES = [
  { title: 'Hizmet seçin', hint: 'Almak istediğiniz hizmeti seçerek başlayın.' },
  { title: 'Personel seçin', hint: 'Bu hizmeti verebilecek personeli seçin.' },
  { title: 'Tarih ve saat seçin', hint: 'Size uygun günü ve saati seçin.' },
  { title: 'Bilgilerinizi girin', hint: 'Randevunuzu onaylamak için iletişim bilgilerinizi girin.' },
];

export default function Booking() {
  const [settings, setSettings] = useState(null);
  const [step, setStep] = useState(0);
  const [service, setService] = useState(null);
  const [staffId, setStaffId] = useState(undefined);
  const [staffName, setStaffName] = useState(null);
  const [date, setDate] = useState(new Date());
  const [slot, setSlot] = useState(null);
  const [customer, setCustomer] = useState({ name: '', phone: '', email: '', notes: '' });
  const [submitting, setSubmitting] = useState(false);
  const [submitErr, setSubmitErr] = useState(null);
  const [result, setResult] = useState(null);
  const navigate = useNavigate();

  useEffect(function () {
    fetchSettings().then(setSettings).catch(function () {});
  }, []);

  if (result) {
    return <SuccessScreen service={service} staffName={slot.staff_name} date={date} time={slot.slot_time} />;
  }

  const canNext =
    (step === 0 && Boolean(service)) ||
    (step === 1 && staffId !== undefined) ||
    (step === 2 && Boolean(slot)) ||
    (step === 3 && customer.name.trim() && customer.phone.trim());

  async function handleNext() {
    if (step === 3) {
      setSubmitting(true);
      setSubmitErr(null);
      try {
        const appt = await bookAppointment({
          serviceId: service.id,
          staffId: slot.staff_id,
          date,
          startTime: slot.slot_time,
          name: customer.name,
          phone: customer.phone,
          email: customer.email,
          notes: customer.notes,
        });
        setResult(appt);
      } catch (e) {
        setSubmitErr(e.message || String(e));
      } finally {
        setSubmitting(false);
      }
      return;
    }
    setStep(step + 1);
  }

  function handleBack() {
    if (step === 0) {
      navigate('/');
      return;
    }
    setStep(step - 1);
  }

  return (
    <div className="app wizard">
      <SiteHeader name={settings ? settings.name : ''} />

      <div className="stepper">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className={'step-dot' + (i < step ? ' done' : i === step ? ' active' : '')} />
        ))}
      </div>

      <div className="step-head">
        <h2>{STEP_TITLES[step].title}</h2>
        <p>{STEP_TITLES[step].hint}</p>
      </div>

      <div className="step-body">
        {step === 0 && (
          <ServiceStep
            selected={service}
            onSelect={function (s) {
              setService(s);
              setStaffId(undefined);
              setStaffName(null);
              setSlot(null);
            }}
          />
        )}

        {step === 1 && service && (
          <StaffStep
            serviceId={service.id}
            selectedId={staffId}
            onSelect={function (id, name) {
              setStaffId(id);
              setStaffName(name || null);
              setSlot(null);
            }}
            onAutoSkip={function (s) {
              setStaffId(s.id);
              setStaffName(s.full_name);
              setStep(2);
            }}
          />
        )}

        {step === 2 && service && (
          <DateTimeStep
            serviceId={service.id}
            staffId={staffId === undefined ? null : staffId}
            horizonDays={settings ? settings.booking_horizon_days : 21}
            selectedDate={date}
            selectedSlot={slot}
            onPickDate={function (d) { setDate(d); setSlot(null); }}
            onPickSlot={setSlot}
          />
        )}

        {step === 3 && service && slot && (
          <>
            <SummaryCard service={service} staffName={slot.staff_name} date={date} time={slot.slot_time} />
            <InfoStep value={customer} onChange={setCustomer} />
            {submitErr && <div className="err-banner">{submitErr}</div>}
          </>
        )}
      </div>

      <div className="wizard-foot">
        <div className="wizard-foot-inner">
          <button className="btn btn-ghost" onClick={handleBack} disabled={submitting}>Geri</button>
          <button className="btn btn-accent btn-block" onClick={handleNext} disabled={!canNext || submitting}>
            {submitting ? 'Gönderiliyor...' : step === 3 ? 'Randevuyu Onayla' : 'Devam Et'}
          </button>
        </div>
      </div>
    </div>
  );
}

function SuccessScreen({ service, staffName, date, time }) {
  return (
    <div className="confirm-screen">
      <div className="confirm-icon">✓</div>
      <h1>Randevunuz alındı!</h1>
      <p className="muted">Randevu detaylarınız aşağıdadır. Sizi salonumuzda görmekten mutluluk duyarız.</p>
      <div className="confirm-card">
        <div className="summary-row"><span>Hizmet</span><strong>{service.name}</strong></div>
        {staffName && <div className="summary-row"><span>Personel</span><span>{staffName}</span></div>}
        <div className="summary-row"><span>Tarih</span><span>{fmtDateLong(date)}</span></div>
        <div className="summary-row"><span>Saat</span><span>{fmtTime(time)}</span></div>
      </div>
      <Link to="/" className="btn btn-primary">Ana Sayfaya Dön</Link>
    </div>
  );
}
