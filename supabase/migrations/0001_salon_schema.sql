-- Kuaför randevu uygulaması şeması.
-- Not: Bu proje aynı Supabase projesinde "Ozer Order" (restoran) tablolarıyla birlikte yaşar,
-- bu yüzden tüm tablo/fonksiyon adları salon_ önekiyle izole edilmiştir.

create extension if not exists pgcrypto;
create extension if not exists btree_gist;

-- ---------------------------------------------------------------------------
-- Tablolar
-- ---------------------------------------------------------------------------

create table if not exists salon_settings (
  id int primary key default 1,
  name text not null default 'Kuaför Salonu',
  slogan text,
  description text,
  address text,
  phone text,
  email text,
  instagram text,
  logo_url text,
  opening_hours_note text,
  slot_interval_minutes int not null default 15,
  booking_lead_minutes int not null default 60,
  booking_horizon_days int not null default 30,
  updated_at timestamptz not null default now(),
  constraint salon_settings_singleton check (id = 1)
);

create table if not exists salon_services (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  category text,
  duration_minutes int not null check (duration_minutes > 0),
  price_cents int not null check (price_cents >= 0),
  active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists salon_staff (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  title text,
  avatar_url text,
  bio text,
  active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists salon_staff_services (
  staff_id uuid not null references salon_staff(id) on delete cascade,
  service_id uuid not null references salon_services(id) on delete cascade,
  primary key (staff_id, service_id)
);

-- weekday: Postgres extract(dow from date) ile aynı kural -> 0=Pazar .. 6=Cumartesi
create table if not exists salon_staff_hours (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid not null references salon_staff(id) on delete cascade,
  weekday int not null check (weekday between 0 and 6),
  start_time time not null,
  end_time time not null,
  check (end_time > start_time)
);

create table if not exists salon_time_off (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid not null references salon_staff(id) on delete cascade,
  off_date date not null,
  start_time time,
  end_time time,
  reason text,
  created_at timestamptz not null default now(),
  check (
    (start_time is null and end_time is null) or
    (start_time is not null and end_time is not null and end_time > start_time)
  )
);

create table if not exists salon_appointments (
  id uuid primary key default gen_random_uuid(),
  service_id uuid not null references salon_services(id),
  staff_id uuid not null references salon_staff(id),
  appointment_date date not null,
  start_time time not null,
  end_time time not null,
  customer_name text not null,
  customer_phone text not null,
  customer_email text,
  notes text,
  status text not null default 'confirmed' check (status in ('confirmed','completed','cancelled','no_show')),
  created_at timestamptz not null default now(),
  time_range tsrange generated always as (
    tsrange((appointment_date + start_time), (appointment_date + end_time))
  ) stored
);

create index if not exists salon_appointments_staff_date_idx
  on salon_appointments (staff_id, appointment_date);

-- Aynı personel için çakışan (aktif) randevuları veritabanı seviyesinde engelle.
alter table salon_appointments
  drop constraint if exists salon_appointments_no_overlap;
alter table salon_appointments
  add constraint salon_appointments_no_overlap
  exclude using gist (staff_id with =, time_range with &&)
  where (status in ('confirmed','completed'));

create table if not exists salon_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  created_at timestamptz not null default now()
);

insert into salon_settings (id, name, slogan, address, phone, email, opening_hours_note)
values (1, 'Kuaför Salonu', 'Randevunuzu online alın', '', '', '', 'Pazartesi - Cumartesi 09:00 - 19:00')
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Yetki fonksiyonu
-- ---------------------------------------------------------------------------

create or replace function salon_is_admin() returns boolean
language sql security definer stable
set search_path = public
as $$
  select exists(select 1 from salon_admins where user_id = auth.uid());
$$;

-- İlk kurulum: salon_admins boşsa, giriş yapan ilk kullanıcı otomatik admin olur.
create or replace function salon_bootstrap_admin() returns boolean
language plpgsql security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Oturum açmanız gerekiyor';
  end if;
  if exists (select 1 from salon_admins) then
    return exists (select 1 from salon_admins where user_id = auth.uid());
  end if;
  insert into salon_admins(user_id) values (auth.uid());
  return true;
end;
$$;

-- ---------------------------------------------------------------------------
-- Uygunluk hesaplama ve randevu oluşturma
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
grant execute on function salon_bootstrap_admin() to authenticated;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table salon_settings enable row level security;
alter table salon_services enable row level security;
alter table salon_staff enable row level security;
alter table salon_staff_services enable row level security;
alter table salon_staff_hours enable row level security;
alter table salon_time_off enable row level security;
alter table salon_appointments enable row level security;
alter table salon_admins enable row level security;

drop policy if exists settings_select_all on salon_settings;
create policy settings_select_all on salon_settings for select using (true);
drop policy if exists settings_admin_write on salon_settings;
create policy settings_admin_write on salon_settings for all using (salon_is_admin()) with check (salon_is_admin());

drop policy if exists services_select_active_or_admin on salon_services;
create policy services_select_active_or_admin on salon_services for select using (active or salon_is_admin());
drop policy if exists services_admin_write on salon_services;
create policy services_admin_write on salon_services for all using (salon_is_admin()) with check (salon_is_admin());

drop policy if exists staff_select_active_or_admin on salon_staff;
create policy staff_select_active_or_admin on salon_staff for select using (active or salon_is_admin());
drop policy if exists staff_admin_write on salon_staff;
create policy staff_admin_write on salon_staff for all using (salon_is_admin()) with check (salon_is_admin());

drop policy if exists staff_services_select_all on salon_staff_services;
create policy staff_services_select_all on salon_staff_services for select using (true);
drop policy if exists staff_services_admin_write on salon_staff_services;
create policy staff_services_admin_write on salon_staff_services for all using (salon_is_admin()) with check (salon_is_admin());

drop policy if exists staff_hours_admin_all on salon_staff_hours;
create policy staff_hours_admin_all on salon_staff_hours for all using (salon_is_admin()) with check (salon_is_admin());

drop policy if exists time_off_admin_all on salon_time_off;
create policy time_off_admin_all on salon_time_off for all using (salon_is_admin()) with check (salon_is_admin());

drop policy if exists appointments_admin_all on salon_appointments;
create policy appointments_admin_all on salon_appointments for all using (salon_is_admin()) with check (salon_is_admin());

drop policy if exists salon_admins_self_select on salon_admins;
create policy salon_admins_self_select on salon_admins for select using (user_id = auth.uid());
