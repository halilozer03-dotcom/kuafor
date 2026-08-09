import { supabase } from './supabase';
import { toISODate } from './time';

export async function fetchSettings() {
  const { data, error } = await supabase.from('salon_settings').select('*').eq('id', 1).single();
  if (error) throw error;
  return data;
}

export async function fetchActiveServices() {
  const { data, error } = await supabase
    .from('salon_services')
    .select('*')
    .eq('active', true)
    .order('sort_order');
  if (error) throw error;
  return data;
}

export async function fetchStaffForService(serviceId) {
  const { data, error } = await supabase
    .from('salon_staff_services')
    .select('staff_id, salon_staff(id, full_name, title, title_tr, avatar_url, active, sort_order)')
    .eq('service_id', serviceId);
  if (error) throw error;
  return data
    .map((r) => r.salon_staff)
    .filter((s) => s && s.active)
    .sort((a, b) => a.sort_order - b.sort_order);
}

export async function fetchSlots(serviceId, date, staffId) {
  const { data, error } = await supabase.rpc('salon_get_available_slots', {
    p_service_id: serviceId,
    p_date: toISODate(date),
    p_staff_id: staffId || null,
  });
  if (error) throw error;
  return data || [];
}

export async function bookAppointment({ serviceId, staffId, date, startTime, name, phone, email, notes }) {
  const { data, error } = await supabase.rpc('salon_book_appointment', {
    p_service_id: serviceId,
    p_staff_id: staffId,
    p_date: toISODate(date),
    p_start_time: startTime,
    p_customer_name: name,
    p_customer_phone: phone,
    p_customer_email: email || null,
    p_notes: notes || null,
  });
  if (error) throw error;
  return data;
}

// --- Admin ---

export async function fetchAppointments({ from, to, staffId, status } = {}) {
  let q = supabase
    .from('salon_appointments')
    .select('*, salon_services(name, name_tr, duration_minutes, price_cents), salon_staff(full_name)')
    .order('appointment_date')
    .order('start_time');
  if (from) q = q.gte('appointment_date', from);
  if (to) q = q.lte('appointment_date', to);
  if (staffId) q = q.eq('staff_id', staffId);
  if (status) q = q.eq('status', status);
  const { data, error } = await q;
  if (error) throw error;
  return data;
}

export async function updateAppointmentStatus(id, status) {
  const { error } = await supabase.from('salon_appointments').update({ status }).eq('id', id);
  if (error) throw error;
}

export async function fetchAllServices() {
  const { data, error } = await supabase.from('salon_services').select('*').order('sort_order');
  if (error) throw error;
  return data;
}

export async function upsertService(service) {
  const { error } = await supabase.from('salon_services').upsert(service);
  if (error) throw error;
}

export async function deleteService(id) {
  const { error } = await supabase.from('salon_services').delete().eq('id', id);
  if (error) throw error;
}

export async function fetchAllStaff() {
  const { data, error } = await supabase.from('salon_staff').select('*').order('sort_order');
  if (error) throw error;
  return data;
}

export async function upsertStaff(staff) {
  const { data, error } = await supabase.from('salon_staff').upsert(staff).select().single();
  if (error) throw error;
  return data;
}

export async function deleteStaff(id) {
  const { error } = await supabase.from('salon_staff').delete().eq('id', id);
  if (error) throw error;
}

// "Mola" günlük kullanılan bir düğmedir: personeli silmeden/pasifleştirmeden
// yalnızca BUGÜN için randevuya kapatır. Gelecek günler etkilenmez.
export async function setStaffBreak(id, onBreak) {
  const { error } = await supabase.from('salon_staff').update({ on_break: onBreak }).eq('id', id);
  if (error) throw error;
}

export async function fetchStaffServiceIds(staffId) {
  const { data, error } = await supabase.from('salon_staff_services').select('service_id').eq('staff_id', staffId);
  if (error) throw error;
  return data.map((r) => r.service_id);
}

export async function setStaffServices(staffId, serviceIds) {
  const { error: delErr } = await supabase.from('salon_staff_services').delete().eq('staff_id', staffId);
  if (delErr) throw delErr;
  if (serviceIds.length === 0) return;
  const rows = serviceIds.map((service_id) => ({ staff_id: staffId, service_id }));
  const { error } = await supabase.from('salon_staff_services').insert(rows);
  if (error) throw error;
}

export async function fetchStaffHours(staffId) {
  const { data, error } = await supabase
    .from('salon_staff_hours')
    .select('*')
    .eq('staff_id', staffId)
    .order('weekday')
    .order('start_time');
  if (error) throw error;
  return data;
}

export async function setStaffHours(staffId, hours) {
  const { error: delErr } = await supabase.from('salon_staff_hours').delete().eq('staff_id', staffId);
  if (delErr) throw delErr;
  if (hours.length === 0) return;
  const rows = hours.map((h) => ({ staff_id: staffId, weekday: h.weekday, start_time: h.start_time, end_time: h.end_time }));
  const { error } = await supabase.from('salon_staff_hours').insert(rows);
  if (error) throw error;
}

export async function updateSettings(patch) {
  const { error } = await supabase.from('salon_settings').update(patch).eq('id', 1);
  if (error) throw error;
}
