-- Prestige Barber (Fransa) gerçek verisi + iki dilli (FR/TR) metin kolonları.
--
-- Dil kuralı: temel kolonlar (name, category, slogan, ...) FRANSIZCA kanonik metni
-- tutar; müşteri tarafında bu görünür. Yanlarındaki *_tr kolonları salon sahibinin
-- panelde okuduğu Türkçe karşılıktır. *_tr boşsa arayüz temel kolona düşer.

-- ---------------------------------------------------------------------------
-- Türkçe karşılık kolonları
-- ---------------------------------------------------------------------------

alter table salon_services
  add column if not exists name_tr text,
  add column if not exists description_tr text,
  add column if not exists category_tr text;

alter table salon_staff
  add column if not exists title_tr text,
  add column if not exists bio_tr text;

alter table salon_settings
  add column if not exists slogan_tr text,
  add column if not exists description_tr text,
  add column if not exists opening_hours_note_tr text,
  -- Para birimi de salona özel: kalıp başka ülkede kurulursa burası değişir.
  add column if not exists currency text not null default 'EUR';

-- ---------------------------------------------------------------------------
-- Salon bilgileri
-- ---------------------------------------------------------------------------

update salon_settings set
  name = 'Prestige Barber',
  slogan = 'Avec ou sans rendez-vous',
  slogan_tr = 'Randevulu veya randevusuz',
  phone = '07 58 37 79 86',
  timezone = 'Europe/Paris',
  opening_hours_note = 'Lundi - Samedi 09:00 - 19:00',
  opening_hours_note_tr = 'Pazartesi - Cumartesi 09:00 - 19:00'
where id = 1;

-- ---------------------------------------------------------------------------
-- Hizmet listesi (dükkân vitrinindeki fiyat listesi)
--
-- DİKKAT: Fiyatlar vitrinden birebir alındı. Süreler (duration_minutes) vitrinde
-- yazmıyor; aşağıdakiler tahmindir ve panelden düzeltilmelidir. Süre yanlışsa
-- slot hesabı da yanlış olur.
-- ---------------------------------------------------------------------------

do $$
declare
  v_had_demo boolean;
begin
  -- 0002'deki demo verisi hâlâ duruyorsa temizle (gerçek randevu varsa dokunma).
  select exists (select 1 from salon_staff where full_name in ('Ayşe Yılmaz', 'Can Demir'))
     and not exists (select 1 from salon_appointments)
    into v_had_demo;

  if v_had_demo then
    delete from salon_staff where full_name in ('Ayşe Yılmaz', 'Can Demir');
    delete from salon_services where name in ('Saç Kesimi', 'Fön', 'Saç Boyama', 'Sakal Tıraşı');
  end if;
end $$;

-- Tekrar çalıştırılabilir olsun diye adı zaten var olan hizmet atlanır
-- (salon_services.name üzerinde unique kısıt yok, bu kalıp her salonda yeniden koşacak).
insert into salon_services (name, name_tr, category, category_tr, duration_minutes, price_cents, sort_order)
select v.name, v.name_tr, v.category, v.category_tr, v.duration_minutes, v.price_cents, v.sort_order
from (values
  ('Shampoing + coupe',        'Şampuan + saç kesimi',  'Coupe',   'Saç Kesimi', 30, 1600, 1),
  ('Coupe sans shampoing',     'Şampuansız kesim',      'Coupe',   'Saç Kesimi', 25, 1500, 2),
  ('Coupe enfant',             'Çocuk kesimi',          'Coupe',   'Saç Kesimi', 20, 1200, 3),
  ('Barbe seule',              'Sadece sakal',          'Barbe',   'Sakal',      15, 1000, 4),
  ('Coupe + barbe',            'Kesim + sakal',         'Forfait', 'Paket',      45, 2500, 5),
  ('Coupe + barbe + masque',   'Kesim + sakal + maske', 'Forfait', 'Paket',      60, 3000, 6),
  ('Coloration barbe',         'Sakal boyama',          'Forfait', 'Paket',      30, 2000, 7),
  ('Masque visage argile',     'Kil yüz maskesi',       'Soins',   'Bakım',      15, 1000, 8),
  ('Forfait complet',          'Komple paket',          'Soins',   'Bakım',      90, 5000, 9)
) as v(name, name_tr, category, category_tr, duration_minutes, price_cents, sort_order)
where not exists (select 1 from salon_services s where s.name = v.name);

-- ---------------------------------------------------------------------------
-- Personel
--
-- DİKKAT: Gerçek berber adları bilinmiyor. Uygulamanın çalışabilmesi için tek bir
-- yer tutucu personel açılıyor; panelden gerçek ad girilmeli.
-- ---------------------------------------------------------------------------

do $$
declare
  v_staff uuid;
  wd int;
begin
  if exists (select 1 from salon_staff) then
    return;
  end if;

  insert into salon_staff (full_name, title, title_tr, sort_order)
  values ('Barbier', 'Barbier', 'Berber', 1)
  returning id into v_staff;

  insert into salon_staff_services (staff_id, service_id)
    select v_staff, id from salon_services;

  -- Pazartesi(1) - Cumartesi(6), 09:00-19:00
  foreach wd in array array[1,2,3,4,5,6] loop
    insert into salon_staff_hours (staff_id, weekday, start_time, end_time)
    values (v_staff, wd, '09:00', '19:00');
  end loop;
end $$;
