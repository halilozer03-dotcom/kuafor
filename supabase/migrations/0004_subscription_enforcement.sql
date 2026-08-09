-- Abonelik kilidini gerçekten uygulanabilir hale getirir + saat dilimini ayara taşır.
--
-- 0003 yalnızca salon_settings.subscription_active kolonunu ekledi; hiçbir yerde
-- okunmuyordu. Yani kilit kapalıyken bile randevu RPC'leri çalışmaya devam ediyordu
-- ve salon admini RLS'teki "settings_admin_write" politikası sayesinde kolonu
-- kendisi true'ya çekebiliyordu. Bu migration üç şeyi düzeltir:
--
--   1) Kolonu yalnızca servis sağlayıcı değiştirebilir (PostgREST üzerinden gelen
--      anon/authenticated istekleri trigger ile reddedilir).
--   2) Kilit kapalıyken slot üretimi ve randevu oluşturma sunucu tarafında durur;
--      istemcideki kilit ekranı yalnızca görsel katmandır.
--   3) Saat dilimi koda gömülü 'Europe/Istanbul' olmaktan çıkıp salon_settings.timezone
--      kolonuna taşınır. Salon Fransa'da olduğu için varsayılan 'Europe/Paris';
--      gömülü değer yüzünden "geçmiş saatleri gizle" mantığı yanlış çalışıyordu.

alter table salon_settings
  add column if not exists timezone text not null default 'Europe/Paris';

update salon_settings set timezone = 'Europe/Paris' where id = 1 and timezone = 'Europe/Istanbul';

-- ---------------------------------------------------------------------------
-- 1) subscription_active kolon koruması
-- ---------------------------------------------------------------------------

create or replace function salon_protect_subscription() returns trigger
language plpgsql security definer
set search_path = public
as $$
begin
  if new.subscription_active is distinct from old.subscription_active
     and coalesce(auth.role(), '') in ('anon', 'authenticated') then
    raise exception 'subscription_active yalnızca servis sağlayıcı tarafından değiştirilebilir';
  end if;
  return new;
end;
$$;

drop trigger if exists salon_settings_protect_subscription on salon_settings;
create trigger salon_settings_protect_subscription
  before update on salon_settings
  for each row execute function salon_protect_subscription();

-- ---------------------------------------------------------------------------
-- 2) Kilidin ve saat diliminin randevu akışında uygulanması
-- ---------------------------------------------------------------------------

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
  v_active boolean;
  v_tz text;
  v_now_local timestamp;
  v_weekday int := extract(dow from p_date);
  r_staff record;
  r_hours record;
  v_slot time;
  v_slot_end time;
  v_ok boolean;
begin
  select slot_interval_minutes, booking_lead_minutes, subscription_active, timezone
    into v_interval, v_lead, v_active, v_tz
  from salon_settings where id = 1;

  -- Abonelik kapalıysa hiç slot üretme.
  if not coalesce(v_active, true) then
    return;
  end if;

  select duration_minutes into v_duration from salon_services where id = p_service_id and active;
  if v_duration is null then
    return;
  end if;

  v_interval := coalesce(v_interval, 15);
  v_lead := coalesce(v_lead, 0);
  v_now_local := now() at time zone coalesce(nullif(v_tz, ''), 'Europe/Paris');

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

create or replace function salon_book_appointment(
  p_service_id uuid,
  p_staff_id uuid,
  p_date date,
  p_start_time time,
  p_customer_name text,
  p_customer_phone text,
  p_customer_email text default null,
  p_notes text default null
) returns salon_appointments
language plpgsql security definer
set search_path = public
as $$
declare
  v_duration int;
  v_end_time time;
  v_row salon_appointments;
  v_available boolean;
begin
  if not coalesce((select subscription_active from salon_settings where id = 1), true) then
    raise exception 'Online randevu şu anda kapalı';
  end if;

  if coalesce(trim(p_customer_name), '') = '' or coalesce(trim(p_customer_phone), '') = '' then
    raise exception 'Ad soyad ve telefon numarası zorunludur';
  end if;

  select duration_minutes into v_duration from salon_services where id = p_service_id and active;
  if v_duration is null then
    raise exception 'Geçersiz hizmet';
  end if;
  v_end_time := p_start_time + (v_duration || ' minutes')::interval;

  select true into v_available
  from salon_get_available_slots(p_service_id, p_date, p_staff_id) s
  where s.slot_time = p_start_time and s.staff_id = p_staff_id
  limit 1;

  if not coalesce(v_available, false) then
    raise exception 'Seçilen saat artık uygun değil, lütfen başka bir saat seçin';
  end if;

  begin
    insert into salon_appointments(
      service_id, staff_id, appointment_date, start_time, end_time,
      customer_name, customer_phone, customer_email, notes, status
    ) values (
      p_service_id, p_staff_id, p_date, p_start_time, v_end_time,
      trim(p_customer_name), trim(p_customer_phone), nullif(trim(p_customer_email), ''),
      nullif(trim(p_notes), ''), 'confirmed'
    ) returning * into v_row;
  exception when exclusion_violation then
    raise exception 'Seçilen saat artık uygun değil, lütfen başka bir saat seçin';
  end;

  return v_row;
end;
$$;

grant execute on function salon_get_available_slots(uuid, date, uuid) to anon, authenticated;
grant execute on function salon_book_appointment(uuid, uuid, date, time, text, text, text, text) to anon, authenticated;
