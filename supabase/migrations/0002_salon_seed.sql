-- Örnek demo verisi. Panelden düzenlenebilir/silinebilir, sadece tablolar boşsa eklenir.

do $$
declare
  v_ayse uuid;
  v_can uuid;
  v_svc_sac uuid;
  v_svc_fon uuid;
  v_svc_boya uuid;
  v_svc_sakal uuid;
  wd int;
begin
  if exists (select 1 from salon_staff) then
    return;
  end if;

  insert into salon_staff (full_name, title, sort_order) values ('Ayşe Yılmaz', 'Kuaför', 1) returning id into v_ayse;
  insert into salon_staff (full_name, title, sort_order) values ('Can Demir', 'Berber', 2) returning id into v_can;

  insert into salon_services (name, description, category, duration_minutes, price_cents, sort_order)
    values ('Saç Kesimi', 'Yıkama ve fön dahil klasik saç kesimi', 'Saç', 30, 45000, 1) returning id into v_svc_sac;
  insert into salon_services (name, description, category, duration_minutes, price_cents, sort_order)
    values ('Fön', 'Yıkama ve şekillendirme', 'Saç', 30, 35000, 2) returning id into v_svc_fon;
  insert into salon_services (name, description, category, duration_minutes, price_cents, sort_order)
    values ('Saç Boyama', 'Tek renk boya uygulaması', 'Renklendirme', 90, 120000, 3) returning id into v_svc_boya;
  insert into salon_services (name, description, category, duration_minutes, price_cents, sort_order)
    values ('Sakal Tıraşı', 'Ustura ile sakal şekillendirme', 'Berber', 20, 25000, 4) returning id into v_svc_sakal;

  insert into salon_staff_services (staff_id, service_id) values
    (v_ayse, v_svc_sac), (v_ayse, v_svc_fon), (v_ayse, v_svc_boya),
    (v_can, v_svc_sac), (v_can, v_svc_sakal);

  -- Pazartesi(1) - Cumartesi(6) 09:00-19:00, hafta arası 13:00-14:00 mola
  foreach wd in array array[1,2,3,4,5,6] loop
    insert into salon_staff_hours (staff_id, weekday, start_time, end_time) values
      (v_ayse, wd, '09:00', '13:00'), (v_ayse, wd, '14:00', '19:00'),
      (v_can, wd, '09:00', '13:00'), (v_can, wd, '14:00', '19:00');
  end loop;
end $$;
