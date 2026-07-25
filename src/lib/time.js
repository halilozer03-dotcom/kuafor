export const WEEKDAY_NAMES = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
export const MONTH_NAMES = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık',
];

export function toISODate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function nextDays(count, from = new Date()) {
  const start = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  const days = [];
  for (let i = 0; i < count; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    days.push(d);
  }
  return days;
}

export function fmtDayChip(date) {
  return { weekday: WEEKDAY_NAMES[date.getDay()].slice(0, 3), day: date.getDate() };
}

export function fmtDateLong(date) {
  return `${date.getDate()} ${MONTH_NAMES[date.getMonth()]} ${WEEKDAY_NAMES[date.getDay()]}`;
}

export function fmtTime(timeStr) {
  return (timeStr || '').slice(0, 5);
}

export function durationLabel(minutes) {
  if (minutes < 60) return `${minutes} dk`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h} sa ${m} dk` : `${h} sa`;
}

export function isSameDate(a, b) {
  return toISODate(a) === toISODate(b);
}
