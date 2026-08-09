import { useSalon } from '../context/SalonContext';
import { LANG_LABELS, LANGS } from '../i18n/dict';

export default function LangSwitch() {
  const { lang, setLang } = useSalon();

  return (
    <div className="lang-switch" role="group" aria-label="Langue / Dil">
      {LANGS.map(function (code) {
        return (
          <button
            key={code}
            type="button"
            className={'lang-btn' + (lang === code ? ' on' : '')}
            aria-pressed={lang === code}
            onClick={function () { setLang(code); }}
          >
            {LANG_LABELS[code]}
          </button>
        );
      })}
    </div>
  );
}
