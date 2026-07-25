export default function Modal({ title, onClose, children }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={function (e) { e.stopPropagation(); }}>
        <div className="modal-head">
          <h2>{title}</h2>
          <button className="x-btn" onClick={onClose}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}
