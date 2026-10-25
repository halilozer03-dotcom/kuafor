import { useEffect, useState } from 'react';
import { fetchSlots } from '../../lib/api';
import { fmtDateLong, fmtDayChip, fmtTime, isSameDate, nextDays } from '../../lib/time';
import { useSalon } from '../../context/SalonContext';

export default function DateTimeStep({ serviceId, staffId, horizonDays, selectedDate, selectedSlot, onPickDate, onPickSlot }) {
  const { t, locale } = useSalon();
  const days = nextDays(horizonDays || 21);
  const [slots, setSlots] = useState(null);
  const [err, setErr] = useState(null);

  useEffect(function () {
    setSlots(null);
    setErr(null);
    fetchSlots(serviceId, selectedDate, staffId)
      .then(setSlots)
      .catch(function (e) { setErr(e.message || String(e)); });
  }, [serviceId, staffId, selectedDate]);

  const showStaffName = staffId === null;

  return (
    <>
      <div className="day-scroll">
        {days.map(function (d) {
          const chip = fmtDayChip(d, locale);
          const on = isSameDate(d, selectedDate);
          return (
            <button
              key={d.toISOString()}
              type="button"
              className={'day-chip' + (on ? ' on' : '')}
              aria-pressed={on}
              aria-label={fmtDateLong(d, locale)}
              onClick={function () { onPickDate(d); }}
            >
              <span aria-hidden="true">{chip.weekday}</span>
              <span className="num" aria-hidden="true">{chip.day}</span>
            </button>
          );
        })}
      </div>

      {err && <div className="err-banner">{err}</div>}
      {!err && !slots && <p className="muted">{t('slots.loading')}</p>}
      {slots && slots.length === 0 && <div className="slot-empty">{t('slots.empty')}</div>}
      {slots && slots.length > 0 && (
        <div className="slot-grid">
          {slots.map(function (s) {
            const on = selectedSlot && selectedSlot.slot_time === s.slot_time && selectedSlot.staff_id === s.staff_id;
            return (
              <button
                key={s.staff_id + s.slot_time}
                type="button"
                className={'slot-btn' + (on ? ' on' : '')}
                aria-pressed={Boolean(on)}
                onClick={function () { onPickSlot(s); }}
              >
                {fmtTime(s.slot_time)}
                {showStaffName && <div style={{ fontSize: '.7rem', fontWeight: 500, opacity: .75 }}>{s.staff_name}</div>}
              </button>
            );
          })}
        </div>
      )}
    </>
  );
}
