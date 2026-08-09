// Para birimi salona özeldir (kalıp başka ülkelerde de kurulabilir), bu yüzden
// salon_settings.currency'den gelir. Varsayılan EUR — ilk salon Fransa'da.
export function fmtPrice(cents, locale, currency) {
  return (cents / 100).toLocaleString(locale || 'fr-FR', {
    style: 'currency',
    currency: currency || 'EUR',
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
  });
}

// Form etiketlerinde "Fiyat (€)" gibi kullanmak için; kod bilinmiyorsa kodun
// kendisini döndürür.
export function currencySymbol(currency, locale) {
  try {
    const parts = new Intl.NumberFormat(locale || 'fr-FR', {
      style: 'currency',
      currency: currency || 'EUR',
    }).formatToParts(0);
    const hit = parts.find(function (p) { return p.type === 'currency'; });
    return hit ? hit.value : currency;
  } catch (e) {
    return currency || '';
  }
}
