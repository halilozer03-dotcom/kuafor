import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { fetchSettings } from '../lib/api';
import { configured } from '../lib/firebase';
import { DEFAULT_LANG, DICT, LANGS, LOCALES } from '../i18n/dict';

const STORAGE_KEY = 'salon_lang';

const SalonContext = createContext(null);

function detectLang() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (LANGS.indexOf(saved) !== -1) return saved;
  } catch (e) {
    // localStorage kapalı olabilir (gizli sekme); sessizce varsayılana düş.
  }
  const nav = (navigator.language || '').toLowerCase();
  return nav.indexOf('tr') === 0 ? 'tr' : DEFAULT_LANG;
}

export function SalonProvider({ children }) {
  const [lang, setLangState] = useState(detectLang);
  const [settings, setSettings] = useState(null);
  const [settingsErr, setSettingsErr] = useState(null);

  useEffect(function () {
    if (!configured) return;
    fetchSettings()
      .then(setSettings)
      .catch(function (e) { setSettingsErr(e.message || String(e)); });
  }, []);

  useEffect(function () {
    document.documentElement.lang = lang;
  }, [lang]);

  function setLang(next) {
    if (LANGS.indexOf(next) === -1) return;
    setLangState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch (e) {
      // yoksay
    }
  }

  const value = useMemo(function () {
    const locale = LOCALES[lang] || LOCALES[DEFAULT_LANG];
    const table = DICT[lang] || DICT[DEFAULT_LANG];

    // Arayüz metni. Anahtar bulunamazsa anahtarın kendisini döndür ki eksik
    // çeviri ekranda sessizce boşluk değil, gözle görülür bir iz bıraksın.
    function t(key) {
      const hit = table[key];
      if (hit !== undefined) return hit;
      const fallback = DICT[DEFAULT_LANG][key];
      return fallback !== undefined ? fallback : key;
    }

    // Veritabanı metni. Temel kolon (name, slogan...) Fransızca kanonik metindir;
    // Türkçe seçiliyken varsa <alan>_tr kullanılır, yoksa temele düşülür.
    function loc(row, field) {
      if (!row) return '';
      if (lang === 'tr') {
        const tr = row[field + '_tr'];
        if (tr !== null && tr !== undefined && String(tr).trim() !== '') return tr;
      }
      return row[field] || '';
    }

    // Panel Fransızcadır (bu salonun sahibi Fransız, Türkçe bilmiyor). Müşteri
    // tarafındaki dil anahtarı panelin içeriğini çevirmemeli — panel her zaman
    // aynı (temel/kanonik) metni gösterir, müşterinin FR/TR seçimi onu etkilemez.
    function locAdmin(row, field) {
      if (!row) return '';
      return row[field] || '';
    }

    function tAdmin(key) {
      const hit = DICT.fr[key];
      return hit !== undefined ? hit : key;
    }

    return {
      lang,
      setLang,
      t,
      loc,
      locAdmin,
      tAdmin,
      adminLocale: LOCALES.fr,
      locale,
      currency: (settings && settings.currency) || 'EUR',
      settings,
      settingsErr,
      // Abonelik kapalıysa müşteri tarafı kilitlenir. Bu yalnızca görsel katman;
      // gerçek engel firestore.rules'ta (settings/main.subscription_active
      // istemciden değiştirilemez) ve slots.js/availableSlots içinde.
      locked: Boolean(settings) && settings.subscription_active === false,
    };
  }, [lang, settings, settingsErr]);

  return <SalonContext.Provider value={value}>{children}</SalonContext.Provider>;
}

export function useSalon() {
  const ctx = useContext(SalonContext);
  if (!ctx) throw new Error('useSalon, SalonProvider içinde kullanılmalı');
  return ctx;
}
