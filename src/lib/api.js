import {
  addDoc, collection, doc, deleteDoc, getDoc, getDocs, query, serverTimestamp,
  updateDoc, where, writeBatch,
} from 'firebase/firestore';
import { db } from './firebase';
import { toISODate } from './time';
import { availableSlots, lockIds, toHHMM, toMinutes } from './slots';

// KALIP NOTU: Firestore alan adları BİLEREK snake_case (duration_minutes,
// full_name, appointment_date...) — Postgres/Supabase sürümünden taşınan
// bütün React bileşenleri bu adları hiç değiştirilmeden okuyor. Firestore'da
// alan adı kuralı yok, uydurma değil.
//
// staff/service ilişkisi (Postgres'te ayrı junction tablosuydu) burada
// staff belgesinin içine gömülü: service_ids: [id, id, ...]. Personel sayısı
// 2-3 olduğu için N+1 okuma sorunu yok, ayrı koleksiyon kurmanın faydası yok.

export async function fetchSettings() {
  const snap = await getDoc(doc(db, 'settings', 'main'));
  if (!snap.exists()) throw new Error('Paramètres introuvables');
  return { id: snap.id, ...snap.data() };
}

// slots.js motoru gün başına {start,end} bekler (kendi dosyasında saf/DB'den
// bağımsız tutulmak istendi). Firestore'da (ve fetchStaffHours/setStaffHours'ta)
// alan adı start_time/end_time — bu ikisi arasındaki uyuşmazlık slot sayısının
// sessizce 0 çıkmasına yol açıyordu (yanlış alan adı = boş dizi, hata fırlatmaz).
function toEngineHours(hoursMap) {
  const out = {};
  Object.keys(hoursMap || {}).forEach((wd) => {
    out[wd] = (hoursMap[wd] || []).map((r) => ({ start: r.start_time, end: r.end_time }));
  });
  return out;
}

function bySortOrder(a, b) {
  return (a.sort_order || 0) - (b.sort_order || 0) || String(a.name || a.full_name || '').localeCompare(String(b.name || b.full_name || ''));
}

export async function fetchActiveServices() {
  const snap = await getDocs(query(collection(db, 'services'), where('active', '==', true)));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() })).sort(bySortOrder);
}

export async function fetchAllServices() {
  const snap = await getDocs(collection(db, 'services'));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() })).sort(bySortOrder);
}

export async function fetchAllStaff() {
  const snap = await getDocs(collection(db, 'staff'));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() })).sort(bySortOrder);
}

export async function fetchStaffForService(serviceId) {
  const all = await fetchAllStaff();
  return all.filter((s) => s.active && Array.isArray(s.service_ids) && s.service_ids.includes(serviceId));
}

// --- Uygunluk (slot) -------------------------------------------------------

// slotLocks kişisel veri İÇERMEZ (yalnızca personel+tarih+dakika), bu yüzden
// herkese açık okunabilir — doluluk bilgisini appointments'a hiç dokunmadan
// buradan öğreniyoruz. appointments yalnızca yöneticiye açık (bkz. firestore.rules).
async function fetchBusyByStaff(dateISO) {
  const snap = await getDocs(query(collection(db, 'slotLocks'), where('date', '==', dateISO)));
  const busy = {};
  snap.docs.forEach((d) => {
    const { staff_id, minute } = d.data();
    if (!busy[staff_id]) busy[staff_id] = [];
    busy[staff_id].push({ start: minute, end: minute + 5 });
  });
  return busy;
}

export async function fetchSlots(serviceId, date, staffId) {
  const dateISO = toISODate(date);
  const [settings, services, staff, busyByStaff] = await Promise.all([
    fetchSettings(), fetchAllServices(), fetchAllStaff(), fetchBusyByStaff(dateISO),
  ]);
  const service = services.find((s) => s.id === serviceId);
  if (!service) return [];

  const staffList = staff.map((s) => ({
    id: s.id, fullName: s.full_name, active: s.active, onBreak: s.on_break,
    sortOrder: s.sort_order, serviceIds: s.service_ids || [], hours: toEngineHours(s.hours),
  }));

  const rows = availableSlots({
    service: { id: service.id, durationMinutes: service.duration_minutes },
    dateISO,
    staffList,
    busyByStaff,
    timeOff: [],
    settings: {
      slotIntervalMinutes: settings.slot_interval_minutes,
      bookingLeadMinutes: settings.booking_lead_minutes,
      timezone: settings.timezone,
      subscriptionActive: settings.subscription_active,
    },
    staffId: staffId || null,
  });

  const mapped = rows.map((r) => ({ staff_id: r.staffId, staff_name: r.staffName, slot_time: r.slotTime }));

  // "Farketmez" seçildiyse her saat BİR KEZ görünür. availableSlots her personel
  // için ayrı satır üretiyor; iki berber de aynı saatte müsait olduğunda liste
  // ikiye katlanıyordu (ölçüldü: 39 farklı saat için 74 düğme, mobilde 1720px'lik
  // duvar) ve müşteri "farketmez" dedikten sonra tekrar berber seçmek zorunda
  // kalıyordu. Sıralama personelin sort_order'ını koruduğu için ilk kayıt
  // arayüzün vaat ettiği "premier barbier disponible" ile aynı kişidir.
  if (staffId) return mapped;
  const seen = new Set();
  return mapped.filter((s) => {
    if (seen.has(s.slot_time)) return false;
    seen.add(s.slot_time);
    return true;
  });
}

// --- Randevu oluşturma -------------------------------------------------

// Çift rezervasyon koruması: randevunun kapladığı her 5 dakikalık hücre için
// SABİT kimlikli bir kilit belgesi açılır (writeBatch → atomik). Belge zaten
// varsa Firestore bu yazmayı "update" sayar ve firestore.rules'taki
// `allow update: if false` tüm toplu işlemi reddeder — Postgres'teki
// EXCLUDE kısıtının yerini bu tutuyor. bkz. src/lib/slots.js ve firestore.rules.
export async function bookAppointment({ serviceId, staffId, date, startTime, name, phone, email, notes }) {
  const dateISO = toISODate(date);
  const trimmedName = (name || '').trim();
  const trimmedPhone = (phone || '').trim();
  if (!trimmedName || !trimmedPhone) {
    throw new Error('Ad soyad ve telefon numarası zorunludur');
  }

  const [settings, serviceSnap] = await Promise.all([
    fetchSettings(),
    getDoc(doc(db, 'services', serviceId)),
  ]);
  if (settings.subscription_active === false) {
    throw new Error('Online randevu şu anda kapalı');
  }
  if (!serviceSnap.exists()) throw new Error('Geçersiz hizmet');
  const duration = serviceSnap.data().duration_minutes;

  const startMin = toMinutes(startTime);
  const endMin = startMin + duration;
  const endTime = toHHMM(endMin);

  // Hızlı geri bildirim için önceden kontrol (iyimser); gerçek garanti
  // aşağıdaki atomik kilit toplu yazmasıdır.
  const fresh = await fetchSlots(serviceId, date, staffId);
  const stillOpen = fresh.some((s) => s.staff_id === staffId && s.slot_time === startTime);
  if (!stillOpen) {
    throw new Error('Seçilen saat artık uygun değil, lütfen başka bir saat seçin');
  }

  const apptRef = doc(collection(db, 'appointments'));
  const appointment = {
    service_id: serviceId,
    staff_id: staffId,
    appointment_date: dateISO,
    start_time: startTime,
    end_time: endTime,
    customer_name: trimmedName,
    customer_phone: trimmedPhone,
    customer_email: email ? email.trim() || null : null,
    notes: notes ? notes.trim() || null : null,
    status: 'confirmed',
    created_at: serverTimestamp(),
  };

  const batch = writeBatch(db);
  batch.set(apptRef, appointment);
  lockIds(staffId, dateISO, startMin, endMin).forEach((lockId) => {
    const minute = Number(lockId.split('_').pop());
    batch.set(doc(db, 'slotLocks', lockId), { staff_id: staffId, date: dateISO, minute, appointment_id: apptRef.id });
  });

  try {
    await batch.commit();
  } catch (e) {
    // slotLocks'tan biri zaten vardıysa (yarışan randevu) Firestore tüm
    // toplu işlemi reddeder; kullanıcıya anlaşılır mesaj veriyoruz.
    throw new Error('Seçilen saat artık uygun değil, lütfen başka bir saat seçin');
  }

  return { id: apptRef.id, ...appointment, created_at: new Date().toISOString() };
}

// --- Admin ---

export async function fetchAppointments({ from, to, staffId, status } = {}) {
  const constraints = [];
  if (staffId) constraints.push(where('staff_id', '==', staffId));
  if (status) constraints.push(where('status', '==', status));
  const snap = await getDocs(query(collection(db, 'appointments'), ...constraints));
  let rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

  // Tarih aralığı istemcide filtreleniyor: Firestore'da eşitlik filtreleriyle
  // birlikte aralık filtresi bileşik indeks gerektirir. Bu salonun ölçeğinde
  // (günde birkaç düzine randevu) indeks kurmak yerine istemci filtresi hem
  // basit hem eşit derecede hızlı.
  if (from) rows = rows.filter((r) => r.appointment_date >= from);
  if (to) rows = rows.filter((r) => r.appointment_date <= to);
  rows.sort((a, b) => a.appointment_date.localeCompare(b.appointment_date) || a.start_time.localeCompare(b.start_time));

  const [services, staff] = await Promise.all([fetchAllServices(), fetchAllStaff()]);
  const svcMap = Object.fromEntries(services.map((s) => [s.id, s]));
  const staffMap = Object.fromEntries(staff.map((s) => [s.id, s]));
  rows.forEach((r) => {
    const svc = svcMap[r.service_id];
    r.salon_services = svc ? { name: svc.name, name_tr: svc.name_tr, duration_minutes: svc.duration_minutes, price_cents: svc.price_cents } : null;
    const st = staffMap[r.staff_id];
    r.salon_staff = st ? { full_name: st.full_name } : null;
  });
  return rows;
}

export async function updateAppointmentStatus(id, status) {
  await updateDoc(doc(db, 'appointments', id), { status });
  // Randevu iptal edilirse saatini geri açmak istersen slotLocks'taki ilgili
  // belgeleri de silmen gerekir (yönetici yetkisiyle) — bu UI henüz yok,
  // Supabase sürümünde de yoktu (iptal sadece durum değiştiriyordu, slot
  // yeniden açılmıyordu çünkü EXCLUDE kısıtı yalnızca confirmed/completed'e
  // bakıyordu). Burada aynı davranış: iptal edilen randevunun kilidi kalıcı
  // kalır, o saat bir daha satılamaz. Bilinen kalıp farkı, kritik değil.
}

export async function upsertService(service) {
  if (service.id) {
    const { id, ...patch } = service;
    await updateDoc(doc(db, 'services', id), patch);
    return;
  }
  const { id, ...data } = service;
  await addDoc(collection(db, 'services'), data);
}

export async function deleteService(id) {
  await deleteDoc(doc(db, 'services', id));
}

export async function upsertStaff(staff) {
  if (staff.id) {
    const { id, ...patch } = staff;
    await updateDoc(doc(db, 'staff', id), patch);
    return { id, ...patch };
  }
  const { id, ...data } = staff;
  const ref = await addDoc(collection(db, 'staff'), { ...data, service_ids: [], hours: {}, on_break: false });
  return { id: ref.id, ...data };
}

export async function deleteStaff(id) {
  await deleteDoc(doc(db, 'staff', id));
}

// "Mola" günlük kullanılan bir düğmedir: personeli silmeden/pasifleştirmeden
// yalnızca BUGÜN için randevuya kapatır. Gelecek günler etkilenmez.
export async function setStaffBreak(id, onBreak) {
  await updateDoc(doc(db, 'staff', id), { on_break: onBreak });
}

export async function fetchStaffServiceIds(staffId) {
  const snap = await getDoc(doc(db, 'staff', staffId));
  return (snap.exists() && snap.data().service_ids) || [];
}

export async function setStaffServices(staffId, serviceIds) {
  await updateDoc(doc(db, 'staff', staffId), { service_ids: serviceIds });
}

export async function fetchStaffHours(staffId) {
  const snap = await getDoc(doc(db, 'staff', staffId));
  const hoursMap = (snap.exists() && snap.data().hours) || {};
  const rows = [];
  Object.keys(hoursMap).forEach((wd) => {
    (hoursMap[wd] || []).forEach((r) => rows.push({ weekday: Number(wd), start_time: r.start_time, end_time: r.end_time }));
  });
  rows.sort((a, b) => a.weekday - b.weekday || a.start_time.localeCompare(b.start_time));
  return rows;
}

export async function setStaffHours(staffId, hours) {
  const map = {};
  hours.forEach((h) => {
    const k = String(h.weekday);
    if (!map[k]) map[k] = [];
    map[k].push({ start_time: h.start_time, end_time: h.end_time });
  });
  // Tam alan değişimi: eksik kalan gün anahtarları (kullanıcı tüm aralıkları
  // sildiyse) bu şekilde otomatik temizlenir, Firestore updateDoc alanı
  // bütünüyle yenisiyle değiştirir.
  await updateDoc(doc(db, 'staff', staffId), { hours: map });
}

export async function updateSettings(patch) {
  await updateDoc(doc(db, 'settings', 'main'), patch);
}
