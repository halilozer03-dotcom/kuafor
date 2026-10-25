import { useEffect } from 'react';

export default function Modal({ title, onClose, children }) {
  // ESC ile kapanma + arkadaki sayfanın kaymasını engelleme. Alt sayfa (bottom
  // sheet) biçiminde açıldığı için mobilde arkadaki liste kayarsa kullanıcı
  // modalı kapattığında yerini kaybediyordu.
  useEffect(function () {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    function onKey(e) { if (e.key === 'Escape') onClose(); }
    document.addEventListener('keydown', onKey);
    return function () {
      document.body.style.overflow = prev;
      document.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={title} onClick={function (e) { e.stopPropagation(); }}>
        <div className="modal-head">
          <h2>{title}</h2>
          <button className="x-btn" aria-label="Fermer" onClick={onClose}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}
