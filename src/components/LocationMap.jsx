import { useSalon } from '../context/SalonContext';

// API anahtarı gerektirmeyen ücretsiz Google Haritalar gömme yöntemi
// (output=embed) — Maps JavaScript/Embed API faturalandırması devreye girmez.
export default function LocationMap() {
  const { t, settings } = useSalon();
  const address = settings && settings.address;
  if (!address) return null;

  const q = encodeURIComponent(address);

  return (
    <section className="section">
      <h2 className="section-title">{t('home.location')}</h2>
      <div className="map-embed">
        <iframe
          title={address}
          src={`https://www.google.com/maps?q=${q}&output=embed`}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>
      <a
        className="btn btn-ghost btn-block map-directions"
        href={`https://www.google.com/maps/search/?api=1&query=${q}`}
        target="_blank"
        rel="noopener noreferrer"
      >
        📍 {address} — {t('home.directions')}
      </a>
    </section>
  );
}
