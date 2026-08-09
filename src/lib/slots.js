// Uygunluk (slot) motoru — saf fonksiyonlar, Firebase'e bağımlı değil.
//
// Supabase'deki salon_get_available_slots() PL/pgSQL fonksiyonunun JavaScript
// karşılığı. Ücretsiz Firebase'de (Spark) Cloud Functions olmadığı için bu
// hesap istemciye indi. Girdiler dışarıdan verilir; fonksiyonlar saf olduğu
// için test edilebilir.
//
// TÜM ZAMAN HESABI "gün başından beri geçen dakika" (int) üzerinden yapılır.
// Date nesnesiyle saat aritmetiği yapmak, tarayıcı saat dilimi salonunkinden
// farklı olduğunda sessizce kayar — Supabase sürümünde tam bu hata vardı
// (kod Europe/Istanbul'a gömülüydü, salon Fransa'da).

export function toMinutes(hhmm) {
  if (!hhmm) return 0;
  const [h, m] = String(hhmm).split(':');
  return Number(h) * 60 + Number(m);
}

export function toHHMM(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0');
}

// Salonun kendi saat dilimindeki "şimdi". Ziyaretçinin tarayıcı saati değil —
// Türkiye'den bakan biri Fransa'daki salonun saatlerini görmeli.
export function salonNow(timezone, ref = new Date()) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone || 'Europe/Paris',
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', hour12: false,
    }).formatToParts(ref).map((p) => [p.type, p.value])
  );
  // Bazı motorlar gece yarısı için saat olarak "24" döndürür.
  const hour = Number(parts.hour) % 24;
  return {
    dateISO: `${parts.year}-${parts.month}-${parts.day}`,
    minutes: hour * 60 + Number(parts.minute),
  };
}

// Postgres extract(dow) ile aynı: 0=Pazar .. 6=Cumartesi.
// Tarih dizgisinden hesaplanır ki tarayıcı saat dilimi günü kaydırmasın.
export function weekdayOf(dateISO) {
  const [y, m, d] = dateISO.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

function overlaps(aStart, aEnd, bStart, bEnd) {
  return aStart < bEnd && aEnd > bStart;
}

/**
 * Bir hizmet ve tarih için uygun başlangıç saatlerini üretir.
 *
 * @param {object}   service   { durationMinutes }
 * @param {string}   dateISO   'YYYY-MM-DD'
 * @param {object[]} staffList [{ id, fullName, active, onBreak, sortOrder, serviceIds, hours }]
 *                             hours: { '1': [{start:'09:00', end:'19:00'}], ... }
 * @param {object}   busyByStaff  { staffId: [{start, end}] }  dakika cinsinden dolu aralıklar
 * @param {object[]} timeOff   [{ staffId, date, startTime, endTime }]  saat null ise tüm gün
 * @param {object}   settings  { slotIntervalMinutes, bookingLeadMinutes, timezone, subscriptionActive }
 * @param {string}   staffId   belirli bir personel isteniyorsa id, yoksa null
 * @returns {{staffId, staffName, slotTime}[]}
 */
export function availableSlots({ service, dateISO, staffList, busyByStaff, timeOff, settings, staffId = null }) {
  // Abonelik kapalıysa hiç slot yok. Bu yalnızca ilk savunma hattı; asıl engel
  // Firestore güvenlik kurallarında (istemci kodu değiştirilebilir).
  if (settings && settings.subscriptionActive === false) return [];
  if (!service || !service.durationMinutes) return [];

  const duration = service.durationMinutes;
  const interval = (settings && settings.slotIntervalMinutes) || 15;
  const lead = (settings && settings.bookingLeadMinutes) || 0;
  const now = salonNow(settings && settings.timezone);
  const isToday = dateISO === now.dateISO;
  const weekday = weekdayOf(dateISO);

  const out = [];
  const candidates = (staffList || [])
    .filter((s) => s.active)
    .filter((s) => !staffId || s.id === staffId)
    .filter((s) => (s.serviceIds || []).includes(service.id))
    // "Molada" yalnızca BUGÜNÜ kapatır; yarın kendiliğinden açılır.
    .filter((s) => !(s.onBreak && isToday))
    .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0) || String(a.fullName).localeCompare(String(b.fullName)));

  for (const st of candidates) {
    const ranges = (st.hours && st.hours[String(weekday)]) || [];
    const busy = (busyByStaff && busyByStaff[st.id]) || [];
    const off = (timeOff || []).filter((t) => t.staffId === st.id && t.date === dateISO);

    for (const r of ranges) {
      const rStart = toMinutes(r.start);
      const rEnd = toMinutes(r.end);

      for (let slot = rStart; slot + duration <= rEnd; slot += interval) {
        const slotEnd = slot + duration;

        if (isToday && slot < now.minutes + lead) continue;
        if (off.some((t) => (t.startTime == null) || overlaps(slot, slotEnd, toMinutes(t.startTime), toMinutes(t.endTime)))) continue;
        if (busy.some((b) => overlaps(slot, slotEnd, b.start, b.end))) continue;

        out.push({ staffId: st.id, staffName: st.fullName, slotTime: toHHMM(slot) });
      }
    }
  }

  return out.sort((a, b) => a.slotTime.localeCompare(b.slotTime));
}

// --- Çakışma kilidi -------------------------------------------------------
//
// Postgres'te çakışmayı `EXCLUDE USING gist` kısıtı veritabanı seviyesinde
// imkânsız kılıyordu. Firestore'da böyle bir kısıt YOK. Yerine: randevunun
// kapladığı her 5 dakikalık hücre için sabit kimlikli bir "kilit" belgesi
// açılır. Toplu yazma (writeBatch) atomiktir ve güvenlik kuralları var olan
// bir kilidin ÜZERİNE yazmayı reddeder — dolayısıyla iki müşteri aynı anda
// aynı saate basarsa ikincisinin tüm işlemi topluca geri alınır.
//
// Izgara 5 dakika ve SABİT: ayarlardaki randevu aralığına bağlanırsa, ayar
// sonradan değiştiğinde eski kilitlerle yeni kilitler hizasız kalır ve
// koruma sessizce delinir.
export const LOCK_GRID_MINUTES = 5;

export function lockIds(staffId, dateISO, startMinutes, endMinutes) {
  const g = LOCK_GRID_MINUTES;
  const first = Math.floor(startMinutes / g) * g;
  const last = Math.ceil(endMinutes / g) * g;
  const ids = [];
  for (let m = first; m < last; m += g) {
    ids.push(`${staffId}_${dateISO}_${m}`);
  }
  return ids;
}
