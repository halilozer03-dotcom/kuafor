// Müşteri tarafı sözlüğü (FR/TR). Panel artık FRANSIZCA: bu salonun sahibi
// Fransız ve Türkçe bilmiyor. Panel metinleri bileşenlerin içinde sabit,
// buradaki fr tablosunu tAdmin() üzerinden ödünç alır (bkz. SalonContext).
//
// Kalıp notu: burada salona özel hiçbir metin olmamalı (salon adı, hizmet adı,
// telefon...). Onlar veritabanından gelir. Burası yalnızca arayüz metinleri.

export const LANGS = ['fr', 'tr'];
export const DEFAULT_LANG = 'fr';

export const LANG_LABELS = { fr: 'FR', tr: 'TR' };
export const LOCALES = { fr: 'fr-FR', tr: 'tr-TR' };

export const DICT = {
  fr: {
    'nav.book': 'Prendre rendez-vous',
    'nav.home': "Retour à l'accueil",

    'home.services': 'Nos prestations',
    'home.about': 'À propos',
    'home.location': 'Nous trouver',
    'home.directions': "Itinéraire",
    'home.bannerAlt': 'Devanture du salon',
    'home.gallery': 'Le salon',
    'home.galleryAlt': 'Intérieur du salon',
    'home.heroFallback': 'Choisissez votre prestation, votre barbier et votre créneau en quelques secondes.',

    'common.loading': 'Chargement…',
    'common.error': "Une erreur est survenue.",
    'common.back': 'Retour',
    'common.continue': 'Continuer',
    'common.other': 'Autres',

    'step1.title': 'Choisissez une prestation',
    'step1.hint': 'Commencez par sélectionner la prestation souhaitée.',
    'step2.title': 'Choisissez votre barbier',
    'step2.hint': 'Sélectionnez le barbier qui réalisera cette prestation.',
    'step3.title': "Choisissez la date et l'heure",
    'step3.hint': 'Sélectionnez le jour et le créneau qui vous conviennent.',
    'step4.title': 'Vos coordonnées',
    'step4.hint': 'Renseignez vos coordonnées pour confirmer le rendez-vous.',

    'staff.any': 'Peu importe',
    'staff.anyHint': 'Premier barbier disponible',
    'staff.none': 'Aucun barbier ne propose cette prestation.',

    'slots.loading': 'Recherche des créneaux disponibles…',
    'slots.empty': 'Aucun créneau disponible ce jour. Essayez une autre date.',

    'info.name': 'Nom et prénom *',
    'info.namePh': 'Votre nom et prénom',
    'info.nameErr': 'Le nom et prénom sont obligatoires',
    'info.phone': 'Téléphone *',
    'info.phonePh': '06 12 34 56 78',
    'info.phoneErr': 'Le numéro de téléphone est obligatoire',
    'info.email': 'E-mail (facultatif)',
    'info.emailPh': 'exemple@email.com',
    'info.notes': 'Remarque (facultatif)',
    'info.notesPh': 'Une précision à nous transmettre ?',

    'summary.service': 'Prestation',
    'summary.duration': 'Durée',
    'summary.staff': 'Barbier',
    'summary.date': 'Date',
    'summary.time': 'Heure',
    'summary.total': 'Total',

    'book.submit': 'Confirmer le rendez-vous',
    'book.submitting': 'Envoi en cours…',

    'confirm.title': 'Votre rendez-vous est confirmé !',
    'confirm.sub': 'Voici le récapitulatif de votre rendez-vous. Au plaisir de vous accueillir.',

    'lock.title': 'Réservation en ligne indisponible',
    'lock.body': 'La prise de rendez-vous en ligne est momentanément suspendue. Vous pouvez nous joindre par téléphone.',

    'time.min': 'min',
    'time.hour': 'h',
  },

  tr: {
    'nav.book': 'Randevu Al',
    'nav.home': 'Ana Sayfaya Dön',

    'home.services': 'Hizmetlerimiz',
    'home.about': 'Hakkımızda',
    'home.location': 'Bizi Bulun',
    'home.directions': 'Yol Tarifi Al',
    'home.bannerAlt': 'Salonun dış cephesi',
    'home.gallery': 'Salondan',
    'home.galleryAlt': 'Salonun iç mekânı',
    'home.heroFallback': 'Hizmetinizi, berberinizi ve saatinizi birkaç saniyede seçin.',

    'common.loading': 'Yükleniyor…',
    'common.error': 'Bir şeyler ters gitti.',
    'common.back': 'Geri',
    'common.continue': 'Devam Et',
    'common.other': 'Diğer',

    'step1.title': 'Hizmet seçin',
    'step1.hint': 'Almak istediğiniz hizmeti seçerek başlayın.',
    'step2.title': 'Berberinizi seçin',
    'step2.hint': 'Bu hizmeti verecek berberi seçin.',
    'step3.title': 'Tarih ve saat seçin',
    'step3.hint': 'Size uygun günü ve saati seçin.',
    'step4.title': 'Bilgilerinizi girin',
    'step4.hint': 'Randevunuzu onaylamak için iletişim bilgilerinizi girin.',

    'staff.any': 'Farketmez',
    'staff.anyHint': 'İlk uygun berber',
    'staff.none': 'Bu hizmeti verebilecek berber bulunamadı.',

    'slots.loading': 'Uygun saatler yükleniyor…',
    'slots.empty': 'Bu tarihte uygun saat yok. Başka bir gün deneyin.',

    'info.name': 'Ad Soyad *',
    'info.namePh': 'Adınız Soyadınız',
    'info.nameErr': 'Ad soyad gerekli',
    'info.phone': 'Telefon *',
    'info.phonePh': '06 12 34 56 78',
    'info.phoneErr': 'Telefon numarası gerekli',
    'info.email': 'E-posta (opsiyonel)',
    'info.emailPh': 'ornek@eposta.com',
    'info.notes': 'Not (opsiyonel)',
    'info.notesPh': 'Eklemek istediğiniz bir not var mı?',

    'summary.service': 'Hizmet',
    'summary.duration': 'Süre',
    'summary.staff': 'Berber',
    'summary.date': 'Tarih',
    'summary.time': 'Saat',
    'summary.total': 'Toplam',

    'book.submit': 'Randevuyu Onayla',
    'book.submitting': 'Gönderiliyor…',

    'confirm.title': 'Randevunuz alındı!',
    'confirm.sub': 'Randevu detaylarınız aşağıdadır. Sizi salonumuzda görmekten mutluluk duyarız.',

    'lock.title': 'Online randevu kapalı',
    'lock.body': 'Online randevu alma geçici olarak durduruldu. Bize telefonla ulaşabilirsiniz.',

    'time.min': 'dk',
    'time.hour': 'sa',
  },
};
