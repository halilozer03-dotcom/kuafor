// Tarih/saat biçimlendirmesi locale'e göre Intl ile yapılır; gün ve ay adları
// artık koda gömülü değil. toISODate bilerek yereldir: randevu tarihi bir takvim
// günüdür, UTC'ye çevrilirse gece yarısı civarında bir gün kayar.

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

// Gün adları, dizinin 0'ı PAZAR olacak şekilde — Postgres extract(dow from date)
// ve salon_staff_hours.weekday ile aynı konvansiyon. Bu sıra bozulursa çalışma
// saatleri yanlış güne yazılır.
export function weekdayNames(locale) {
  const sunday = new Date(2024, 0, 7); // 7 Ocak 2024 = Pazar
  const out = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(sunday);
    d.setDate(sunday.getDate() + i);
    const name = d.toLocaleDateString(locale || 'fr-FR', { weekday: 'long' });
    out.push(name.charAt(0).toLocaleUpperCase(locale || 'fr-FR') + name.slice(1));
  }
  return out;
}

export function fmtDayChip(date, locale) {
  const weekday = date.toLocaleDateString(locale || 'fr-FR', { weekday: 'short' });
  return { weekday: weekday.replace('.', ''), day: date.getDate() };
}

export function fmtDateLong(date, locale) {
  return date.toLocaleDateString(locale || 'fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

export function fmtTime(timeStr) {
  return (timeStr || '').slice(0, 5);
}

// t: useSalon().t — 'time.min' / 'time.hour' anahtarlarını çözer.
export function durationLabel(minutes, t) {
  const min = t ? t('time.min') : 'min';
  const hour = t ? t('time.hour') : 'h';
  if (minutes < 60) return `${minutes} ${min}`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h} ${hour} ${m} ${min}` : `${h} ${hour}`;
}

export function isSameDate(a, b) {
  return toISODate(a) === toISODate(b);
}
