-- Yer tutucu "Barbier" -> gercek isim Sofiane. Hassan yeni personel olarak eklenir.
-- Ikisine de mevcut yer tutucunun sahip oldugu tum hizmetler ve calisma saatleri
-- (Pzt-Cmt 09:00-19:00) kopyalanir; bireysel fark belirtilmedigi surece varsayilan budur.

update salon_staff
set full_name = 'Sofiane'
where full_name = 'Barbier';

do $$
declare
  v_sofiane uuid := (select id from salon_staff where full_name = 'Sofiane');
  v_hassan uuid;
begin
  if v_sofiane is null or exists (select 1 from salon_staff where full_name = 'Hassan') then
    return;
  end if;

  insert into salon_staff (full_name, title, title_tr, sort_order)
  values ('Hassan', 'Barbier', 'Berber', 2)
  returning id into v_hassan;

  insert into salon_staff_services (staff_id, service_id)
    select v_hassan, service_id from salon_staff_services where staff_id = v_sofiane;

  insert into salon_staff_hours (staff_id, weekday, start_time, end_time)
    select v_hassan, weekday, start_time, end_time from salon_staff_hours where staff_id = v_sofiane;
end $$;
