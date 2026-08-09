import { useSalon } from '../context/SalonContext';

// KALIP NOTU: interior-*.jpg salona özeldir (favicon.svg / storefront-*.jpg ile
// aynı kategoride). Yeni salonda bu dosyalar değişir, kod değişmez.
// Görsel yoksa bölüm hiç render edilmesin diye liste burada sabit tutuluyor.
// Boyutlar gerçek dosyalarla eşleşmeli: yanlış height düzen kaymasına yol açar.
const SHOTS = [
  { src: '/interior-1.jpg', w: 900, h: 497 },
  { src: '/interior-2.jpg', w: 900, h: 339 },
  { src: '/interior-3.jpg', w: 900, h: 339 },
];

export default function SalonGallery() {
  const { t } = useSalon();
  if (SHOTS.length === 0) return null;

  return (
    <section className="section">
      <h2 className="section-title">{t('home.gallery')}</h2>
      {/* Yatay kaydırmalı şerit: mobilde üç görseli alt alta dizmek sayfayı
          gereksiz uzatıyordu, kaydırma parmakla daha doğal. */}
      <div className="gallery-strip">
        {SHOTS.map(function (shot, i) {
          return (
            <img
              key={shot.src}
              className="gallery-shot"
              src={shot.src}
              alt={t('home.galleryAlt') + ' ' + (i + 1)}
              loading="lazy"
              width={shot.w}
              height={shot.h}
            />
          );
        })}
      </div>
    </section>
  );
}
