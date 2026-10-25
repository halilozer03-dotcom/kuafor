import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { bookAppointment } from '../lib/api';
import { fmtDateLong, fmtTime } from '../lib/time';
import { useSalon } from '../context/SalonContext';
import SiteHeader from '../components/booking/SiteHeader';
import LockedNotice from '../components/LockedNotice';
import ServiceStep from '../components/booking/ServiceStep';
import StaffStep from '../components/booking/StaffStep';
import DateTimeStep from '../components/booking/DateTimeStep';
import InfoStep from '../components/booking/InfoStep';
import SummaryCard from '../components/booking/SummaryCard';

export default function Booking() {
  const { settings, t, locked } = useSalon();
  const [step, setStep] = useState(0);
  const [service, setService] = useState(null);
  const [staffId, setStaffId] = useState(undefined);
  const [date, setDate] = useState(new Date());
  const [slot, setSlot] = useState(null);
  const [customer, setCustomer] = useState({ name: '', phone: '', email: '', notes: '' });
  const [submitting, setSubmitting] = useState(false);
  const [submitErr, setSubmitErr] = useState(null);
  const [result, setResult] = useState(null);
  const navigate = useNavigate();

  if (result) {
    return <SuccessScreen service={service} staffName={slot.staff_name} date={date} time={slot.slot_time} />;
  }

  if (locked) {
    return (
      <div className="app">
        <SiteHeader showBookButton={false} />
        <div className="section"><LockedNotice /></div>
      </div>
    );
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
    <div className="app has-cta-bar">
      <SiteHeader showBookButton={false} />

      <div className="stepper">
        {[0, 1, 2, 3].map(function (i) {
          return <div key={i} className={'step-dot' + (i < step ? ' done' : i === step ? ' active' : '')} />;
        })}
      </div>

      <div className="step-head">
        <h2>{t('step' + (step + 1) + '.title')}</h2>
        <p>{t('step' + (step + 1) + '.hint')}</p>
      </div>

      <div className="step-body">
        {step === 0 && (
          <ServiceStep
            selected={service}
            onSelect={function (s) {
              setService(s);
              setStaffId(undefined);
              setSlot(null);
            }}
          />
        )}

        {step === 1 && service && (
          <StaffStep
            serviceId={service.id}
            selectedId={staffId}
            // Personel adı ayrı bir state'te tutulmuyordu-tutuluyordu ama hiç
            // okunmuyordu: özet ve onay ekranı adı seçilen slot'tan alıyor
            // (slot.staff_name), çünkü "Farketmez" seçiminde ad ancak saat
            // seçilince belli oluyor.
            onSelect={function (id) {
              setStaffId(id);
              setSlot(null);
            }}
            onAutoSkip={function (s) {
              setStaffId(s.id);
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
          <button className="btn btn-ghost" onClick={handleBack} disabled={submitting}>{t('common.back')}</button>
          <button className="btn btn-accent btn-block" onClick={handleNext} disabled={!canNext || submitting}>
            {submitting ? t('book.submitting') : step === 3 ? t('book.submit') : t('common.continue')}
          </button>
        </div>
      </div>
    </div>
  );
}

function SuccessScreen({ service, staffName, date, time }) {
  const { t, loc, locale } = useSalon();

  return (
    <div className="confirm-screen">
      <div className="confirm-icon">✓</div>
      <h1>{t('confirm.title')}</h1>
      <p className="muted">{t('confirm.sub')}</p>
      <div className="confirm-card">
        <div className="summary-row"><span>{t('summary.service')}</span><strong>{loc(service, 'name')}</strong></div>
        {staffName && <div className="summary-row"><span>{t('summary.staff')}</span><span>{staffName}</span></div>}
        <div className="summary-row"><span>{t('summary.date')}</span><span>{fmtDateLong(date, locale)}</span></div>
        <div className="summary-row"><span>{t('summary.time')}</span><span>{fmtTime(time)}</span></div>
      </div>
      <Link to="/" className="btn btn-primary">{t('nav.home')}</Link>
    </div>
  );
}
