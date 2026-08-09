-- Hosting/lisans kilidi ve "mola ver" desteği.

alter table salon_settings
  add column if not exists subscription_active boolean not null default true;

alter table salon_staff
  add column if not exists on_break boolean not null default false;

-- Not: subscription_active kasıtlı olarak salon_settings RLS'sindeki
-- "settings_admin_write" politikasının erişebildiği bir alan. Salon admini
-- panelden bu alanı değiştirmemeli; bu yüzden updateSettings() istemci
-- fonksiyonu bu alanı asla göndermez. Kilidi sadece servis sağlayıcı
-- (Supabase SQL Editor / MCP) tarafından elle değiştirilir.

create or replace function salon_get_available_slots(
  p_service_id uuid,
  p_date date,
  p_staff_id uuid default null
)
returns table(staff_id uuid, staff_name text, slot_time time)
language plpgsql security definer stable
set search_path = public
as $$
declare
  v_duration int;
  v_interval int;
  v_lead int;
  v_now_local timestamp := now() at time zone 'Europe/Istanbul';
  v_weekday int := extract(dow from p_date);
  r_staff record;
  r_hours record;
  v_slot time;
  v_slot_end time;
  v_ok boolean;
begin
  select duration_minutes into v_duration from salon_services where id = p_service_id and active;
  if v_duration is null then
    return;
  end if;

  select slot_interval_minutes, booking_lead_minutes into v_interval, v_lead
  from salon_settings where id = 1;
  v_interval := coalesce(v_interval, 15);
  v_lead := coalesce(v_lead, 0);

  for r_staff in
    select s.id, s.full_name
    from salon_staff s
    join salon_staff_services ss on ss.staff_id = s.id
    where ss.service_id = p_service_id
      and s.active
      and not (s.on_break and p_date = v_now_local::date)
      and (p_staff_id is null or s.id = p_staff_id)
    order by s.sort_order, s.full_name
  loop
    for r_hours in
      select sh.start_time, sh.end_time
      from salon_staff_hours sh
      where sh.staff_id = r_staff.id and sh.weekday = v_weekday
      order by sh.start_time
    loop
      v_slot := r_hours.start_time;
      while v_slot + (v_duration || ' minutes')::interval <= r_hours.end_time loop
        v_slot_end := v_slot + (v_duration || ' minutes')::interval;
        v_ok := true;

        if p_date = v_now_local::date and (p_date + v_slot) < (v_now_local + (v_lead || ' minutes')::interval) then
          v_ok := false;
        end if;

        if v_ok and exists (
          select 1 from salon_time_off t
          where t.staff_id = r_staff.id and t.off_date = p_date
            and (t.start_time is null or (v_slot < t.end_time and v_slot_end > t.start_time))
        ) then
          v_ok := false;
        end if;

        if v_ok and exists (
          select 1 from salon_appointments a
          where a.staff_id = r_staff.id and a.appointment_date = p_date
            and a.status in ('confirmed','completed')
            and v_slot < a.end_time and v_slot_end > a.start_time
        ) then
          v_ok := false;
        end if;

        if v_ok then
          staff_id := r_staff.id;
          staff_name := r_staff.full_name;
          slot_time := v_slot;
          return next;
        end if;

        v_slot := v_slot + (v_interval || ' minutes')::interval;
      end loop;
    end loop;
  end loop;
  return;
end;
$$;
